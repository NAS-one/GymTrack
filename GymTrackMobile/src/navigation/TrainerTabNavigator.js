import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  CalendarDays,
  Home,
  Users,
  ClipboardList,
  Wallet,
} from "lucide-react-native";

import TrainerAgendaScreen from "../screens/trainer/TrainerAgendaScreen";
import ClientesStackNavigator from "./ClientesStackNavigator";
import TrainerHomeScreen from "../screens/trainer/TrainerHomeScreen";
import TrainerPlansScreen from "../screens/trainer/TrainerPlansScreen";
import TrainerFinancesScreen from "../screens/trainer/TrainerFinancesScreen";

const Tab = createBottomTabNavigator();

export default function TrainerTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#0A0A0B",
          borderTopColor: "#1A1A1E",
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#71717A",
      }}
    >
      <Tab.Screen
        name="Agenda"
        component={TrainerAgendaScreen}
        options={{
          tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Inicio"
        component={TrainerHomeScreen}
        options={{
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#F97316",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 25,
                shadowColor: "#F97316",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Home color="#FFFFFF" size={26} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Planes"
        component={TrainerPlansScreen}
        options={{
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Finanzas"
        component={TrainerFinancesScreen}
        options={{
          tabBarIcon: ({ color }) => <Wallet color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}
