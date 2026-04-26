import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Users,
  Eye,
  Activity,
  Dumbbell,
  User,
  ChevronRight,
} from "lucide-react-native";
import axios from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import ClienteDetailSheet from "../../components/ClienteDetailSheet";

export default function TrainerStudentsScreen({ navigation }) {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  //Estado para expandir la tarjeta y ver opciones
  const [expandedId, setExpandedId] = useState(null);

  const fetchAlumnos = async () => {
    try {
      const res = await axios.get("/entrenadores/mis-alumnos");
      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setAlumnos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando alumnos:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAlumnos();
  }, []);

  //Filtrar por busqueda
  const alumnosFiltrados = alumnos.filter((a) =>
    a.nombre?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  //Obtener estado visual
  const getEstado = (alumno) => {
    if (alumno.estado === "active" || alumno.estado_membresia === "active")
      return { label: "Activo", color: "#22C55E", bg: "rgba(34,197,94,0.1)" };
    if (alumno.estado === "expired" || alumno.estado_membresia === "expired")
      return { label: "Vencido", color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
    return { label: "Sin Plan", color: "#71717A", bg: "rgba(113,113,122,0.1)" };
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  //Render de cada alumno
  const renderItem = ({ item }) => {
    const estado = getEstado(item);
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("DetalleCliente", { client: item })}
        activeOpacity={0.7}
      >
        {/* Fila principal */}
        <View style={styles.cardMain}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.nombre}</Text>
            <Text style={styles.cardEmail}>{item.email}</Text>
          </View>
          {/* Estado + Chevron */}
          <View style={styles.cardRight}>
            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <View
                style={[styles.estadoDot, { backgroundColor: estado.color }]}
              />
              <Text style={[styles.estadoText, { color: estado.color }]}>
                {estado.label}
              </Text>
            </View>
            <ChevronRight
              color="#71717A"
              size={16}
              style={{
                transform: [{ rotate: isExpanded ? "90deg" : "0deg" }],
              }}
            />
          </View>
        </View>
        {/* Opciones expandibles (igual que la web) */}
        {isExpanded && (
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Eye color="#A1A1AA" size={18} />
              <Text style={styles.actionText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnBlue]}>
              <Activity color="#3B82F6" size={18} />
              <Text style={[styles.actionText, { color: "#3B82F6" }]}>
                Progreso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOrange]}
            >
              <Dumbbell color="#F97316" size={18} />
              <Text style={[styles.actionText, { color: "#F97316" }]}>
                Rutinas
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Vista vacía ──
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Users color="#71717A" size={48} style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Sin alumnos</Text>
      <Text style={styles.emptySubtitle}>
        No tienes alumnos asignados actualmente.
      </Text>
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Mis alumnos</Text>
            <Text style={styles.title}>
              {alumnosFiltrados.length} cliente
              {alumnosFiltrados.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.iconContainer}>
            <Users color="#F97316" size={22} />
          </View>
        </View>
        {/* ── Buscador ── */}
        <View style={styles.searchContainer}>
          <Search
            color="#71717A"
            size={16}
            style={{ position: "absolute", left: 14, zIndex: 1 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar alumno..."
            placeholderTextColor="#52525B"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        {/* ── Lista ── */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : (
          <FlatList
            data={alumnosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F97316"
              />
            }
          />
        )}
      </View>
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
  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  greeting: {
    color: "#A1A1AA",
    fontSize: 14,
    marginBottom: 2,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Buscador ──
  searchContainer: {
    position: "relative",
    marginBottom: 16,
    justifyContent: "center",
  },
  searchInput: {
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingLeft: 42,
    paddingRight: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  // ── Lista ──
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
  },
  // ── Tarjeta de alumno ──
  card: {
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  cardEmail: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  // ── Badge de estado ──
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  estadoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ── Acciones expandibles ──
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  actionBtn: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  actionBtnBlue: {
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  actionBtnOrange: {
    backgroundColor: "rgba(249,115,22,0.06)",
  },
  actionText: {
    color: "#A1A1AA",
    fontSize: 11,
    fontWeight: "600",
  },
});
