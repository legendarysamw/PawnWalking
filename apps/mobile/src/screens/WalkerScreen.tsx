import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, RefreshControl } from "react-native";
import type { BookingDto } from "@pawnwalking/shared";
import { formatCents } from "@pawnwalking/shared";
import { api } from "../api";

interface WalkerProfile {
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  zoneName: string | null;
}

export default function WalkerScreen() {
  const [profile, setProfile] = useState<WalkerProfile | null>(null);
  const [available, setAvailable] = useState<BookingDto[]>([]);
  const [mine, setMine] = useState<BookingDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const me = await api.get<{ walkerProfile: WalkerProfile | null }>("/api/me");
    setProfile(me.walkerProfile);
    if (me.walkerProfile?.subscriptionStatus === "ACTIVE") {
      const [availableRes, mineRes] = await Promise.all([
        api.get<BookingDto[]>("/api/walker/available-bookings"),
        api.get<BookingDto[]>("/api/bookings"),
      ]);
      setAvailable(availableRes);
      setMine(mineRes);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function subscribe() {
    try {
      const { url } = await api.post<{ url: string }>("/api/walker/subscribe");
      Linking.openURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    }
  }

  async function accept(id: string) {
    try {
      await api.post(`/api/bookings/${id}/accept`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept");
    }
  }

  async function complete(id: string) {
    try {
      await api.post(`/api/bookings/${id}/complete`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete");
    }
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (profile.subscriptionStatus !== "ACTIVE") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Almost there</Text>
        <Text style={styles.hint}>
          Subscribe for $9/mo to start receiving bookings. You keep 100% of every walk
          price.
        </Text>
        <Pressable style={styles.primaryButton} onPress={subscribe}>
          <Text style={styles.primaryButtonText}>Subscribe (opens Stripe)</Text>
        </Pressable>
      </View>
    );
  }

  const accepted = mine.filter((b) => b.status === "ACCEPTED");

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Zone: {profile.zoneName}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Available bookings</Text>
      {available.length === 0 && <Text style={styles.hint}>Nothing open right now.</Text>}
      {available.map((b) => (
        <View key={b.id} style={styles.row}>
          <Text>
            {b.durationMinutes} min · {formatCents(b.price)}
          </Text>
          <Pressable style={styles.smallButton} onPress={() => accept(b.id)}>
            <Text style={styles.smallButtonText}>Accept</Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.label, { marginTop: 20 }]}>Your accepted walks</Text>
      {accepted.length === 0 && <Text style={styles.hint}>None yet.</Text>}
      {accepted.map((b) => (
        <View key={b.id} style={styles.row}>
          <Text>
            {b.durationMinutes} min · {formatCents(b.price)}
          </Text>
          <Pressable style={styles.smallButtonDark} onPress={() => complete(b.id)}>
            <Text style={styles.smallButtonText}>Complete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#f9fafb" },
  title: { fontSize: 22, fontWeight: "700" },
  label: { fontSize: 14, color: "#6b7280", fontWeight: "600", marginTop: 4 },
  hint: { fontSize: 13, color: "#9ca3af", marginTop: 6 },
  error: { color: "#dc2626", marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  smallButton: { backgroundColor: "#188245", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallButtonDark: { backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallButtonText: { color: "white", fontWeight: "600", fontSize: 12 },
  primaryButton: { marginTop: 20, backgroundColor: "#188245", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "600" },
});
