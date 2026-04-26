import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Dumbbell,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CalendarDays,
} from "lucide-react-native";
import axios from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

// ── Helpers de fecha ──
const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Obtiene la fecha local en formato YYYY-MM-DD
const getLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Genera los 7 días de la semana a partir de un día base
const getWeekDays = (centerDate) => {
  const dayOfWeek = centerDate.getDay(); // 0=dom
  const startOfWeek = new Date(centerDate);
  startOfWeek.setDate(centerDate.getDate() - dayOfWeek + 1); // lunes

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

export default function TrainerAgendaScreen() {
  const { user } = useAuth();
  const [sesiones, setSesiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  const weekDays = getWeekDays(fechaSeleccionada);
  const todayStr = getLocalDate(new Date());
  const selectedStr = getLocalDate(fechaSeleccionada);

  // ── Fetch sesiones ──
  const fetchSesiones = async (fecha) => {
    setIsLoading(true);
    try {
      const fechaStr = getLocalDate(fecha);
      const res = await axios.get(`/sesiones/agenda/${user.id}`, {
        params: { fecha: fechaStr },
      });

      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setSesiones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando agenda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSesiones(fechaSeleccionada);
  }, [fechaSeleccionada]);

  // ── Navegación de semanas ──
  const goWeek = (direction) => {
    const newDate = new Date(fechaSeleccionada);
    newDate.setDate(newDate.getDate() + direction * 7);
    setFechaSeleccionada(newDate);
  };

  // ── Confirmar sesión ──
  const confirmarSesion = (idSesion) => {
    Alert.alert(
      "Confirmar sesión",
      "¿Marcar esta sesión como completada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await axios.patch(`/sesiones/${idSesion}/estado`, {
                estado: "realizada",
              });
              fetchSesiones(fechaSeleccionada);
            } catch (error) {
              console.error("Error confirmando sesión:", error);
              Alert.alert("Error", "No se pudo confirmar la sesión.");
            }
          },
        },
      ]
    );
  };

  // ── Formato de hora ──
  const formatHour = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedH = hour % 12 || 12;
    return `${formattedH}:${m.substring(0, 2)} ${ampm}`;
  };

  // ── Render vacío ──
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <CheckCircle color="#10B981" size={48} style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>¡Sin sesiones!</Text>
      <Text style={styles.emptySubtitle}>
        No tienes sesiones programadas para este día.
      </Text>
    </View>
  );

  // ── Render tarjeta de sesión ──
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Hora y duración */}
      <View style={styles.cardRow}>
        <View style={styles.timeBadge}>
          <Clock color="#F97316" size={13} />
          <Text style={styles.timeText}>
            {formatHour(item.hora_formateada)}
          </Text>
        </View>
        <Text style={styles.durationText}>
          {item.duracion_minutos || 60} min
        </Text>
      </View>

      {/* Nombre del cliente */}
      <Text style={styles.clientName}>{item.nombre_cliente}</Text>

      {/* Tags */}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Dumbbell color="#9CA3AF" size={13} />
          <Text style={styles.tagText}>Personalizado</Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            item.estado === "realizada" && styles.estadoRealizada,
          ]}
        >
          <Text
            style={[
              styles.estadoText,
              item.estado === "realizada" && styles.estadoRealizadaText,
            ]}
          >
            {item.estado === "realizada" ? "Completada" : "Pendiente"}
          </Text>
        </View>
      </View>

      {/* Botón confirmar (solo si está pendiente) */}
      {item.estado !== "realizada" && (
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => confirmarSesion(item.id)}
          activeOpacity={0.7}
        >
          <CircleCheck color="#FFFFFF" size={16} />
          <Text style={styles.confirmBtnText}>Marcar como completada</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Tu agenda</Text>
            <Text style={styles.title}>
              {MESES[fechaSeleccionada.getMonth()]}{" "}
              {fechaSeleccionada.getFullYear()}
            </Text>
          </View>
          <View style={styles.iconContainer}>
            <CalendarDays color="#F97316" size={22} />
          </View>
        </View>

        {/* ── Calendario semanal ── */}
        <View style={styles.weekContainer}>
          <TouchableOpacity onPress={() => goWeek(-1)} style={styles.weekArrow}>
            <ChevronLeft color="#71717A" size={20} />
          </TouchableOpacity>

          <View style={styles.weekDays}>
            {weekDays.map((day) => {
              const dayStr = getLocalDate(day);
              const isSelected = dayStr === selectedStr;
              const isToday = dayStr === todayStr;

              return (
                <TouchableOpacity
                  key={dayStr}
                  onPress={() => setFechaSeleccionada(new Date(day))}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      isSelected && styles.dayLabelSelected,
                    ]}
                  >
                    {DIAS_SEMANA[day.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                      isToday && !isSelected && styles.dayNumberToday,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => goWeek(1)} style={styles.weekArrow}>
            <ChevronRight color="#71717A" size={20} />
          </TouchableOpacity>
        </View>

        {/* ── Sesiones del día ── */}
        <Text style={styles.sectionTitle}>
          Sesiones · {fechaSeleccionada.getDate()}{" "}
          {MESES[fechaSeleccionada.getMonth()].substring(0, 3)}
        </Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : (
          <FlatList
            data={sesiones}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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

  // ── Calendario semanal ──
  weekContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111113",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  weekArrow: {
    padding: 4,
  },
  weekDays: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dayButton: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    minWidth: 36,
  },
  dayButtonSelected: {
    backgroundColor: "#F97316",
  },
  dayLabel: {
    color: "#71717A",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: "#FFFFFF",
  },
  dayNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
  },
  dayNumberToday: {
    color: "#F97316",
  },

  // ── Sección ──
  sectionTitle: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    paddingVertical: 50,
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

  // ── Tarjeta de sesión ──
  card: {
    backgroundColor: "#111113",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  timeText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "bold",
  },
  durationText: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "600",
  },
  clientName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  tagText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  estadoBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoRealizada: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  estadoText: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "bold",
  },
  estadoRealizadaText: {
    color: "#10B981",
  },

  // ── Botón confirmar ──
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
