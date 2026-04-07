import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../lib/auth";
import { colors, shared } from "../lib/theme";

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (tab === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.accent, textAlign: "center", marginBottom: 8 }}>
          SubManager
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 32 }}>
          Track subscriptions, expenses & passwords
        </Text>

        {/* Tabs */}
        <View style={{ flexDirection: "row", marginBottom: 20, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" }}>
          {(["login", "signup"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: tab === t ? colors.accent : "transparent" }}
              onPress={() => { setTab(t); setError(""); }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: tab === t ? "#fff" : colors.muted }}>
                {t === "login" ? "Log In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={shared.errorBox}>
            <Text style={shared.errorText}>{error}</Text>
          </View>
        ) : null}

        {tab === "signup" && (
          <TextInput
            style={shared.input}
            placeholder="Display name (optional)"
            placeholderTextColor={colors.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={shared.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={[shared.input, { marginBottom: 16 }]}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity style={[shared.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={shared.buttonText}>{tab === "login" ? "Log In" : "Create Account"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
