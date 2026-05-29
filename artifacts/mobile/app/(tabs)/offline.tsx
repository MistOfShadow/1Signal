import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const SAVED_KEY = "crashcare_saved_facilities";

export type FacilityType = "hospital" | "police" | "fire" | "clinic" | "pharmacy";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
}

const TYPE_META: Record<FacilityType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  hospital: { icon: "medical", color: "#E63946", label: "Hospital" },
  police: { icon: "shield-checkmark", color: "#1A56DB", label: "Police" },
  fire: { icon: "flame", color: "#FF6B00", label: "Fire Station" },
  clinic: { icon: "bandage", color: "#10B981", label: "Clinic" },
  pharmacy: { icon: "fitness", color: "#8B5CF6", label: "Pharmacy" },
};

// ─── Comprehensive Offline Facility Database ───────────────────────────────
const ALL_FACILITIES: Facility[] = [
  // ── United States — New York City ──
  { id: "nyp-weill", name: "NewYork-Presbyterian / Weill Cornell", type: "hospital", address: "525 E 68th St", city: "New York", country: "US", lat: 40.7648, lng: -73.9549, phone: "+12127464321" },
  { id: "bellevue", name: "Bellevue Hospital Center", type: "hospital", address: "462 1st Ave", city: "New York", country: "US", lat: 40.7396, lng: -73.9756, phone: "+12125623535" },
  { id: "mount-sinai", name: "Mount Sinai Hospital", type: "hospital", address: "1 Gustave L Levy Pl", city: "New York", country: "US", lat: 40.7900, lng: -73.9526, phone: "+12122414141" },
  { id: "nyc-police-midtown", name: "NYPD Midtown North Precinct", type: "police", address: "306 W 54th St", city: "New York", country: "US", lat: 40.7645, lng: -73.9896, phone: "+12123740411" },
  { id: "nyc-fire-10", name: "FDNY Engine 10 / Ladder 10", type: "fire", address: "124 Liberty St", city: "New York", country: "US", lat: 40.7094, lng: -74.0104, phone: "+12124737100" },
  { id: "lenox-hill", name: "Lenox Hill Hospital", type: "hospital", address: "100 E 77th St", city: "New York", country: "US", lat: 40.7738, lng: -73.9563, phone: "+12123342000" },

  // ── United States — Los Angeles ──
  { id: "cedars-sinai", name: "Cedars-Sinai Medical Center", type: "hospital", address: "8700 Beverly Blvd", city: "Los Angeles", country: "US", lat: 34.0750, lng: -118.3803, phone: "+13104234221" },
  { id: "ucla-medical", name: "UCLA Medical Center", type: "hospital", address: "757 Westwood Plaza", city: "Los Angeles", country: "US", lat: 34.0664, lng: -118.4457, phone: "+13108253136" },
  { id: "lacusc", name: "LAC+USC Medical Center", type: "hospital", address: "2051 Marengo St", city: "Los Angeles", country: "US", lat: 34.0551, lng: -118.2194, phone: "+13233097100" },
  { id: "lapd-central", name: "LAPD Central Division", type: "police", address: "251 E 6th St", city: "Los Angeles", country: "US", lat: 34.0438, lng: -118.2446, phone: "+12138339900" },
  { id: "lafd-27", name: "LAFD Station 27", type: "fire", address: "1234 N Cahuenga Blvd", city: "Los Angeles", country: "US", lat: 34.0981, lng: -118.3385, phone: "+18003421234" },

  // ── United States — Chicago ──
  { id: "northwestern-chicago", name: "Northwestern Memorial Hospital", type: "hospital", address: "251 E Huron St", city: "Chicago", country: "US", lat: 41.8954, lng: -87.6212, phone: "+13122264000" },
  { id: "rush-chicago", name: "Rush University Medical Center", type: "hospital", address: "1620 W Harrison St", city: "Chicago", country: "US", lat: 41.8736, lng: -87.6705, phone: "+13129422000" },
  { id: "cpd-1st", name: "Chicago Police 1st District", type: "police", address: "1718 S State St", city: "Chicago", country: "US", lat: 41.8571, lng: -87.6277, phone: "+13127451212" },
  { id: "cfd-3", name: "Chicago Fire Station 3", type: "fire", address: "558 W DeKoven St", city: "Chicago", country: "US", lat: 41.8696, lng: -87.6449 },

  // ── United States — Houston ──
  { id: "memorial-houston", name: "Memorial Hermann Hospital", type: "hospital", address: "6411 Fannin St", city: "Houston", country: "US", lat: 29.7077, lng: -95.3976, phone: "+17137042000" },
  { id: "ben-taub", name: "Ben Taub General Hospital", type: "hospital", address: "1504 Taub Loop", city: "Houston", country: "US", lat: 29.7082, lng: -95.4004, phone: "+17139702000" },
  { id: "hpd-central", name: "Houston Police Central Station", type: "police", address: "61 Riesner St", city: "Houston", country: "US", lat: 29.7636, lng: -95.3766, phone: "+17138842222" },

  // ── United States — Miami ──
  { id: "jackson-miami", name: "Jackson Memorial Hospital", type: "hospital", address: "1611 NW 12th Ave", city: "Miami", country: "US", lat: 25.7897, lng: -80.2109, phone: "+13055851234" },
  { id: "mpd-central", name: "Miami Police Dept – Headquarters", type: "police", address: "400 NW 2nd Ave", city: "Miami", country: "US", lat: 25.7747, lng: -80.1970, phone: "+13053791565" },
  { id: "mercy-miami", name: "Mercy Hospital", type: "hospital", address: "3663 S Miami Ave", city: "Miami", country: "US", lat: 25.7437, lng: -80.2136, phone: "+13058543535" },

  // ── United States — Dallas ──
  { id: "parkland-dallas", name: "Parkland Memorial Hospital", type: "hospital", address: "5201 Harry Hines Blvd", city: "Dallas", country: "US", lat: 32.8077, lng: -96.8434, phone: "+12145901000" },
  { id: "baylor-dallas", name: "Baylor University Medical Center", type: "hospital", address: "3500 Gaston Ave", city: "Dallas", country: "US", lat: 32.7855, lng: -96.7722, phone: "+12148208000" },
  { id: "dpd-central", name: "Dallas Police Headquarters", type: "police", address: "1400 S Lamar St", city: "Dallas", country: "US", lat: 32.7729, lng: -96.7929, phone: "+12144950401" },

  // ── United States — Seattle ──
  { id: "harborview-seattle", name: "Harborview Medical Center", type: "hospital", address: "325 9th Ave", city: "Seattle", country: "US", lat: 47.6024, lng: -122.3294, phone: "+12067442000" },
  { id: "uwmc-seattle", name: "UW Medical Center", type: "hospital", address: "1959 NE Pacific St", city: "Seattle", country: "US", lat: 47.6496, lng: -122.3072, phone: "+12065985000" },
  { id: "spd-west", name: "Seattle Police West Precinct", type: "police", address: "810 Virginia St", city: "Seattle", country: "US", lat: 47.6142, lng: -122.3362, phone: "+12066255011" },

  // ── United States — Phoenix ──
  { id: "banner-phoenix", name: "Banner – University Medical Center", type: "hospital", address: "1111 E McDowell Rd", city: "Phoenix", country: "US", lat: 33.4784, lng: -112.0636, phone: "+16023234000" },
  { id: "st-josephs-phoenix", name: "St. Joseph's Hospital", type: "hospital", address: "350 W Thomas Rd", city: "Phoenix", country: "US", lat: 33.4801, lng: -112.0827, phone: "+16024062000" },
  { id: "ppd-central", name: "Phoenix Police Central", type: "police", address: "620 W Washington St", city: "Phoenix", country: "US", lat: 33.4487, lng: -112.0774, phone: "+16026222111" },

  // ── United States — Boston ──
  { id: "mass-general", name: "Massachusetts General Hospital", type: "hospital", address: "55 Fruit St", city: "Boston", country: "US", lat: 42.3632, lng: -71.0688, phone: "+16177246200" },
  { id: "brigham-womens", name: "Brigham and Women's Hospital", type: "hospital", address: "75 Francis St", city: "Boston", country: "US", lat: 42.3361, lng: -71.1061, phone: "+16177328000" },
  { id: "bpd-1", name: "Boston Police District A-1", type: "police", address: "40 New Sudbury St", city: "Boston", country: "US", lat: 42.3605, lng: -71.0586, phone: "+16173433204" },

  // ── United States — Atlanta ──
  { id: "grady-atlanta", name: "Grady Memorial Hospital", type: "hospital", address: "80 Jesse Hill Jr Dr SE", city: "Atlanta", country: "US", lat: 33.7479, lng: -84.3847, phone: "+14046169000" },
  { id: "emory-midtown", name: "Emory University Hospital Midtown", type: "hospital", address: "550 Peachtree St NE", city: "Atlanta", country: "US", lat: 33.7705, lng: -84.3877, phone: "+14048740123" },
  { id: "apd-central", name: "Atlanta Police Zone 5 Precinct", type: "police", address: "2025 Hosea L Williams Dr NE", city: "Atlanta", country: "US", lat: 33.7672, lng: -84.3413, phone: "+14046148100" },

  // ── United States — Las Vegas ──
  { id: "sunrise-lv", name: "Sunrise Hospital & Medical Center", type: "hospital", address: "3186 Maryland Pkwy", city: "Las Vegas", country: "US", lat: 36.1452, lng: -115.1252, phone: "+17023315000" },
  { id: "umc-lv", name: "University Medical Center", type: "hospital", address: "1800 W Charleston Blvd", city: "Las Vegas", country: "US", lat: 36.1671, lng: -115.1750, phone: "+17023831234" },
  { id: "lvmpd-central", name: "LVMPD – Las Vegas Metro Police", type: "police", address: "400 S Martin Luther King Blvd", city: "Las Vegas", country: "US", lat: 36.1720, lng: -115.1573, phone: "+17027958200" },

  // ── United Kingdom — London ──
  { id: "kings-college-london", name: "King's College Hospital", type: "hospital", address: "Denmark Hill", city: "London", country: "UK", lat: 51.4681, lng: -0.0937, phone: "+442032999000" },
  { id: "royal-london", name: "The Royal London Hospital", type: "hospital", address: "Whitechapel Rd", city: "London", country: "UK", lat: 51.5188, lng: -0.0593, phone: "+442035940990" },
  { id: "stthomas-london", name: "St Thomas' Hospital", type: "hospital", address: "Westminster Bridge Rd", city: "London", country: "UK", lat: 51.4988, lng: -0.1182, phone: "+442071888000" },
  { id: "met-police-west", name: "Metropolitan Police – Westminster", type: "police", address: "Rochester Row", city: "London", country: "UK", lat: 51.4944, lng: -0.1350, phone: "+442072300400" },
  { id: "lfd-soho", name: "London Fire Brigade – Soho", type: "fire", address: "19 Shaftesbury Ave", city: "London", country: "UK", lat: 51.5126, lng: -0.1326 },

  // ── United Kingdom — Manchester ──
  { id: "mri-manchester", name: "Manchester Royal Infirmary", type: "hospital", address: "Oxford Rd", city: "Manchester", country: "UK", lat: 53.4614, lng: -2.2261, phone: "+441612765000" },
  { id: "gmp-central", name: "Greater Manchester Police Central", type: "police", address: "Bootle St", city: "Manchester", country: "UK", lat: 53.4790, lng: -2.2456, phone: "+441618726020" },

  // ── United Kingdom — Birmingham ──
  { id: "qe-birmingham", name: "Queen Elizabeth Hospital Birmingham", type: "hospital", address: "Mindelsohn Way", city: "Birmingham", country: "UK", lat: 52.4527, lng: -1.9434, phone: "+441213712000" },
  { id: "wm-police-bham", name: "West Midlands Police HQ", type: "police", address: "Lloyd House, Colmore Circus", city: "Birmingham", country: "UK", lat: 52.4844, lng: -1.8992, phone: "+441213268000" },

  // ── Canada — Toronto ──
  { id: "sunnybrook-toronto", name: "Sunnybrook Health Sciences Centre", type: "hospital", address: "2075 Bayview Ave", city: "Toronto", country: "CA", lat: 43.7233, lng: -79.3768, phone: "+14164802100" },
  { id: "toronto-general", name: "Toronto General Hospital", type: "hospital", address: "200 Elizabeth St", city: "Toronto", country: "CA", lat: 43.6592, lng: -79.3883, phone: "+14163404800" },
  { id: "tps-52", name: "Toronto Police Service – Division 52", type: "police", address: "255 Dundas St E", city: "Toronto", country: "CA", lat: 43.6565, lng: -79.3666, phone: "+14163080400" },

  // ── Canada — Vancouver ──
  { id: "vgh-vancouver", name: "Vancouver General Hospital", type: "hospital", address: "899 W 12th Ave", city: "Vancouver", country: "CA", lat: 49.2631, lng: -123.1239, phone: "+16048754111" },
  { id: "vpd-central", name: "Vancouver Police – Headquarters", type: "police", address: "312 Main St", city: "Vancouver", country: "CA", lat: 49.2818, lng: -123.1035, phone: "+16047174321" },

  // ── Australia — Sydney ──
  { id: "rnsh-sydney", name: "Royal North Shore Hospital", type: "hospital", address: "Reserve Rd", city: "Sydney", country: "AU", lat: -33.8192, lng: 151.1845, phone: "+61299267111" },
  { id: "rpah-sydney", name: "Royal Prince Alfred Hospital", type: "hospital", address: "50 Missenden Rd", city: "Sydney", country: "AU", lat: -33.8899, lng: 151.1853, phone: "+61295156111" },
  { id: "nsw-police-city", name: "NSW Police – Sydney City", type: "police", address: "192 Day St", city: "Sydney", country: "AU", lat: -33.8749, lng: 151.2027, phone: "+61292651899" },

  // ── Australia — Melbourne ──
  { id: "alfred-melbourne", name: "The Alfred Hospital", type: "hospital", address: "55 Commercial Rd", city: "Melbourne", country: "AU", lat: -37.8448, lng: 144.9800, phone: "+61390763000" },
  { id: "rch-melbourne", name: "Royal Children's Hospital", type: "hospital", address: "50 Flemington Rd", city: "Melbourne", country: "AU", lat: -37.7983, lng: 144.9530, phone: "+61393455522" },
  { id: "vp-cbd", name: "Victoria Police – CBD", type: "police", address: "412 St Kilda Rd", city: "Melbourne", country: "AU", lat: -37.8503, lng: 144.9756, phone: "+61392478600" },

  // ── India — Mumbai ──
  { id: "kem-mumbai", name: "KEM Hospital", type: "hospital", address: "Acharya Donde Marg, Parel", city: "Mumbai", country: "IN", lat: 19.0024, lng: 72.8422, phone: "+912224107000" },
  { id: "lilavati-mumbai", name: "Lilavati Hospital", type: "hospital", address: "Bandra Reclamation", city: "Mumbai", country: "IN", lat: 19.0507, lng: 72.8298, phone: "+912226751000" },
  { id: "cooper-mumbai", name: "Cooper Hospital", type: "hospital", address: "Juhu, Vile Parle", city: "Mumbai", country: "IN", lat: 19.1011, lng: 72.8325, phone: "+912226200000" },
  { id: "mumbai-police-ctrl", name: "Mumbai Police – Commissioner HQ", type: "police", address: "Crawford Market", city: "Mumbai", country: "IN", lat: 18.9488, lng: 72.8359, phone: "+912222621855" },

  // ── India — Delhi ──
  { id: "aiims-delhi", name: "AIIMS – All India Institute of Medical Sciences", type: "hospital", address: "Ansari Nagar", city: "Delhi", country: "IN", lat: 28.5673, lng: 77.2100, phone: "+911126588500" },
  { id: "safdarjung-delhi", name: "Safdarjung Hospital", type: "hospital", address: "Sri Aurobindo Marg", city: "Delhi", country: "IN", lat: 28.5687, lng: 77.2061, phone: "+911126165001" },
  { id: "delhi-police-hq", name: "Delhi Police Headquarters", type: "police", address: "Jai Singh Marg", city: "Delhi", country: "IN", lat: 28.6265, lng: 77.2117, phone: "+911123490001" },

  // ── India — Bangalore ──
  { id: "victoria-blr", name: "Victoria Hospital", type: "hospital", address: "K R Market", city: "Bangalore", country: "IN", lat: 12.9699, lng: 77.5706, phone: "+918022975000" },
  { id: "manipal-blr", name: "Manipal Hospital", type: "hospital", address: "98 HAL Airport Rd", city: "Bangalore", country: "IN", lat: 12.9611, lng: 77.6408, phone: "+918025024444" },
  { id: "blr-police-central", name: "Bangalore City Police – Central", type: "police", address: "Infantry Rd", city: "Bangalore", country: "IN", lat: 12.9822, lng: 77.6074, phone: "+918022294100" },

  // ── India — Hyderabad ──
  { id: "osmania-hyd", name: "Osmania General Hospital", type: "hospital", address: "Afzalgunj", city: "Hyderabad", country: "IN", lat: 17.3864, lng: 78.4764, phone: "+914027752701" },
  { id: "nims-hyd", name: "NIMS – Nizams Institute", type: "hospital", address: "Punjagutta", city: "Hyderabad", country: "IN", lat: 17.4256, lng: 78.4476, phone: "+914023489000" },
  { id: "hyd-police-hq", name: "Hyderabad Police Commissionerate", type: "police", address: "Basheerbagh", city: "Hyderabad", country: "IN", lat: 17.3995, lng: 78.4714, phone: "+914027852425" },

  // ── UAE — Dubai ──
  { id: "rashid-dubai", name: "Rashid Hospital", type: "hospital", address: "Oud Metha Rd", city: "Dubai", country: "AE", lat: 25.2297, lng: 55.3129, phone: "+97142194000" },
  { id: "dha-hospital", name: "Dubai Hospital", type: "hospital", address: "Al Baraha", city: "Dubai", country: "AE", lat: 25.2645, lng: 55.3049, phone: "+97142197777" },
  { id: "dubai-police-hq", name: "Dubai Police Headquarters", type: "police", address: "Al Twar", city: "Dubai", country: "AE", lat: 25.2882, lng: 55.3700, phone: "+97142294444" },

  // ── Germany — Berlin ──
  { id: "charite-berlin", name: "Charité – Universitätsmedizin", type: "hospital", address: "Charitéplatz 1", city: "Berlin", country: "DE", lat: 52.5256, lng: 13.3774, phone: "+493045050" },
  { id: "vivantes-berlin", name: "Vivantes Klinikum Neukölln", type: "hospital", address: "Rudower Str 48", city: "Berlin", country: "DE", lat: 52.4680, lng: 13.4515, phone: "+493013001" },
  { id: "berlin-police", name: "Polizei Berlin Präsidium", type: "police", address: "Platz der Luftbrücke 6", city: "Berlin", country: "DE", lat: 52.4829, lng: 13.3888, phone: "+4930464640" },

  // ── France — Paris ──
  { id: "hotel-dieu-paris", name: "Hôtel-Dieu Hospital", type: "hospital", address: "1 Pl du Parvis Notre-Dame", city: "Paris", country: "FR", lat: 48.8534, lng: 2.3485, phone: "+33142348200" },
  { id: "lariboisiere-paris", name: "Hôpital Lariboisière", type: "hospital", address: "2 Rue Ambroise Paré", city: "Paris", country: "FR", lat: 48.8797, lng: 2.3567, phone: "+33149958484" },
  { id: "paris-police-1", name: "Police Nationale – Paris 1er", type: "police", address: "8-10 Rue de la Cité", city: "Paris", country: "FR", lat: 48.8546, lng: 2.3467, phone: "+33153716000" },

  // ── Singapore ──
  { id: "sgh-singapore", name: "Singapore General Hospital", type: "hospital", address: "Outram Rd", city: "Singapore", country: "SG", lat: 1.2796, lng: 103.8349, phone: "+6563222222" },
  { id: "nuh-singapore", name: "National University Hospital", type: "hospital", address: "5 Lower Kent Ridge Rd", city: "Singapore", country: "SG", lat: 1.2943, lng: 103.7829, phone: "+6567795555" },
  { id: "spf-singapore", name: "Singapore Police Force HQ", type: "police", address: "391 New Bridge Rd", city: "Singapore", country: "SG", lat: 1.2854, lng: 103.8434, phone: "+6563358111" },

  // ── South Africa — Johannesburg ──
  { id: "helen-joseph-jnb", name: "Helen Joseph Hospital", type: "hospital", address: "Perth Rd, Auckland Park", city: "Johannesburg", country: "ZA", lat: -26.1873, lng: 27.9943, phone: "+27114892000" },
  { id: "joburg-police-central", name: "SAPS – Johannesburg Central", type: "police", address: "Marshall St", city: "Johannesburg", country: "ZA", lat: -26.2041, lng: 28.0473, phone: "+27115375000" },

  // ── Brazil — São Paulo ──
  { id: "hosp-das-clinicas", name: "Hospital das Clínicas", type: "hospital", address: "Av Dr Eneas Carvalho Aguiar 255", city: "São Paulo", country: "BR", lat: -23.5578, lng: -46.6695, phone: "+551130697000" },
  { id: "albert-einstein", name: "Hospital Israelita Albert Einstein", type: "hospital", address: "Av Albert Einstein 627", city: "São Paulo", country: "BR", lat: -23.6073, lng: -46.7207, phone: "+551121511233" },
  { id: "pmesp-central", name: "Polícia Militar – São Paulo", type: "police", address: "Av Pacaembu 1660", city: "São Paulo", country: "BR", lat: -23.5350, lng: -46.6591, phone: "+551119000" },
];

// ── Haversine distance formula ─────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function openInMaps(f: Facility) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const label = encodeURIComponent(f.name);
  const url =
    Platform.OS === "ios"
      ? `maps://?q=${label}&ll=${f.lat},${f.lng}`
      : `https://maps.google.com/?q=${f.lat},${f.lng}(${label})`;
  Linking.openURL(url);
}

type FilterType = "all" | FacilityType;

function FacilityRow({
  facility,
  distance,
  saved,
  onToggleSave,
}: {
  facility: Facility;
  distance: number | null;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const colors = useColors();
  const meta = TYPE_META[facility.type];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => openInMaps(facility)}
    >
      <View style={[styles.rowIcon, { backgroundColor: meta.color + "22" }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={[styles.rowName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
          numberOfLines={1}
        >
          {facility.name}
        </Text>
        <Text
          style={[styles.rowAddr, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
          numberOfLines={1}
        >
          {facility.address} · {facility.city}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + "18" }]}>
            <Text style={[styles.typeBadgeText, { color: meta.color, fontFamily: "Inter_500Medium" }]}>
              {meta.label}
            </Text>
          </View>
          {distance !== null && (
            <View style={[styles.distBadge, { backgroundColor: colors.border }]}>
              <Ionicons name="navigate" size={10} color={colors.mutedForeground} />
              <Text style={[styles.distText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {formatDist(distance)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.rowActions}>
        {facility.phone && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Linking.openURL(`tel:${facility.phone}`);
            }}
            style={[styles.iconBtn, { backgroundColor: "#10B98120" }]}
          >
            <Ionicons name="call" size={15} color="#10B981" />
          </Pressable>
        )}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleSave(facility.id);
          }}
          style={[styles.iconBtn, { backgroundColor: saved ? "#F59E0B20" : colors.border }]}
        >
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={15} color={saved ? "#F59E0B" : colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function OfflineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const DOWNLOADED_KEY = "crashcare_downloaded_facilities";

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "ok" | "denied">("idle");
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [downloaded, setDownloaded] = useState<Facility[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncCount, setSyncCount] = useState(0);

  // Load saved IDs and downloaded facilities from storage
  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((raw) => {
      if (raw) setSaved(new Set(JSON.parse(raw) as string[]));
    });
    AsyncStorage.getItem(DOWNLOADED_KEY).then((raw) => {
      if (raw) {
        try {
          setDownloaded(JSON.parse(raw) as Facility[]);
        } catch (e) {
          console.error("Error loading downloaded facilities", e);
        }
      }
    });
    fetchGPS();
  }, []);

  const fetchGPS = async (): Promise<{ lat: number; lng: number } | null> => {
    setGpsStatus("loading");
    try {
      if (Platform.OS === "web") {
        return new Promise((resolve) => {
          navigator.geolocation?.getCurrentPosition(
            (pos) => {
              setUserLat(pos.coords.latitude);
              setUserLng(pos.coords.longitude);
              setGpsStatus("ok");
              resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
              setGpsStatus("denied");
              resolve(null);
            }
          );
        });
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setGpsStatus("denied"); return null; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLat(pos.coords.latitude);
      setUserLng(pos.coords.longitude);
      setGpsStatus("ok");
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      setGpsStatus("denied");
      return null;
    }
  };

  const handleRefresh = async () => {
    const coords = await fetchGPS();
    const activeLat = coords?.lat ?? userLat;
    const activeLng = coords?.lng ?? userLng;

    if (activeLat !== null && activeLng !== null) {
      const isOnline = typeof navigator !== "undefined" && navigator.onLine;
      if (!isOnline) return;

      setSyncStatus("syncing");
      try {
        const res = await fetch(`http://localhost:8080/api/facilities/nearby?lat=${activeLat}&lng=${activeLng}&radius=50`);
        if (!res.ok) throw new Error("Sync failed");
        
        const data = (await res.json()) as { facilities: Facility[] };
        if (data && Array.isArray(data.facilities)) {
          const newFacilities = data.facilities.filter((newFac) => {
            const isDuplicate = 
              ALL_FACILITIES.some((existing) => 
                existing.id === newFac.id || 
                (Math.abs(existing.lat - newFac.lat) < 0.0001 && Math.abs(existing.lng - newFac.lng) < 0.0001)
              ) ||
              downloaded.some((existing) => 
                existing.id === newFac.id || 
                (Math.abs(existing.lat - newFac.lat) < 0.0001 && Math.abs(existing.lng - newFac.lng) < 0.0001)
              );
            return !isDuplicate;
          });

          if (newFacilities.length > 0) {
            const updated = [...downloaded, ...newFacilities];
            setDownloaded(updated);
            await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(updated));
            setSyncCount(newFacilities.length);
            setSyncStatus("success");
            setTimeout(() => setSyncStatus("idle"), 5000);
          } else {
            setSyncStatus("success");
            setSyncCount(0);
            setTimeout(() => setSyncStatus("idle"), 5000);
          }
        }
      } catch (err) {
        console.error("Failed manual refresh sync", err);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 5000);
      }
    }
  };

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Automatic background download when online and user location is available
  useEffect(() => {
    if (userLat === null || userLng === null) return;
    
    // Check online status
    const isOnline = typeof navigator !== "undefined" && navigator.onLine;
    if (!isOnline) return;

    const autoSync = async () => {
      setSyncStatus("syncing");
      try {
        // Fetch nearby facilities from backend server within 50km radius
        const res = await fetch(`http://localhost:8080/api/facilities/nearby?lat=${userLat}&lng=${userLng}&radius=50`);
        if (!res.ok) throw new Error("Sync failed");
        
        const data = (await res.json()) as { facilities: Facility[] };
        if (data && Array.isArray(data.facilities)) {
          // Strictly avoid downloading existing facilities (don't download same coordinates or IDs)
          const newFacilities = data.facilities.filter((newFac) => {
            const isDuplicate = 
              ALL_FACILITIES.some((existing) => 
                existing.id === newFac.id || 
                (Math.abs(existing.lat - newFac.lat) < 0.0001 && Math.abs(existing.lng - newFac.lng) < 0.0001)
              ) ||
              downloaded.some((existing) => 
                existing.id === newFac.id || 
                (Math.abs(existing.lat - newFac.lat) < 0.0001 && Math.abs(existing.lng - newFac.lng) < 0.0001)
              );
            return !isDuplicate;
          });

          if (newFacilities.length > 0) {
            const updated = [...downloaded, ...newFacilities];
            setDownloaded(updated);
            await AsyncStorage.setItem(DOWNLOADED_KEY, JSON.stringify(updated));
            setSyncCount(newFacilities.length);
            setSyncStatus("success");
            
            // Automatically clear sync success status after 5 seconds
            setTimeout(() => setSyncStatus("idle"), 5000);
          } else {
            setSyncStatus("idle");
          }
        }
      } catch (err) {
        console.error("Failed to automatically sync facilities", err);
        setSyncStatus("error");
      }
    };

    autoSync();
  }, [userLat, userLng]);

  const combinedFacilities = useMemo(() => {
    const merged = [...ALL_FACILITIES];
    for (const f of downloaded) {
      if (!merged.some((existing) => existing.id === f.id)) {
        merged.push(f);
      }
    }
    return merged;
  }, [downloaded]);

  // Compute distances and sort
  const displayed = useMemo(() => {
    let list = combinedFacilities;

    if (filter !== "all") list = list.filter((f) => f.type === filter);
    if (showSavedOnly) list = list.filter((f) => saved.has(f.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.country.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q)
      );
    }

    if (userLat !== null && userLng !== null) {
      const mapped = list.map((f) => ({ facility: f, distance: haversineKm(userLat, userLng, f.lat, f.lng) }));
      const within500 = mapped.filter((item) => item.distance <= 500);
      
      if (within500.length > 0) {
        return within500.sort((a, b) => a.distance - b.distance);
      } else {
        // Fallback: if no facilities within 500km, return the closest 5 facilities so the screen is not empty
        return mapped.sort((a, b) => a.distance - b.distance).slice(0, 5);
      }
    }

    return list.map((f) => ({ facility: f, distance: null }));
  }, [filter, search, showSavedOnly, saved, userLat, userLng]);

  const groupedByRange = useMemo(() => {
    if (userLat === null || userLng === null) {
      return null;
    }

    const ranges = [
      { title: "0 - 15 km", min: 0, max: 15, facilities: [] as { facility: Facility; distance: number | null }[] },
      { title: "15 - 30 km", min: 15, max: 30, facilities: [] as { facility: Facility; distance: number | null }[] },
      { title: "30 - 100 km", min: 30, max: 100, facilities: [] as { facility: Facility; distance: number | null }[] },
      { title: "100 - 500 km", min: 100, max: 500, facilities: [] as { facility: Facility; distance: number | null }[] },
      { title: "500+ km (Closest)", min: 500, max: Infinity, facilities: [] as { facility: Facility; distance: number | null }[] },
    ];

    for (const item of displayed) {
      const d = item.distance ?? 0;
      for (const r of ranges) {
        if (d >= r.min && d < r.max) {
          r.facilities.push(item);
          break;
        }
      }
    }

    return ranges.filter((r) => r.facilities.length > 0);
  }, [displayed, userLat, userLng]);

  const FILTERS: { label: string; value: FilterType; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { label: "All", value: "all", icon: "grid", color: "#0FA3B1" },
    { label: "Hospital", value: "hospital", icon: "medical", color: "#E63946" },
    { label: "Police", value: "police", icon: "shield-checkmark", color: "#1A56DB" },
    { label: "Fire", value: "fire", icon: "flame", color: "#FF6B00" },
    { label: "Clinic", value: "clinic", icon: "bandage", color: "#10B981" },
    { label: "Pharmacy", value: "pharmacy", icon: "fitness", color: "#8B5CF6" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Offline Facilities
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {combinedFacilities.length} locations · no internet needed
            </Text>
          </View>
          <View style={styles.headerBadges}>
            <View style={[styles.offlineBadge, { backgroundColor: "#10B98122" }]}>
              <Ionicons name="cloud-offline" size={12} color="#10B981" />
              <Text style={[styles.offlineText, { color: "#10B981", fontFamily: "Inter_500Medium" }]}>
                Offline
              </Text>
            </View>
            {syncStatus === "syncing" && (
              <View style={[styles.syncBadge, { backgroundColor: colors.border }]}>
                <Ionicons name="sync" size={12} color={colors.mutedForeground} />
                <Text style={[styles.syncText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Syncing…
                </Text>
              </View>
            )}
            {syncStatus === "success" && (
              <View style={[styles.syncBadge, { backgroundColor: "#10B98122" }]}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={[styles.syncText, { color: "#10B981", fontFamily: "Inter_500Medium" }]}>
                  +{syncCount} synced
                </Text>
              </View>
            )}
            <Pressable
              onPress={fetchGPS}
              style={[
                styles.gpsBadge,
                {
                  backgroundColor:
                    gpsStatus === "ok" ? "#0FA3B122" : gpsStatus === "denied" ? "#E6394622" : colors.border,
                },
              ]}
            >
              <Ionicons
                name={gpsStatus === "ok" ? "location" : gpsStatus === "denied" ? "location-outline" : "navigate-circle-outline"}
                size={12}
                color={gpsStatus === "ok" ? "#0FA3B1" : gpsStatus === "denied" ? "#E63946" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.gpsText,
                  {
                    color: gpsStatus === "ok" ? "#0FA3B1" : gpsStatus === "denied" ? "#E63946" : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {gpsStatus === "ok" ? "GPS On" : gpsStatus === "denied" ? "No GPS" : gpsStatus === "loading" ? "Locating…" : "GPS"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sync Success banner */}
        {syncStatus === "success" && (
          <View style={[styles.gpsBanner, { backgroundColor: "#10B98111", borderColor: "#10B98133" }]}>
            <Ionicons name="checkmark-circle" size={15} color="#10B981" />
            <Text style={[styles.gpsBannerText, { color: "#10B981", fontFamily: "Inter_500Medium" }]}>
              Successfully downloaded {syncCount} new facility coordinates in 50km radius for offline use!
            </Text>
          </View>
        )}

        {/* GPS hint */}
        {gpsStatus === "ok" && userLat !== null && (
          <View style={[styles.gpsBanner, { backgroundColor: "#0FA3B111", borderColor: "#0FA3B133" }]}>
            <Ionicons name="checkmark-circle" size={15} color="#0FA3B1" />
            <Text style={[styles.gpsBannerText, { color: "#0FA3B1", fontFamily: "Inter_500Medium" }]}>
              Sorted by distance from your location
            </Text>
          </View>
        )}
        {gpsStatus === "denied" && (
          <Pressable
            onPress={fetchGPS}
            style={[styles.gpsBanner, { backgroundColor: "#E6394611", borderColor: "#E6394633" }]}
          >
            <Ionicons name="warning" size={15} color="#E63946" />
            <Text style={[styles.gpsBannerText, { color: "#E63946", fontFamily: "Inter_500Medium" }]}>
              GPS unavailable — tap to retry. Showing all locations.
            </Text>
          </Pressable>
        )}

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, flex: 1, marginBottom: 0 }]}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Search name, city, country…"
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleRefresh();
            }}
            style={[styles.refreshButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="refresh" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f.value);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.value ? f.color + "22" : colors.card,
                  borderColor: filter === f.value ? f.color : colors.border,
                },
              ]}
            >
              <Ionicons name={f.icon} size={13} color={filter === f.value ? f.color : colors.mutedForeground} />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: filter === f.value ? f.color : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSavedOnly((v) => !v);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: showSavedOnly ? "#F59E0B22" : colors.card,
                borderColor: showSavedOnly ? "#F59E0B" : colors.border,
              },
            ]}
          >
            <Ionicons name="bookmark" size={13} color={showSavedOnly ? "#F59E0B" : colors.mutedForeground} />
            <Text
              style={[
                styles.filterChipText,
                {
                  color: showSavedOnly ? "#F59E0B" : colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                },
              ]}
            >
              Saved ({saved.size})
            </Text>
          </Pressable>
        </ScrollView>

        {/* Results count */}
        <Text style={[styles.resultCount, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {displayed.length} result{displayed.length !== 1 ? "s" : ""}
          {userLat !== null ? " · within 500 km radius" : " · enable GPS to sort by distance"}
        </Text>

        {/* Facility list */}
        <View style={styles.list}>
          {displayed.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                No facilities found within 500 km
              </Text>
            </View>
          ) : groupedByRange ? (
            groupedByRange.map((group) => (
              <View key={group.title} style={styles.rangeSection}>
                <View style={[styles.rangeHeader, { borderBottomColor: colors.border }]}>
                  <Ionicons name="location" size={15} color={colors.primary} />
                  <Text style={[styles.rangeTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                    {group.title}
                  </Text>
                  <Text style={[styles.rangeCount, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    ({group.facilities.length})
                  </Text>
                </View>
                <View style={styles.rangeList}>
                  {group.facilities.map(({ facility, distance }) => (
                    <FacilityRow
                      key={facility.id}
                      facility={facility}
                      distance={distance}
                      saved={saved.has(facility.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            displayed.map(({ facility, distance }) => (
              <FacilityRow
                key={facility.id}
                facility={facility}
                distance={distance}
                saved={saved.has(facility.id)}
                onToggleSave={toggleSave}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  screenTitle: { fontSize: 26, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, marginTop: 2 },
  headerBadges: { gap: 6, alignItems: "flex-end" },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offlineText: { fontSize: 11 },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gpsText: { fontSize: 11 },
  gpsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  gpsBannerText: { fontSize: 13, flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterRow: { gap: 8, paddingVertical: 4, marginBottom: 10 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },
  resultCount: { fontSize: 12, marginBottom: 8 },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowName: { fontSize: 13 },
  rowAddr: { fontSize: 11 },
  rowMeta: { flexDirection: "row", gap: 6, marginTop: 3 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10 },
  distBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distText: { fontSize: 10 },
  rowActions: { gap: 6, alignItems: "center" },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 14 },
  rangeSection: {
    marginBottom: 16,
  },
  rangeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  rangeCount: {
    fontSize: 11,
  },
  rangeList: {
    gap: 8,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  syncText: { fontSize: 11 },
});
