import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Flame,
  Users,
  CalendarCheck,
  ClipboardList,
  LogOut,
} from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function TrainerHomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.name}>{user?.nombre || "Entrenador"}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut color="#EF4444" size={22} />
          </TouchableOpacity>
        </View>
        {/* Tarjeta de bienvenida */}
        <View style={styles.welcomeCard}>
          <Flame color="#F97316" size={32} />
          <Text style={styles.welcomeTitle}>Panel de Entrenador</Text>
          <Text style={styles.welcomeSub}>
            Gestiona tu agenda, clientes y planes desde aquí.
          </Text>
        </View>
        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.quickGrid}>
          <View style={styles.quickCard}>
            <CalendarCheck color="#F97316" size={28} />
            <Text style={styles.quickLabel}>Agenda</Text>
            <Text style={styles.quickSub}>Sesiones de hoy</Text>
          </View>
          <View style={styles.quickCard}>
            <Users color="#3B82F6" size={28} />
            <Text style={styles.quickLabel}>Clientes</Text>
            <Text style={styles.quickSub}>Mis alumnos</Text>
          </View>
          <View style={styles.quickCard}>
            <ClipboardList color="#10B981" size={28} />
            <Text style={styles.quickLabel}>Planes</Text>
            <Text style={styles.quickSub}>Asignar rutinas</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  greeting: {
    color: "#A1A1AA",
    fontSize: 16,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
  },
  welcomeCard: {
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
  },
  welcomeSub: {
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  quickSub: {
    color: "#71717A",
    fontSize: 10,
  },
});
