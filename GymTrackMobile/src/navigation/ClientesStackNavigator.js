import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TrainerStudentsScreen from "../screens/trainer/TrainerStudentsScreen";
import ClienteDetailScreen from "../screens/trainer/ClienteDetailScreen";

const Stack = createNativeStackNavigator();

export default function ClientesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaAlumnos" component={TrainerStudentsScreen} />
      <Stack.Screen name="DetalleCliente" component={ClienteDetailScreen} />
    </Stack.Navigator>
  );
}
