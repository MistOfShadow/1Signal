import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "exclamationmark.triangle", selected: "exclamationmark.triangle.fill" }} />
        <Label>Emergency</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assistant">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>AI Help</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nearby">
        <Icon sf={{ default: "location", selected: "location.fill" }} />
        <Label>Nearby</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="firstaid">
        <Icon sf={{ default: "cross.case", selected: "cross.case.fill" }} />
        <Label>First Aid</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="contacts">
        <Icon sf={{ default: "phone.badge.plus", selected: "phone.badge.plus.fill" } as any} />
        <Label>Contacts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="offline">
        <Icon sf={{ default: "wifi.slash", selected: "wifi.slash" }} />
        <Label>Offline</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 64,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 8 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="exclamationmark.triangle.fill" tintColor={color} size={size} />
            ) : (
              <Ionicons name="warning" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "AI Help",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="message.fill" tintColor={color} size={size} />
            ) : (
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: "Nearby",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="location.fill" tintColor={color} size={size} />
            ) : (
              <Ionicons name="location" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="firstaid"
        options={{
          title: "First Aid",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="cross.case.fill" tintColor={color} size={size} />
            ) : (
              <Ionicons name="medkit" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="phone.badge.plus" tintColor={color} size={size} />
            ) : (
              <Ionicons name="call" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="offline"
        options={{
          title: "Offline",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="wifi.slash" tintColor={color} size={size} />
            ) : (
              <Ionicons name="map" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
