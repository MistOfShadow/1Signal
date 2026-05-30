import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const QUICK_PROMPTS = [
  "I was just in an accident",
  "Someone is injured",
  "My car won't start",
  "I need a tow truck",
];

function MessageBubble({ message, colors }: { message: ChatMessage; colors: ReturnType<typeof useColors> }) {
  const isUser = message.role === "user";

  const parseMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split("**");
    return parts.map((part, index) => {
      const isBold = index % 2 === 1;
      return (
        <Text
          key={index}
          style={{
            fontFamily: isBold ? "Inter_700Bold" : "Inter_400Regular",
            fontWeight: isBold ? "bold" : "normal",
          }}
        >
          {part}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.accent + "22" }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            maxWidth: "78%",
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: colors.foreground },
          ]}
        >
          {parseMarkdown(message.content)}
          {message.streaming && (
            <Text style={{ color: colors.accent }}>▋</Text>
          )}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I'm CrashCare, your emergency AI assistant. I'm here to help guide you through the next steps after your accident.\n\nAre you safe? Is anyone injured?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      const assistantId = `a_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [assistantMsg, userMsg, ...prev]);
      setInput("");
      setLoading(true);

      const historyForApi = [userMsg, ...messages]
        .slice(0, 20)
        .reverse()
        .map(({ role, content }) => ({ role, content }));

      try {
        const getApiUrl = () => {
          if (Platform.OS === "web") {
            const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
            if (host === "localhost" || host === "127.0.0.1") {
              return `http://localhost:8080/api/emergency-chat`;
            }
            const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
            return `${protocol}//${host}/api/emergency-chat`;
          }

          if (process.env.EXPO_PUBLIC_DOMAIN) return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/emergency-chat`;

          return `http://localhost:8080/api/emergency-chat`;
        };

        const response = await fetch(getApiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: historyForApi }),
          }
        );

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            try {
              const parsed = JSON.parse(data) as {
                content?: string;
                done?: boolean;
                error?: string;
              };
              const cleanContent = (text: string) => {
                let cleaned = text.replace(/<<<JSON>>>[\s\S]*?(<<<\/JSON>>>|$)/g, "");
                cleaned = cleaned.replace(/^\s*[\*\-•★]\s+/gm, "");
                return cleaned.trim();
              };

              if (parsed.content) {
                fullContent += parsed.content;
                const snap = cleanContent(fullContent);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: snap, streaming: true }
                      : m
                  )
                );
              }
              if (parsed.done || parsed.error) {
                const finalContent = parsed.error
                  ? parsed.error
                  : cleanContent(fullContent);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: finalContent, streaming: false }
                      : m
                  )
                );

                // If the server included structured data, render it as an assistant message
                if ((parsed as any).structured) {
                  const s = (parsed as any).structured;
                  if (s.summary && Array.isArray(s.actions) && s.actions.length > 0) {
                    const structuredText = [] as string[];
                    structuredText.push(`Summary: ${s.summary}`);
                    structuredText.push(`Recommended Actions:`);
                    structuredText.push(...s.actions.map((a: string) => `**${a}**`));

                    const structuredMsg: ChatMessage = {
                      id: `${assistantId}_structured`,
                      role: "assistant",
                      content: structuredText.join("\n"),
                    };

                    setMessages((prev) => [structuredMsg, ...prev]);
                  }
                }
              }
            } catch {
              // ignore parse error
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Connection error. Please check your internet and try again.",
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.headerIcon, { backgroundColor: colors.accent + "22" }]}>
          <Ionicons name="sparkles" size={18} color={colors.accent} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            AI Assistant
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Powered by Google Gemini
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} colors={colors} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 12 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            loading ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.typingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Thinking...
                </Text>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable
                key={prompt}
                style={({ pressed }) => [
                  styles.quickChip,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={[styles.quickChipText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 70,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.secondary,
                color: colors.foreground,
                borderColor: colors.border,
                fontFamily: "Inter_400Regular",
              },
            ]}
            placeholder="Describe your situation..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: input.trim() && !loading ? colors.primary : colors.muted,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17 },
  headerSub: { fontSize: 12, marginTop: 1 },
  listContent: { padding: 16, gap: 12 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 3,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 36,
    paddingBottom: 8,
  },
  typingText: { fontSize: 14 },
  quickPrompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
