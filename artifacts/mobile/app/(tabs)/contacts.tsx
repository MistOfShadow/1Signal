import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
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

const STORAGE_KEY = "crashcare_personal_contacts";

interface AuthorityNumber {
  id: string;
  label: string;
  number: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface AuthorityCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  numbers: AuthorityNumber[];
}

interface PersonalContact {
  id: string;
  name: string;
  number: string;
  relation: string;
}

const AUTHORITY_CATEGORIES: AuthorityCategory[] = [
  {
    title: "Universal Emergency",
    icon: "alert-circle",
    color: "#E63946",
    numbers: [
      {
        id: "911",
        label: "911",
        number: "911",
        description: "US Emergency — Police, Fire, Ambulance",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "112",
        label: "112",
        number: "112",
        description: "International Emergency — Works in 190+ countries",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "999",
        label: "999",
        number: "999",
        description: "UK Emergency — Police, Fire, Ambulance",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "000",
        label: "000",
        number: "000",
        description: "Australia Emergency — Police, Fire, Ambulance",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "113",
        label: "113",
        number: "113",
        description: "Netherlands Emergency Services",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "17",
        label: "17 (Police)",
        number: "17",
        description: "France — Police Emergency",
        icon: "shield",
        color: "#1A56DB",
      },
      {
        id: "15",
        label: "15 (SAMU)",
        number: "15",
        description: "France — Medical Emergency (SAMU)",
        icon: "medkit",
        color: "#E63946",
      },
      {
        id: "110_de",
        label: "110 (Police)",
        number: "110",
        description: "Germany / Japan — Police Emergency",
        icon: "shield",
        color: "#1A56DB",
      },
    ],
  },
  {
    title: "🇮🇳 India — National Emergency",
    icon: "alert-circle",
    color: "#FF9933",
    numbers: [
      {
        id: "in-112",
        label: "112 — National Emergency",
        number: "112",
        description: "All emergencies — Police, Fire, Ambulance (24/7)",
        icon: "call",
        color: "#E63946",
      },
      {
        id: "in-100",
        label: "100 — Police",
        number: "100",
        description: "Police Emergency — All India",
        icon: "shield",
        color: "#1A56DB",
      },
      {
        id: "in-101",
        label: "101 — Fire",
        number: "101",
        description: "Fire Emergency — All India",
        icon: "flame",
        color: "#FF6B00",
      },
      {
        id: "in-102",
        label: "102 — Ambulance",
        number: "102",
        description: "Government Ambulance Service — All India",
        icon: "medkit",
        color: "#E63946",
      },
      {
        id: "in-108",
        label: "108 — EMRI Ambulance",
        number: "108",
        description: "Emergency Medical Response — GVK EMRI (24/7)",
        icon: "medical",
        color: "#E63946",
      },
      {
        id: "in-104",
        label: "104 — Health Helpline",
        number: "104",
        description: "Medical Advice & Non-Emergency Health Helpline",
        icon: "heart",
        color: "#10B981",
      },
    ],
  },
  {
    title: "🇮🇳 India — Road & Accident",
    icon: "car",
    color: "#FF9933",
    numbers: [
      {
        id: "in-1073",
        label: "1073 — Highway Accident",
        number: "1073",
        description: "National Highway Accident Relief Helpline (NHAI)",
        icon: "car-sport",
        color: "#F59E0B",
      },
      {
        id: "in-1033",
        label: "1033 — NHAI Helpline",
        number: "1033",
        description: "National Highways Authority of India — 24/7",
        icon: "navigate",
        color: "#F59E0B",
      },
      {
        id: "in-1800-180-1253",
        label: "1800-180-1253",
        number: "18001801253",
        description: "Traffic Police Helpline — Toll Free",
        icon: "shield-checkmark",
        color: "#1A56DB",
      },
      {
        id: "in-1095",
        label: "1095 — Traffic Police",
        number: "1095",
        description: "Delhi Traffic Police Helpline",
        icon: "shield",
        color: "#1A56DB",
      },
      {
        id: "in-mh-traffic",
        label: "022-26262626",
        number: "02226262626",
        description: "Mumbai Traffic Police Control Room",
        icon: "shield-checkmark",
        color: "#1A56DB",
      },
    ],
  },
  {
    title: "🇮🇳 India — Crisis & Safety",
    icon: "heart",
    color: "#FF9933",
    numbers: [
      {
        id: "in-181",
        label: "181 — Women Helpline",
        number: "181",
        description: "National Women Helpline — 24/7",
        icon: "person",
        color: "#EC4899",
      },
      {
        id: "in-1091",
        label: "1091 — Women Distress",
        number: "1091",
        description: "Women in Distress Helpline",
        icon: "person",
        color: "#EC4899",
      },
      {
        id: "in-1098",
        label: "1098 — Childline",
        number: "1098",
        description: "Child Emergency & Protection Helpline — 24/7",
        icon: "happy",
        color: "#8B5CF6",
      },
      {
        id: "in-iCall",
        label: "9152987821 — iCall",
        number: "9152987821",
        description: "Mental Health & Psychological Support Helpline",
        icon: "heart-half",
        color: "#8B5CF6",
      },
      {
        id: "in-vandrevala",
        label: "1860-2662-345",
        number: "18602662345",
        description: "Vandrevala Foundation — Mental Health 24/7",
        icon: "heart",
        color: "#8B5CF6",
      },
    ],
  },
  {
    title: "🇮🇳 India — Disaster Management",
    icon: "warning",
    color: "#FF9933",
    numbers: [
      {
        id: "in-ndma",
        label: "1070 — NDMA",
        number: "1070",
        description: "National Disaster Management Authority — 24/7",
        icon: "warning",
        color: "#F59E0B",
      },
      {
        id: "in-1078",
        label: "1078 — Anti-Poison",
        number: "1078",
        description: "National Poison Control Helpline — All India",
        icon: "flask",
        color: "#10B981",
      },
      {
        id: "in-1800-111-363",
        label: "1800-111-363",
        number: "1800111363",
        description: "Senior Citizen Helpline — Toll Free",
        icon: "people",
        color: "#F59E0B",
      },
      {
        id: "in-ndrf",
        label: "011-24363260",
        number: "01124363260",
        description: "NDRF — National Disaster Response Force HQ",
        icon: "shield",
        color: "#1A56DB",
      },
      {
        id: "in-coast-guard",
        label: "1554 — Coast Guard",
        number: "1554",
        description: "Indian Coast Guard Emergency (Coastal Areas)",
        icon: "boat",
        color: "#0FA3B1",
      },
      {
        id: "in-railway",
        label: "139 — Railway Helpline",
        number: "139",
        description: "Railway Emergency & Accident Helpline",
        icon: "train-sharp",
        color: "#F59E0B",
      },
    ],
  },
  {
    title: "Police & Law Enforcement",
    icon: "shield",
    color: "#1A56DB",
    numbers: [
      {
        id: "311",
        label: "311",
        number: "311",
        description: "US Non-Emergency City Services & Police",
        icon: "shield-checkmark",
        color: "#1A56DB",
      },
      {
        id: "nhtsa",
        label: "NHTSA Hotline",
        number: "18883274236",
        description: "US — Vehicle Safety Complaints & Recalls",
        icon: "car",
        color: "#1A56DB",
      },
      {
        id: "fmcsa",
        label: "FMCSA",
        number: "18008325660",
        description: "US — Commercial Vehicle Safety Violations",
        icon: "bus",
        color: "#1A56DB",
      },
    ],
  },
  {
    title: "Medical & Poison Control",
    icon: "medkit",
    color: "#E63946",
    numbers: [
      {
        id: "poison_us",
        label: "Poison Control",
        number: "18002221222",
        description: "US — 24/7 Poison Emergency Hotline",
        icon: "flask",
        color: "#10B981",
      },
      {
        id: "poison_uk",
        label: "NHS 111",
        number: "111",
        description: "UK — Non-Emergency Medical Advice",
        icon: "medical",
        color: "#E63946",
      },
      {
        id: "crisis",
        label: "Crisis Lifeline",
        number: "988",
        description: "US — Mental Health & Suicide Prevention",
        icon: "heart",
        color: "#8B5CF6",
      },
      {
        id: "disaster",
        label: "Disaster Distress",
        number: "18009855990",
        description: "US — Emotional Support After Disasters",
        icon: "heart-half",
        color: "#8B5CF6",
      },
    ],
  },
  {
    title: "Roadside & Transport",
    icon: "car",
    color: "#F59E0B",
    numbers: [
      {
        id: "aaa",
        label: "AAA Roadside",
        number: "18002224357",
        description: "US — Roadside Assistance (members)",
        icon: "car-sport",
        color: "#F59E0B",
      },
      {
        id: "511",
        label: "511",
        number: "511",
        description: "US — Traffic & Road Conditions Info",
        icon: "navigate",
        color: "#F59E0B",
      },
      {
        id: "dot",
        label: "DOT Hotline",
        number: "18006878842",
        description: "US — Dept of Transportation Emergency",
        icon: "car",
        color: "#F59E0B",
      },
    ],
  },
  {
    title: "Fire & Rescue",
    icon: "flame",
    color: "#FF6B00",
    numbers: [
      {
        id: "fire_uk",
        label: "Fire UK",
        number: "999",
        description: "UK — Fire & Rescue Services",
        icon: "flame",
        color: "#FF6B00",
      },
      {
        id: "fire_aus",
        label: "Fire Australia",
        number: "000",
        description: "Australia — Fire Emergency",
        icon: "flame",
        color: "#FF6B00",
      },
      {
        id: "fema",
        label: "FEMA",
        number: "18006213362",
        description: "US — Federal Emergency Management Agency",
        icon: "home",
        color: "#FF6B00",
      },
    ],
  },
  {
    title: "Red Cross & Aid",
    icon: "bandage",
    color: "#E63946",
    numbers: [
      {
        id: "redcross",
        label: "Red Cross",
        number: "18007332767",
        description: "US — Disaster Relief & Blood Supply",
        icon: "bandage",
        color: "#E63946",
      },
      {
        id: "salvation",
        label: "Salvation Army",
        number: "18004788669",
        description: "US — Disaster Relief & Emergency Aid",
        icon: "heart",
        color: "#E63946",
      },
      {
        id: "samhsa",
        label: "SAMHSA",
        number: "18006624357",
        description: "US — Substance Abuse & Mental Health",
        icon: "medical",
        color: "#8B5CF6",
      },
    ],
  },
];

const RELATION_OPTIONS = ["Family", "Doctor", "Insurance", "Lawyer", "Friend", "Employer", "Other"];

function callNumber(number: string) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  Linking.openURL(`tel:${number}`);
}

function AuthorityCard({ item }: { item: AuthorityNumber }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.numberRow,
        { backgroundColor: pressed ? colors.border : "transparent" },
      ]}
      onPress={() => callNumber(item.number)}
    >
      <View style={[styles.numIconBox, { backgroundColor: item.color + "22" }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.numLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {item.label}
        </Text>
        <Text style={[styles.numDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {item.description}
        </Text>
      </View>
      <View style={[styles.callBadge, { backgroundColor: "#10B98122", borderColor: "#10B98133" }]}>
        <Ionicons name="call" size={14} color="#10B981" />
        <Text style={[styles.callText, { fontFamily: "Inter_600SemiBold" }]}>Dial</Text>
      </View>
    </Pressable>
  );
}

function AuthorityCategorySection({ cat }: { cat: AuthorityCategory }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(cat.title === "Universal Emergency");

  return (
    <View style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={styles.catHeader}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((v) => !v);
        }}
      >
        <View style={[styles.catIconBox, { backgroundColor: cat.color + "22" }]}>
          <Ionicons name={cat.icon} size={20} color={cat.color} />
        </View>
        <Text style={[styles.catTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {cat.title}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            {cat.numbers.length}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </Pressable>
      {expanded && (
        <View style={[styles.catDivider, { backgroundColor: colors.border }]} />
      )}
      {expanded &&
        cat.numbers.map((n, i) => (
          <View key={n.id}>
            <AuthorityCard item={n} />
            {i < cat.numbers.length - 1 && (
              <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
    </View>
  );
}

function PersonalContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: PersonalContact;
  onEdit: (c: PersonalContact) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const initials = contact.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <View style={[styles.personalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={styles.personalMain}
        onPress={() => callNumber(contact.number)}
      >
        <View style={[styles.avatar, { backgroundColor: "#0FA3B133" }]}>
          <Text style={[styles.avatarText, { color: "#0FA3B1", fontFamily: "Inter_700Bold" }]}>
            {initials}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.personalName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {contact.name}
          </Text>
          <Text style={[styles.personalNum, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {contact.number}
            {contact.relation ? ` · ${contact.relation}` : ""}
          </Text>
        </View>
        <View style={[styles.callBadge, { backgroundColor: "#10B98122", borderColor: "#10B98133" }]}>
          <Ionicons name="call" size={14} color="#10B981" />
          <Text style={[styles.callText, { fontFamily: "Inter_600SemiBold" }]}>Dial</Text>
        </View>
      </Pressable>
      <View style={[styles.personalActions, { borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => onEdit(contact)}
        >
          <Ionicons name="pencil" size={14} color={colors.mutedForeground} />
          <Text style={[styles.actionText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Edit
          </Text>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete(contact.id);
          }}
        >
          <Ionicons name="trash" size={14} color="#E63946" />
          <Text style={[styles.actionText, { color: "#E63946", fontFamily: "Inter_500Medium" }]}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function AddContactModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible: boolean;
  initial: PersonalContact | null;
  onSave: (c: PersonalContact) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [relation, setRelation] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setNumber(initial.number);
      setRelation(initial.relation);
    } else {
      setName("");
      setNumber("");
      setRelation("");
    }
  }, [initial, visible]);

  const handleSave = () => {
    if (!name.trim() || !number.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: initial?.id ?? Date.now().toString(),
      name: name.trim(),
      number: number.trim(),
      relation,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {initial ? "Edit Contact" : "Add Emergency Contact"}
        </Text>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Name *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholder="e.g. Mom, Dr. Smith"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Phone Number *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
          ]}
          placeholder="+1 555 000 0000"
          placeholderTextColor={colors.mutedForeground}
          value={number}
          onChangeText={setNumber}
          keyboardType="phone-pad"
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Relation
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relationRow}
        >
          {RELATION_OPTIONS.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRelation(r === relation ? "" : r)}
              style={[
                styles.relationChip,
                {
                  backgroundColor: relation === r ? "#0FA3B133" : colors.background,
                  borderColor: relation === r ? "#0FA3B1" : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.relationChipText,
                  {
                    color: relation === r ? "#0FA3B1" : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.modalButtons}>
          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.saveBtn,
              { backgroundColor: name.trim() && number.trim() ? "#0FA3B1" : colors.border },
            ]}
            onPress={handleSave}
            disabled={!name.trim() || !number.trim()}
          >
            <Text style={[styles.saveText, { fontFamily: "Inter_700Bold" }]}>
              {initial ? "Save Changes" : "Add Contact"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [contacts, setContacts] = useState<PersonalContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<PersonalContact | null>(null);
  const [activeTab, setActiveTab] = useState<"authority" | "personal">("authority");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setContacts(JSON.parse(raw));
    });
  }, []);

  const persistContacts = useCallback((updated: PersonalContact[]) => {
    setContacts(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleSave = (contact: PersonalContact) => {
    const updated = editingContact
      ? contacts.map((c) => (c.id === contact.id ? contact : c))
      : [...contacts, contact];
    persistContacts(updated);
    setModalVisible(false);
    setEditingContact(null);
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === "web") {
      persistContacts(contacts.filter((c) => c.id !== id));
      return;
    }
    Alert.alert("Delete Contact", "Remove this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => persistContacts(contacts.filter((c) => c.id !== id)),
      },
    ]);
  };

  const handleEdit = (contact: PersonalContact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  const totalAuthority = AUTHORITY_CATEGORIES.reduce((sum, c) => sum + c.numbers.length, 0);

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
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Contacts
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {totalAuthority} authority numbers · {contacts.length} personal
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: "#0FA3B1", opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => {
              setEditingContact(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={[styles.addBtnText, { fontFamily: "Inter_600SemiBold" }]}>Add</Text>
          </Pressable>
        </View>

        <View style={[styles.segmentBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={[
              styles.segmentBtn,
              activeTab === "authority" && { backgroundColor: "#E6394622" },
            ]}
            onPress={() => setActiveTab("authority")}
          >
            <Ionicons name="shield" size={15} color={activeTab === "authority" ? "#E63946" : colors.mutedForeground} />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === "authority" ? "#E63946" : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              Authority
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentBtn,
              activeTab === "personal" && { backgroundColor: "#0FA3B122" },
            ]}
            onPress={() => setActiveTab("personal")}
          >
            <Ionicons name="people" size={15} color={activeTab === "personal" ? "#0FA3B1" : colors.mutedForeground} />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === "personal" ? "#0FA3B1" : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              My Contacts
            </Text>
          </Pressable>
        </View>

        {activeTab === "authority" ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {AUTHORITY_CATEGORIES.map((cat) => (
              <AuthorityCategorySection key={cat.title} cat={cat} />
            ))}
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 4 }}>
            {contacts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-circle-outline" size={44} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  No personal contacts yet
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Add family members, your doctor, or insurance agent for one-tap calling during emergencies.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.emptyAddBtn,
                    { backgroundColor: "#0FA3B1", opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    setEditingContact(null);
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={[styles.emptyAddText, { fontFamily: "Inter_600SemiBold" }]}>
                    Add First Contact
                  </Text>
                </Pressable>
              </View>
            ) : (
              contacts.map((c) => (
                <PersonalContactCard
                  key={c.id}
                  contact={c}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <AddContactModal
        visible={modalVisible}
        initial={editingContact}
        onSave={handleSave}
        onClose={() => {
          setModalVisible(false);
          setEditingContact(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  screenTitle: { fontSize: 28, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#fff", fontSize: 14 },
  segmentBar: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentText: { fontSize: 13 },
  catCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: { flex: 1, fontSize: 14 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: { fontSize: 12 },
  catDivider: { height: 1, marginHorizontal: 14 },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  innerDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  numIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  numLabel: { fontSize: 14 },
  numDesc: { fontSize: 12, lineHeight: 17 },
  callBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  callText: { color: "#10B981", fontSize: 12 },
  personalCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  personalMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16 },
  personalName: { fontSize: 15 },
  personalNum: { fontSize: 13 },
  personalActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  actionText: { fontSize: 13 },
  actionDivider: { width: StyleSheet.hairlineWidth },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, textAlign: "center" },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyAddText: { color: "#fff", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
    gap: 4,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, marginBottom: 16 },
  fieldLabel: { fontSize: 12, letterSpacing: 0.5, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  relationRow: { gap: 8, paddingVertical: 4 },
  relationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  relationChipText: { fontSize: 13 },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelText: { fontSize: 15 },
  saveBtn: {
    flex: 2,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
  },
  saveText: { color: "#fff", fontSize: 15 },
});
