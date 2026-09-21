import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import type { Role, ZoneDto } from "@pawnwalking/shared";
import { api } from "../api";

export default function LoginScreen({ onLoggedIn }: { onLoggedIn: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("OWNER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zones, setZones] = useState<ZoneDto[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<ZoneDto[]>("/api/zones")
      .then((data) => {
        setZones(data);
        if (data[0]) setZoneId(data[0].id);
      })
      .catch(() => setError("Could not load zones"));
  }, []);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/login", {
        role,
        name,
        email,
        zoneId: role === "WALKER" ? zoneId : undefined,
      });
      onLoggedIn(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PawnWalking</Text>
      <Text style={styles.subtitle}>Phase 1 demo auth - no password.</Text>

      <View style={styles.roleRow}>
        <Pressable
          onPress={() => setRole("OWNER")}
          style={[styles.roleButton, role === "OWNER" && styles.roleButtonActive]}
        >
          <Text style={role === "OWNER" ? styles.roleTextActive : styles.roleText}>Dog owner</Text>
        </Pressable>
        <Pressable
          onPress={() => setRole("WALKER")}
          style={[styles.roleButton, role === "WALKER" && styles.roleButtonActive]}
        >
          <Text style={role === "WALKER" ? styles.roleTextActive : styles.roleText}>Dog walker</Text>
        </Pressable>
      </View>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {role === "WALKER" && (
        <View style={styles.zoneList}>
          {zones.map((z) => (
            <Pressable
              key={z.id}
              onPress={() => setZoneId(z.id)}
              style={[styles.zoneChip, zoneId === z.id && styles.roleButtonActive]}
            >
              <Text style={zoneId === z.id ? styles.roleTextActive : styles.roleText}>
                {z.name}, {z.city}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.submit} onPress={handleSubmit} disabled={loading || !name || !email}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Continue</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: "#f9fafb" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#6b7280", marginTop: 4, marginBottom: 24 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  roleButtonActive: { borderColor: "#188245", backgroundColor: "#e0f6e7" },
  roleText: { color: "#111827", fontWeight: "500" },
  roleTextActive: { color: "#146638", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  zoneList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  zoneChip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  error: { color: "#dc2626", marginBottom: 8 },
  submit: {
    marginTop: 8,
    backgroundColor: "#188245",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "600" },
});
