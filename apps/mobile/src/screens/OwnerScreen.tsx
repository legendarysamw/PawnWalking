import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, RefreshControl } from "react-native";
import type { BookingDto, DurationMinutes, ZoneDto } from "@pawnwalking/shared";
import { formatCents, priceForDuration } from "@pawnwalking/shared";
import { api, API_URL } from "../api";

export default function OwnerScreen() {
  const [balance, setBalance] = useState(0);
  const [zones, setZones] = useState<ZoneDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const me = await api.get<{ wallet: { balance: number } }>("/api/me");
    setBalance(me.wallet.balance);
    const [zonesRes, bookingsRes] = await Promise.all([
      api.get<ZoneDto[]>("/api/zones"),
      api.get<BookingDto[]>("/api/bookings"),
    ]);
    setZones(zonesRes);
    setBookings(bookingsRes);
    setZoneId((current) => current || zonesRes[0]?.id || "");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function topUp() {
    try {
      const { url } = await api.post<{ url: string }>("/api/wallet/topup", { amountCents: 5000 });
      Linking.openURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start top-up");
    }
  }

  async function book() {
    if (!zoneId) return;
    setError(null);
    try {
      await api.post("/api/bookings", { zoneId, durationMinutes: duration });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    }
  }

  const selectedZone = zones.find((z) => z.id === zoneId);
  const price = selectedZone ? priceForDuration(selectedZone, duration) : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.label}>Wallet balance</Text>
      <Text style={styles.balance}>{formatCents(balance)}</Text>
      <Pressable style={styles.secondaryButton} onPress={topUp}>
        <Text style={styles.secondaryButtonText}>Top up $50 (opens Stripe)</Text>
      </Pressable>
      <Text style={styles.hint}>API: {API_URL}</Text>

      <Text style={[styles.label, { marginTop: 24 }]}>Zone</Text>
      <View style={styles.chipRow}>
        {zones.map((z) => (
          <Pressable
            key={z.id}
            onPress={() => setZoneId(z.id)}
            style={[styles.chip, zoneId === z.id && styles.chipActive]}
          >
            <Text style={zoneId === z.id ? styles.chipTextActive : styles.chipText}>
              {z.name}, {z.city}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Duration</Text>
      <View style={styles.chipRow}>
        {[30, 60].map((d) => (
          <Pressable
            key={d}
            onPress={() => setDuration(d as DurationMinutes)}
            style={[styles.chip, duration === d && styles.chipActive]}
          >
            <Text style={duration === d ? styles.chipTextActive : styles.chipText}>{d} min</Text>
          </Pressable>
        ))}
      </View>

      {price !== null && <Text style={styles.hint}>Flat rate: {formatCents(price)}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.primaryButton} onPress={book}>
        <Text style={styles.primaryButtonText}>
          Book & pay {price !== null ? formatCents(price) : ""}
        </Text>
      </Pressable>

      <Text style={[styles.label, { marginTop: 24 }]}>Your bookings</Text>
      {bookings.length === 0 && <Text style={styles.hint}>No bookings yet.</Text>}
      {bookings.map((b) => (
        <View key={b.id} style={styles.bookingRow}>
          <Text>
            {b.zoneName} · {b.durationMinutes} min · {formatCents(b.price)}
          </Text>
          <Text style={styles.hint}>{b.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: "#f9fafb" },
  label: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  balance: { fontSize: 32, fontWeight: "700", marginTop: 4 },
  hint: { fontSize: 12, color: "#9ca3af", marginTop: 6 },
  error: { color: "#dc2626", marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { borderColor: "#188245", backgroundColor: "#e0f6e7" },
  chipText: { color: "#111827" },
  chipTextActive: { color: "#146638", fontWeight: "600" },
  primaryButton: { marginTop: 20, backgroundColor: "#188245", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  secondaryButton: { marginTop: 12, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: { fontWeight: "500" },
  bookingRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb" },
});
