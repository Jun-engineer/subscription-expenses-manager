import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../lib/auth";
import { apiJson } from "../lib/api";
import { colors, shared } from "../lib/theme";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            setError("");
            try {
              await apiJson("/api/v1/auth/me", { method: "DELETE" });
              await logout();
            } catch (e: any) {
              setError(e.message || String(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={shared.container} contentContainerStyle={shared.scrollContent}>
      <Text style={shared.title}>Settings</Text>

      {error ? <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View> : null}

      <View style={shared.card}>
        <Text style={shared.sectionTitle}>Account</Text>
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Email</Text>
          <Text style={{ color: colors.foreground, fontSize: 15 }}>{user?.email || "—"}</Text>
        </View>
        {user?.display_name && (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Name</Text>
            <Text style={{ color: colors.foreground, fontSize: 15 }}>{user.display_name}</Text>
          </View>
        )}
      </View>

      <View style={shared.card}>
        <Text style={shared.sectionTitle}>About</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>SubManager v1.0.0</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Subscription & Expense Tracking</Text>
      </View>

      <TouchableOpacity
        style={[shared.button, { marginTop: 12 }, busy && { opacity: 0.6 }]}
        onPress={handleLogout}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={shared.buttonText}>Sign Out</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[shared.button, { marginTop: 12, backgroundColor: colors.danger }, busy && { opacity: 0.6 }]}
        onPress={handleDeleteAccount}
        disabled={busy}
      >
        <Text style={shared.buttonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
