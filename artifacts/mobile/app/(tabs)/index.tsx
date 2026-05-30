import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

interface ServiceCard {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  query: string;
}

const SERVICES: ServiceCard[] = [
  { id: "hospital", label: "Hospital", icon: "medkit", color: "#E63946", query: "hospital" },
  { id: "police", label: "Police", icon: "shield", color: "#1A56DB", query: "police station" },
  { id: "mechanic", label: "Auto Repair", icon: "construct", color: "#F59E0B", query: "auto repair" },
  { id: "tow", label: "Tow Truck", icon: "car", color: "#10B981", query: "tow truck" },
];

function PulseRing({ size, delay, color }: { size: number; delay: number; color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(1.8, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function ServiceCardItem({ service }: { service: ServiceCard }) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lat = "";
    const isIOS = Platform.OS === "ios";
    const url = isIOS
      ? `maps://?q=${encodeURIComponent(service.query + " near me")}`
      : `https://maps.google.com/?q=${encodeURIComponent(service.query + " near me")}`;
    Linking.openURL(url);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.serviceCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.serviceIconBg, { backgroundColor: service.color + "22" }]}>
        <Ionicons name={service.icon} size={26} color={service.color} />
      </View>
      <Text style={[styles.serviceLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        {service.label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Linking.openURL("tel:911");
  };

  const handle112 = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Linking.openURL("tel:112");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#1A0A12", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <View style={[styles.badgeDot, { backgroundColor: "#10B981" }]} />
            <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Emergency Ready
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={[styles.appTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            CrashCare
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Immediate help after an accident
          </Text>
        </View>

        <View style={styles.emergencyRow}>
          <View style={styles.sosContainer}>
            <PulseRing size={160} delay={0} color={colors.primary} />
            <PulseRing size={160} delay={600} color={colors.primary} />
            <Pressable
              style={({ pressed }) => [
                styles.sosButton,
                {
                  backgroundColor: colors.primary,
                  ...(Platform.OS !== "web"
                    ? {
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 24,
                        elevation: 12,
                      }
                    : {}),
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
              onPress={handleSOS}
            >
              <Ionicons name="call" size={34} color="#fff" />
              <Text style={[styles.sosLabel, { fontFamily: "Inter_700Bold" }]}>SOS 911</Text>
            </Pressable>
          </View>

          <View style={styles.sosContainer}>
            <PulseRing size={160} delay={300} color="#FF6B00" />
            <PulseRing size={160} delay={900} color="#FF6B00" />
            <Pressable
              style={({ pressed }) => [
                styles.sosButton,
                {
                  backgroundColor: "#FF6B00",
                  ...(Platform.OS !== "web"
                    ? {
                        shadowColor: "#FF6B00",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 24,
                        elevation: 12,
                      }
                    : {}),
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                },
              ]}
              onPress={handle112}
            >
              <Ionicons name="medkit" size={34} color="#fff" />
              <Text style={[styles.sosLabel, { fontFamily: "Inter_700Bold" }]}>112</Text>
              <Text style={[styles.sosSubLabel, { fontFamily: "Inter_500Medium" }]}>Medical</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          FIND NEARBY
        </Text>

        <View style={styles.servicesGrid}>
          {SERVICES.map((s) => (
            <ServiceCardItem key={s.id} service={s} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.aiButton,
            { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/assistant");
          }}
        >
          <View style={[styles.aiIconBg, { backgroundColor: colors.accent + "22" }]}>
            <Ionicons name="sparkles" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              AI Emergency Assistant
            </Text>
            <Text style={[styles.aiDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Get step-by-step guidance right now
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#10B98122",
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12 },
  titleSection: { marginBottom: 40 },
  appTitle: { fontSize: 36, letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 4 },
  emergencyRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 44,
  },
  sosContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    height: 200,
  },
  sosButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sosLabel: { color: "#fff", fontSize: 16, letterSpacing: 1 },
  sosSubLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 12 },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  serviceCard: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    alignItems: "flex-start",
    gap: 12,
  },
  serviceIconBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 15 },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  aiIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: { fontSize: 15, marginBottom: 2 },
  aiDesc: { fontSize: 13 },
});
