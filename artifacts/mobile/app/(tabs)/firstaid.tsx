import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

interface Step {
  text: string;
  warning?: boolean;
  tip?: boolean;
}

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  severity: "critical" | "high" | "medium";
  steps: Step[];
  doNot?: string[];
}

const GUIDES: Guide[] = [
  {
    id: "crash-immediate",
    title: "Immediate Crash Response",
    subtitle: "First 60 seconds — what to do right now",
    icon: "warning",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Stay calm. Take a breath. Check yourself for injuries before moving.", tip: true },
      { text: "Turn off the engine to prevent fire. Apply the handbrake." },
      { text: "Turn on hazard lights immediately to warn other drivers." },
      { text: "Do NOT move anyone who may have a neck or spine injury unless there is immediate danger (fire, flood).", warning: true },
      { text: "Call 911 or 112 even if injuries seem minor — adrenaline can mask pain." },
      { text: "If safe, move your vehicle out of traffic. Otherwise stay inside with seatbelt on." },
      { text: "Set up warning triangles or flares 50–100 m behind the vehicle if available." },
      { text: "Do not leave the scene. Exchange insurance info with other driver(s)." },
    ],
    doNot: [
      "Do NOT remove a helmet from a motorcyclist unless they have stopped breathing",
      "Do NOT give food or water to an injured person",
      "Do NOT move a person with suspected spinal injury",
    ],
  },
  {
    id: "cpr",
    title: "CPR — Cardiac Arrest",
    subtitle: "Person not breathing and unresponsive",
    icon: "heart",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Check for danger. Ensure scene is safe before approaching.", warning: true },
      { text: "Tap shoulders firmly and shout: 'Are you okay?'" },
      { text: "If no response — call 911 / 112 immediately (or ask someone to call)." },
      { text: "Tilt head back, lift chin, look for chest rise. Check breathing for no more than 10 seconds." },
      { text: "Place heel of your hand on center of chest (lower half of sternum)." },
      { text: "Interlock fingers. Arms straight. Push down hard — at least 5 cm (2 inches) deep." },
      { text: "Press 30 times at rate of 100–120 per minute (to beat of 'Stayin' Alive').", tip: true },
      { text: "Give 2 rescue breaths: pinch nose, seal lips, blow until chest rises." },
      { text: "Continue 30:2 ratio until emergency services arrive or person recovers." },
      { text: "If an AED is nearby, use it as soon as possible — follow voice prompts.", tip: true },
    ],
    doNot: [
      "Do NOT stop CPR unless you are physically exhausted, the person recovers, or help arrives",
      "Do NOT be afraid to push hard — broken ribs can be fixed, death cannot",
    ],
  },
  {
    id: "bleeding",
    title: "Severe Bleeding",
    subtitle: "Large wounds, arterial bleeding, deep cuts",
    icon: "bandage",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Call 911 / 112 immediately for severe or uncontrolled bleeding." },
      { text: "Put on gloves if available. Protect yourself from blood contact.", tip: true },
      { text: "Apply firm, direct pressure using a clean cloth, clothing, or bandage." },
      { text: "Press continuously for at least 10–15 minutes without lifting the cloth." },
      { text: "If cloth soaks through, add MORE cloth on top — do NOT remove the first layer.", warning: true },
      { text: "Elevate the wound above heart level if it is on a limb and no fracture is suspected." },
      { text: "For limb bleeding that cannot be controlled, apply a tourniquet 5–7 cm above the wound." },
      { text: "Tie tourniquet tight enough to stop bleeding. Note the time applied.", warning: true },
      { text: "Keep the person warm and lying down. Treat for shock." },
    ],
    doNot: [
      "Do NOT remove embedded objects from a wound — bandage around them",
      "Do NOT use a tourniquet on the neck, chest, or abdomen",
      "Do NOT loosen a tourniquet once applied",
    ],
  },
  {
    id: "unconscious",
    title: "Unconscious Person",
    subtitle: "Person is unresponsive but breathing",
    icon: "person",
    color: "#F59E0B",
    severity: "high",
    steps: [
      { text: "Shout their name and tap shoulders. If no response, call 911 immediately." },
      { text: "Check breathing — watch for chest rise for 10 seconds." },
      { text: "If breathing: place in Recovery Position to keep airway clear." },
      { text: "Recovery Position: kneel beside them, tilt head back, bend top knee, roll gently onto side.", tip: true },
      { text: "Support head with hand to keep airway open. Check breathing every minute." },
      { text: "Do NOT give anything to eat or drink.", warning: true },
      { text: "Keep them warm with a blanket or jacket." },
      { text: "If they stop breathing at any point — begin CPR immediately." },
    ],
    doNot: [
      "Do NOT leave an unconscious person alone",
      "Do NOT put a pillow under their head — it may block the airway",
    ],
  },
  {
    id: "head-neck",
    title: "Head, Neck & Spine Injury",
    subtitle: "Suspected after high-impact crash",
    icon: "body",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Suspect spinal injury in any high-speed crash, rollover, or if person has neck/back pain.", warning: true },
      { text: "Tell the person: 'Do not move your head or neck.' Keep them completely still." },
      { text: "Call 911 / 112 immediately — do not attempt to move the person yourself." },
      { text: "If they must be moved (fire, flood): support head, neck and spine in alignment. Use multiple people.", warning: true },
      { text: "Hold their head still with both hands — do not allow any rotation or bending." },
      { text: "Watch for: confusion, numbness/tingling in limbs, inability to move, unequal pupils." },
      { text: "If wearing a helmet — leave it on unless they stop breathing." },
      { text: "Cover with a blanket for warmth. Reassure them until help arrives." },
    ],
    doNot: [
      "Do NOT remove a helmet unless person stops breathing",
      "Do NOT try to 'straighten' or reposition the neck",
      "Do NOT move the person without trained help unless in immediate danger",
    ],
  },
  {
    id: "fractures",
    title: "Fractures & Broken Bones",
    subtitle: "Suspected broken arms, legs, pelvis, ribs",
    icon: "fitness",
    color: "#F59E0B",
    severity: "high",
    steps: [
      { text: "Look for: deformity, swelling, bruising, bone protruding through skin, intense pain on movement." },
      { text: "Do NOT attempt to straighten or realign the bone.", warning: true },
      { text: "Immobilize the injured area in the position found. Use a splint, rolled clothing, or rigid object." },
      { text: "For arm fractures: use a sling or improvise with a shirt. Bind against body for support.", tip: true },
      { text: "For leg fractures: pad and bind the injured leg to the uninjured leg, or use a rigid splint." },
      { text: "For suspected pelvis fracture: lay person flat, do not move them, call 911." },
      { text: "If bone is protruding through skin (open fracture): cover loosely with clean cloth. Do NOT push bone back.", warning: true },
      { text: "Apply ice wrapped in cloth for 20 min on / 20 min off to reduce swelling.", tip: true },
      { text: "Elevate if possible. Keep checking circulation — color, warmth, sensation below injury." },
    ],
    doNot: [
      "Do NOT straighten a deformed limb",
      "Do NOT allow weight-bearing on a fractured limb",
      "Do NOT remove clothing or shoes if fracture is suspected — cut away instead",
    ],
  },
  {
    id: "shock",
    title: "Shock",
    subtitle: "Medical emergency — can be fatal if untreated",
    icon: "flash",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Signs of shock: pale/cold/clammy skin, rapid weak pulse, confusion, shallow rapid breathing, nausea.", warning: true },
      { text: "Call 911 / 112 immediately." },
      { text: "Lay the person flat on their back on the floor." },
      { text: "Raise their legs 20–30 cm (about a foot) unless there is a head, neck, or back injury.", tip: true },
      { text: "Keep them warm — cover with a blanket, but do not overheat." },
      { text: "Loosen tight clothing around neck, chest, and waist." },
      { text: "Do NOT give food or water.", warning: true },
      { text: "If unconscious and breathing, place in recovery position." },
      { text: "Monitor breathing and pulse every minute until help arrives." },
      { text: "Provide calm reassurance — stress worsens shock." },
    ],
    doNot: [
      "Do NOT let them eat or drink",
      "Do NOT leave them alone",
      "Do NOT apply a heat pad directly to skin",
    ],
  },
  {
    id: "burns",
    title: "Burns",
    subtitle: "From fire, hot metal, steam, or fuel spills",
    icon: "flame",
    color: "#F59E0B",
    severity: "high",
    steps: [
      { text: "Remove the person from the source of burning. Protect yourself first.", warning: true },
      { text: "Cool the burn immediately with cool (not ice cold) running water for at least 20 minutes.", tip: true },
      { text: "Do NOT use ice, butter, toothpaste, or any creams.", warning: true },
      { text: "Remove jewelry, watches, belts near the burn — swelling will make this impossible later." },
      { text: "Do NOT remove clothing stuck to burned skin.", warning: true },
      { text: "Cover loosely with a clean, non-fluffy material (cling wrap is ideal) or a clean plastic bag.", tip: true },
      { text: "For large burns, burns on face/hands/genitals, or chemical burns — call 911 immediately." },
      { text: "Treat for shock: keep person warm, lay down, reassure them." },
    ],
    doNot: [
      "Do NOT burst blisters",
      "Do NOT apply ice, butter, oil, or any home remedy",
      "Do NOT use fluffy bandages that may stick to the wound",
    ],
  },
  {
    id: "trapped",
    title: "Person Trapped in Vehicle",
    subtitle: "Pinned, door jammed, or seatbelt stuck",
    icon: "car",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Call 911 immediately. Describe: number of people trapped, injuries visible, car model/color." },
      { text: "Turn off the ignition if accessible — prevent fire risk." },
      { text: "Keep the person calm and still. Reassure them help is coming." },
      { text: "Do NOT attempt to force open jammed doors alone — wait for fire rescue.", warning: true },
      { text: "If fire starts: use a car escape tool or heavy object to break tempered side glass (bottom corner).", tip: true },
      { text: "Do NOT break the windshield to exit — it is laminated and extremely hard.", warning: true },
      { text: "If water is rising: wait until pressure equalizes, then open door. Take a breath, go." },
      { text: "For stuck seatbelt: use a seatbelt cutter (keep one in glove box). Cut at angle.", tip: true },
    ],
    doNot: [
      "Do NOT try to move a trapped person with suspected spinal injury unless there is immediate fire/flood",
      "Do NOT attempt to break laminated windshield",
    ],
  },
  {
    id: "vehicle-fire",
    title: "Vehicle Fire",
    subtitle: "Smoke, flames, burning smell from car",
    icon: "flame",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "If you smell burning or see smoke: pull over immediately. Every second counts.", warning: true },
      { text: "Turn off the engine. Take key fob. Exit the vehicle quickly." },
      { text: "Get everyone at least 100 meters away from the vehicle.", warning: true },
      { text: "Call 911 immediately. Do NOT re-enter the vehicle for any reason.", warning: true },
      { text: "If fire is small and contained (engine area): use fire extinguisher from upwind. Aim at base of flames.", tip: true },
      { text: "If fire is spreading: abandon firefighting. A car can explode within minutes." },
      { text: "If someone is trapped: break a side window (rear tempered glass). Protect arm with jacket." },
    ],
    doNot: [
      "Do NOT re-enter a burning vehicle for any reason",
      "Do NOT open a hood with visible flames — fresh oxygen will cause flare-up",
      "Do NOT stand behind the vehicle — fuel tank may explode",
    ],
  },
  {
    id: "whiplash",
    title: "Whiplash & Soft Tissue Injury",
    subtitle: "Neck pain after rear-end collision",
    icon: "medkit",
    color: "#0FA3B1",
    severity: "medium",
    steps: [
      { text: "Symptoms may appear hours or days after accident: neck stiffness, shoulder pain, headache, dizziness." },
      { text: "Seek medical evaluation even if pain is mild — document injuries for insurance.", tip: true },
      { text: "Apply an ice pack wrapped in cloth for 20 minutes every hour for first 24 hours.", tip: true },
      { text: "After 48 hours, switch to gentle heat (warm towel) to relax muscles." },
      { text: "Take over-the-counter pain relief (ibuprofen or paracetamol) as directed." },
      { text: "Keep gently moving the neck — immobilization slows recovery.", tip: true },
      { text: "See a physiotherapist if pain persists beyond a few days." },
      { text: "Do NOT use a cervical collar unless prescribed by a doctor.", warning: true },
    ],
    doNot: [
      "Do NOT ignore neck pain after a crash — it can indicate serious injury",
      "Do NOT use a collar unless a doctor prescribes it",
    ],
  },
  {
    id: "chest-injury",
    title: "Chest & Rib Injuries",
    subtitle: "Steering wheel impact, seatbelt injury",
    icon: "body",
    color: "#F59E0B",
    severity: "high",
    steps: [
      { text: "Signs: sharp pain breathing, bruising on chest, shortness of breath, coughing blood.", warning: true },
      { text: "Call 911 if breathing is labored, person cannot speak in full sentences, or lips are turning blue.", warning: true },
      { text: "Help person sit upright or slightly forward — it reduces pain and eases breathing.", tip: true },
      { text: "For suspected open chest wound: cover with plastic on 3 sides only (flutter valve effect).", tip: true },
      { text: "Do NOT strap the chest tightly — it restricts breathing.", warning: true },
      { text: "Do NOT give aspirin if chest trauma is the cause — seek medical care immediately." },
      { text: "Apply gentle ice pack wrapped in cloth to reduce swelling." },
    ],
    doNot: [
      "Do NOT bind or strap the chest tightly",
      "Do NOT leave someone with chest injury alone",
    ],
  },
  {
    id: "head-injury",
    title: "Head Injury & Concussion",
    subtitle: "After hitting window, steering wheel, or airbag",
    icon: "medical",
    color: "#E63946",
    severity: "critical",
    steps: [
      { text: "Warning signs of serious head injury: loss of consciousness, confusion, vomiting, unequal pupils, seizures, clear fluid from nose/ears.", warning: true },
      { text: "Call 911 if ANY warning signs are present." },
      { text: "Keep the person still and awake. Talk to them continuously." },
      { text: "Do NOT give pain medication that thins blood (aspirin, ibuprofen).", warning: true },
      { text: "Apply cold compress to swelling areas. Do NOT apply pressure to skull.", warning: true },
      { text: "If person loses consciousness but is breathing — recovery position." },
      { text: "Even mild concussion requires medical evaluation within 24 hours.", tip: true },
      { text: "Do NOT allow them to drive or be left alone for 24 hours after concussion." },
    ],
    doNot: [
      "Do NOT give aspirin or ibuprofen — they increase bleeding risk",
      "Do NOT let a concussed person sleep for hours without being checked",
      "Do NOT leave them unsupervised for 24 hours",
    ],
  },
  {
    id: "documentation",
    title: "After the Crash — Documentation",
    subtitle: "Protect yourself legally and for insurance",
    icon: "document-text",
    color: "#0FA3B1",
    severity: "medium",
    steps: [
      { text: "Photograph everything: all vehicles, damage, license plates, road conditions, skid marks.", tip: true },
      { text: "Get the other driver's: name, phone, license plate, insurance company and policy number." },
      { text: "Note names and badge numbers of attending police officers." },
      { text: "Gather witness names and contact details.", tip: true },
      { text: "Request a copy of the police report number at the scene." },
      { text: "Do NOT admit fault or apologize at the scene — this can be used against you.", warning: true },
      { text: "Notify your insurance company as soon as possible, even if you were not at fault." },
      { text: "Seek medical evaluation even if you feel fine — document all injuries." },
      { text: "Keep a record of all medical visits, expenses, and time missed from work." },
    ],
    doNot: [
      "Do NOT admit fault at the scene",
      "Do NOT sign anything from the other driver's insurance without legal advice",
      "Do NOT post about the accident on social media",
    ],
  },
];

const SEVERITY_LABEL: Record<Guide["severity"], string> = {
  critical: "CRITICAL",
  high: "URGENT",
  medium: "IMPORTANT",
};

const SEVERITY_COLOR: Record<Guide["severity"], string> = {
  critical: "#E63946",
  high: "#F59E0B",
  medium: "#0FA3B1",
};

function GuideCard({ guide }: { guide: Guide }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useSharedValue(0);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    heightAnim.value = withTiming(next ? 1 : 0, { duration: 280 });
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: heightAnim.value,
    maxHeight: heightAnim.value * 2000,
    overflow: "hidden",
  }));

  const sevColor = SEVERITY_COLOR[guide.severity];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: expanded ? guide.color + "55" : colors.border,
        },
      ]}
    >
      <Pressable onPress={toggleExpand} style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: guide.color + "22" }]}>
          <Ionicons name={guide.icon} size={22} color={guide.color} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
              numberOfLines={1}
            >
              {guide.title}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: sevColor + "22" }]}>
              <Text style={[styles.severityText, { color: sevColor, fontFamily: "Inter_700Bold" }]}>
                {SEVERITY_LABEL[guide.severity]}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.cardSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
            numberOfLines={1}
          >
            {guide.subtitle}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </Pressable>

      <Animated.View style={animStyle}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stepsContainer}>
          {guide.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              {step.warning ? (
                <View style={[styles.stepBulletBox, { backgroundColor: "#E6394622" }]}>
                  <Ionicons name="warning" size={12} color="#E63946" />
                </View>
              ) : step.tip ? (
                <View style={[styles.stepBulletBox, { backgroundColor: "#0FA3B122" }]}>
                  <Ionicons name="bulb" size={12} color="#0FA3B1" />
                </View>
              ) : (
                <View style={[styles.stepNumber, { backgroundColor: guide.color + "22" }]}>
                  <Text style={[styles.stepNumberText, { color: guide.color, fontFamily: "Inter_700Bold" }]}>
                    {i + 1}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.stepText,
                  {
                    color: step.warning
                      ? "#E63946"
                      : step.tip
                      ? colors.mutedForeground
                      : colors.foreground,
                    fontFamily: step.warning
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                  },
                ]}
              >
                {step.text}
              </Text>
            </View>
          ))}

          {guide.doNot && guide.doNot.length > 0 && (
            <View style={[styles.doNotBox, { backgroundColor: "#E6394611", borderColor: "#E6394633" }]}>
              <Text style={[styles.doNotTitle, { fontFamily: "Inter_700Bold", color: "#E63946" }]}>
                ⛔  DO NOT
              </Text>
              {guide.doNot.map((d, i) => (
                <Text key={i} style={[styles.doNotText, { color: "#E63946", fontFamily: "Inter_500Medium" }]}>
                  • {d}
                </Text>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

export default function FirstAidScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const critical = GUIDES.filter((g) => g.severity === "critical");
  const high = GUIDES.filter((g) => g.severity === "high");
  const medium = GUIDES.filter((g) => g.severity === "medium");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              First Aid Guide
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {GUIDES.length} offline guides · tap to expand
            </Text>
          </View>
          <View style={[styles.offlineBadge, { backgroundColor: "#10B98122" }]}>
            <Ionicons name="cloud-offline" size={13} color="#10B981" />
            <Text style={[styles.offlineText, { color: "#10B981", fontFamily: "Inter_500Medium" }]}>
              Offline
            </Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: "#E6394611", borderColor: "#E6394633" }]}>
          <Ionicons name="information-circle" size={18} color="#E63946" />
          <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            This guide does not replace professional medical care. Always call{" "}
            <Text style={{ color: "#E63946", fontFamily: "Inter_700Bold" }}>911 / 112</Text>{" "}
            in a life-threatening emergency.
          </Text>
        </View>

        <SectionHeader label="🚨 CRITICAL — Life Threatening" />
        {critical.map((g) => <GuideCard key={g.id} guide={g} />)}

        <SectionHeader label="⚠️ URGENT — Seek Medical Care" />
        {high.map((g) => <GuideCard key={g.id} guide={g} />)}

        <SectionHeader label="ℹ️ IMPORTANT — Know Before You Go" />
        {medium.map((g) => <GuideCard key={g.id} guide={g} />)}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text
      style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}
    >
      {label}
    </Text>
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
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  offlineText: { fontSize: 12 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14 },
  cardSubtitle: { fontSize: 12 },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: { fontSize: 9, letterSpacing: 0.8 },
  divider: { height: 1, marginHorizontal: 14 },
  stepsContainer: { padding: 14, gap: 10 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { fontSize: 11 },
  stepBulletBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21 },
  doNotBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  doNotTitle: { fontSize: 12, letterSpacing: 0.5, marginBottom: 2 },
  doNotText: { fontSize: 13, lineHeight: 20 },
});
