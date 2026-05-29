import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

interface ServiceCategory {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iosQuery: string;
  googleQuery: string;
  phone?: string;
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: "hospital",
    label: "Hospital",
    description: "Emergency rooms & urgent care",
    icon: "medkit",
    color: "#E63946",
    iosQuery: "hospital",
    googleQuery: "hospital+emergency+room",
  },
  {
    id: "police",
    label: "Police Station",
    description: "File an accident report",
    icon: "shield-checkmark",
    color: "#1A56DB",
    iosQuery: "police+station",
    googleQuery: "police+station",
  },
  {
    id: "mechanic",
    label: "Auto Repair",
    description: "Mechanics & body shops",
    icon: "construct",
    color: "#F59E0B",
    iosQuery: "auto+repair",
    googleQuery: "auto+repair+shop",
  },
  {
    id: "tow",
    label: "Tow Truck",
    description: "Vehicle recovery & towing",
    icon: "car-sport",
    color: "#10B981",
    iosQuery: "tow+truck",
    googleQuery: "tow+truck+service",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    description: "First aid & medications",
    icon: "fitness",
    color: "#8B5CF6",
    iosQuery: "pharmacy",
    googleQuery: "pharmacy",
  },
  {
    id: "insurance",
    label: "Insurance Agent",
    description: "File your claim quickly",
    icon: "document-text",
    color: "#EC4899",
    iosQuery: "insurance+office",
    googleQuery: "insurance+office",
  },
];

interface LocationCoords {
  latitude: number;
  longitude: number;
}

function CategoryCard({
  category,
  location,
}: {
  category: ServiceCategory;
  location: LocationCoords | null;
}) {
  const colors = useColors();

  const handleOpen = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isIOS = Platform.OS === "ios";

    if (location) {
      const { latitude, longitude } = location;
      const url = isIOS
        ? `maps://?q=${category.iosQuery}&sll=${latitude},${longitude}&z=14`
        : `https://maps.google.com/?q=${category.googleQuery}&near=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      const url = isIOS
        ? `maps://?q=${category.iosQuery}`
        : `https://maps.google.com/?q=${category.googleQuery}+near+me`;
      Linking.openURL(url);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={handleOpen}
    >
      <View style={[styles.iconBg, { backgroundColor: category.color + "20" }]}>
        <Ionicons name={category.icon} size={28} color={category.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {category.label}
        </Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {category.description}
        </Text>
      </View>
      <View style={[styles.openBadge, { backgroundColor: category.color + "18" }]}>
        <Ionicons name="navigate" size={14} color={category.color} />
      </View>
    </Pressable>
  );
}

export default function NearbyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    if (Platform.OS === "web") {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocationStatus("granted");
        },
        () => setLocationStatus("denied")
      );
      return;
    }

    setLocationStatus("loading");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationStatus("denied");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    setLocationStatus("granted");
  };

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
          <Ionicons name="location" size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Nearby Services
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {locationStatus === "granted"
              ? "Location detected — showing nearby options"
              : locationStatus === "denied"
              ? "Enable location for better results"
              : "Finding your location..."}
          </Text>
        </View>
        {locationStatus === "denied" && (
          <Pressable onPress={requestLocation}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          TAP TO OPEN IN MAPS
        </Text>
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} category={cat} location={location} />
        ))}
      </ScrollView>
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
  list: {
    padding: 16,
    gap: 10,
  },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 4,
  },
  iconBg: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, marginBottom: 3 },
  cardDesc: { fontSize: 13 },
  openBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
