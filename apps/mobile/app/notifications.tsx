import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

type ApiNotification = {
  id: string;
  type: "payment" | "transaction" | "investment" | "allowance";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

const ICON_MAP: Record<
  ApiNotification["type"],
  { name: React.ComponentProps<typeof Ionicons>["name"]; color: string; bg: string }
> = {
  payment: { name: "receipt-outline", color: "#F59E0B", bg: "#FEF3C7" },
  transaction: { name: "swap-horizontal-outline", color: "#7C3AED", bg: "#F4F1FA" },
  investment: { name: "trending-up-outline", color: "#10B981", bg: "#D1FAE5" },
  allowance: { name: "people-outline", color: "#EC4899", bg: "#FCE7F3" },
};

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatTime(dateStr: string): string {
  if (isToday(dateStr)) {
    return new Date(dateStr).toLocaleTimeString("en-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(dateStr).toLocaleDateString("en-SA", { month: "short", day: "numeric" });
}

function NotifItem({
  item,
  onPress,
}: {
  item: ApiNotification;
  onPress: (id: string) => void;
}) {
  const icon = ICON_MAP[item.type] ?? ICON_MAP.transaction;
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => onPress(item.id)}>
      <View style={[styles.iconBg, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.itemDesc}>{item.body}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiFetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as Promise<{ notifications: ApiNotification[] }>;
    },
  });

  const notifications = data?.notifications ?? [];
  const todayItems = useMemo(() => notifications.filter((n) => isToday(n.createdAt)), [notifications]);
  const earlierItems = useMemo(() => notifications.filter((n) => !isToday(n.createdAt)), [notifications]);
  const hasUnread = useMemo(() => notifications.some((n) => !n.isRead), [notifications]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#1A1426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={() => markAllReadMutation.mutate()}
          disabled={!hasUnread || markAllReadMutation.isPending}
        >
          <Text style={[styles.markAll, !hasUnread && styles.markAllDisabled]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>Activity updates will appear here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {todayItems.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Today</Text>
              {todayItems.map((n) => (
                <NotifItem key={n.id} item={n} onPress={(id) => markReadMutation.mutate(id)} />
              ))}
            </>
          )}
          {earlierItems.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Earlier</Text>
              {earlierItems.map((n) => (
                <NotifItem key={n.id} item={n} onPress={(id) => markReadMutation.mutate(id)} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
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
  markAllDisabled: { color: "#D1D5DB" },
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
    fontFamily: "Inter_500Medium",
    color: "#1A1426",
    flex: 1,
    marginRight: 8,
  },
  itemTitleUnread: { fontFamily: "Inter_600SemiBold" },
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
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#374151" },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
