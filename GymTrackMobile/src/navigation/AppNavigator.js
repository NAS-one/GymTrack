import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

// Pantallas
import LoginScreen from "../screens/auth/LoginScreen";

// Navegadores
import ClientTabNavigator from "./ClientTabNavigator";
import TrainerTabNavigator from "./TrainerTabNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", backgroundColor: "#000" }}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Usuario Autenticado: Bifurcación por rol
          user.role === "entrenador" || user.role === 2 || user.rol_id === 2 ? (
            <Stack.Screen name="TrainerRoot" component={TrainerTabNavigator} />
          ) : (
            <Stack.Screen name="ClientRoot" component={ClientTabNavigator} />
          )
        ) : (
          // Usuario No Autenticado
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
