import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Notification = {
  id: string;
  type: "payment" | "transaction" | "investment" | "allowance";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const TODAY: Notification[] = [
  {
    id: "1",
    type: "payment",
    title: "Bill due tomorrow",
    body: "Your Tabby payment of SAR 340 is due tomorrow.",
    time: "9:41 AM",
    read: false,
  },
  {
    id: "2",
    type: "allowance",
    title: "Allowance sent",
    body: "SAR 50 weekly allowance sent to Omar.",
    time: "8:00 AM",
    read: false,
  },
  {
    id: "3",
    type: "transaction",
    title: "Purchase approved",
    body: "SAR 125 at Carrefour — Groceries Card.",
    time: "7:22 AM",
    read: true,
  },
];

const EARLIER: Notification[] = [
  {
    id: "4",
    type: "investment",
    title: "Portfolio up +2.1%",
    body: "Your Global Tech ETF gained this week.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "payment",
    title: "Bill paid",
    body: "SAR 65 paid to Netflix — Premium Plan.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "6",
    type: "transaction",
    title: "Transfer received",
    body: "SAR 1,200 received from Sultan.",
    time: "3 days ago",
    read: true,
  },
];

const ICON_MAP: Record<
  Notification["type"],
  { name: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string }
> = {
  payment: { name: "receipt-outline", color: "#F59E0B", bg: "#FEF3C7" },
  transaction: { name: "swap-horizontal-outline", color: "#7C3AED", bg: "#F4F1FA" },
  investment: { name: "trending-up-outline", color: "#10B981", bg: "#D1FAE5" },
  allowance: { name: "people-outline", color: "#EC4899", bg: "#FCE7F3" },
};

function NotifItem({ item }: { item: Notification }) {
  const icon = ICON_MAP[item.type];
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7}>
      <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
        <Text style={styles.itemDesc}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.sectionLabel}>Today</Text>
        {TODAY.map((n) => (
          <NotifItem key={n.id} item={n} />
        ))}
        <Text style={styles.sectionLabel}>Earlier</Text>
        {EARLIER.map((n) => (
          <NotifItem key={n.id} item={n} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "PlusJakartaSans_700Bold", color: "#1A1426" },
  markAll: { fontSize: 13, color: "#7C3AED", fontFamily: "Inter_500Medium" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#9CA3AF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1426",
    flex: 1,
    marginRight: 8,
  },
  itemTime: { fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_400Regular" },
  itemDesc: { fontSize: 13, color: "#6B7280", fontFamily: "Inter_400Regular", lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    marginTop: 4,
    flexShrink: 0,
  },
});
