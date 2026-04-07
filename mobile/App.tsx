import React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/lib/auth";
import { colors } from "./src/lib/theme";

import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import SubscriptionsScreen from "./src/screens/SubscriptionsScreen";
import ExpensesScreen from "./src/screens/ExpensesScreen";
import VaultScreen from "./src/screens/VaultScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.cardBorder,
    primary: colors.accent,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Subs: "🔄",
    Expenses: "💰",
    Vault: "🔐",
    Alerts: "🔔",
    Settings: "⚙️",
  };
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ fontSize: 20 }}>
        <ActivityIndicator size={0} />
      </View>
      {/* Using text emoji as lightweight tab icons */}
      <View style={{ opacity: focused ? 1 : 0.5 }}>
        <ActivityIndicator size={0} />
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.cardBorder },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Home: "🏠",
            Subs: "🔄",
            Expenses: "💰",
            Vault: "🔐",
            Alerts: "🔔",
            Settings: "⚙️",
          };
          const emoji = icons[route.name] || "📱";
          return (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              <ActivityIndicator size={0} />
              <View style={{ position: "absolute", top: -8 }}>
                <React.Fragment>
                  {/* emoji icon rendered via tab label */}
                </React.Fragment>
              </View>
            </View>
          );
        },
        tabBarLabel: (() => {
          const icons: Record<string, string> = {
            Home: "🏠 Home",
            Subs: "🔄 Subs",
            Expenses: "💰 Cost",
            Vault: "🔐 Vault",
            Alerts: "🔔 Alerts",
            Settings: "⚙️ More",
          };
          return icons[route.name] || route.name;
        })(),
        tabBarIconStyle: { display: "none" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", paddingVertical: 4 },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <Tab.Screen name="Subs" component={SubscriptionsScreen} options={{ title: "Subscriptions" }} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ title: "Expenses" }} />
      <Tab.Screen name="Vault" component={VaultScreen} options={{ title: "Vault" }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
