import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  User,
  Activity,
  Dumbbell,
  Mail,
  Hash,
  CheckCircle,
  Clock,
  Scale,
  Ruler,
  TrendingUp,
  Calendar,
} from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import axios from "../../api/axios";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ClienteDetailScreen({ route, navigation }) {
  const { client } = route.params;
  const [activeTab, setActiveTab] = useState("perfil");

  //Datos del cliente
  const [medidas, setMedidas] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRutinas, setLoadingRutinas] = useState(false);

  useEffect(() => {
    fetchMedidas();
    fetchRutinas();
  }, []);

  const fetchMedidas = async () => {
    try {
      const res = await axios.get(`/medidas/cliente/${client.id}`);
      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setMedidas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error medidas:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRutinas = async () => {
    try {
      const res = await axios.get(`rutinas/active/${client.id}`);
      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setRutinas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error rutinas:", e);
    } finally {
      setLoadingRutinas(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("es-CL", {
      month: "short",
      day: "numeric",
    });
  };

  // Datos para los graficos
  const getSortedMedidas = () => {
    if (medidas.length < 2) return [];
    return [...medidas]
      .sort(
        (a, b) =>
          new Date(a.fecha_registro || a.created_at) -
          new Date(b.fecha_registro || b.created_at),
      )
      .slice(-6);
  };

  const buildChartData = (sorted, field, color) => {
    const values = sorted.map((m) => parseFloat(m[field]) || 0);
    if (values.every((v) => v === 0)) return null;
    return {
      labels: sorted.map((m) => formatDate(m.fecha_registro || m.created_at)),
      datasets: [
        {
          data: values,
          color: () => color,
          strokeWidth: 2,
        },
      ],
    };
  };

  const sorted = getSortedMedidas();
  const chartPeso = buildChartData(sorted, "peso", "#F97316");
  const chartGrasa = buildChartData(sorted, "porcentaje_grasa", "#3B82F6");
  const chartCintura = buildChartData(sorted, "circunferencia_cintura", "#22C55E");

  const chartConfig = (color) => ({
    backgroundColor: "#111113",
    backgroundGradientFrom: "#111113",
    backgroundGradientTo: "#111113",
    decimalCount: 1,
    color: (opacity = 1) => color.replace("1)", `${opacity})`).replace("#", "rgba(") || `rgba(249,115,22,${opacity})`,
    labelColor: () => "#71717A",
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: color,
    },
    propsForBackgroundLines: {
      stroke: "rgba(255,255,255,0.05)",
    },
  });

  // ═══════════════════════════════════
  // ── TAB: PERFIL ──
  // ═══════════════════════════════════
  const renderPerfil = () => (
    <View style={styles.section}>
      <InfoRow icon={User} label="Nombre" value={client.nombre} />
      <InfoRow icon={Mail} label="Email" value={client.email} />
      <InfoRow icon={Hash} label="RUT" value={client.rut || "--"} />
      <InfoRow
        icon={CheckCircle}
        label="Estado"
        value={
          client.estado === "active" || client.estado_membresia === "active"
            ? "Activo"
            : client.estado === "expired"
              ? "Vencido"
              : "Sin Plan"
        }
        valueColor={
          client.estado === "active" || client.estado_membresia === "active"
            ? "#22C55E"
            : "#EF4444"
        }
      />
      <InfoRow icon={Clock} label="Plan" value={client.plan || "--"} />
      {client.vencimiento_plan && (
        <InfoRow
          icon={Calendar}
          label="Vencimiento"
          value={formatDate(client.vencimiento_plan)}
        />
      )}
      {client.objetivo && (
        <InfoRow icon={TrendingUp} label="Objetivo" value={client.objetivo} />
      )}
    </View>
  );
  // ═══════════════════════════════════
  // ── TAB: PROGRESO ──
  // ═══════════════════════════════════
  const renderChart = (data, title, color) => {
    if (!data) return null;
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <LineChart
          data={data}
          width={SCREEN_WIDTH - 72}
          height={180}
          chartConfig={{
            backgroundColor: "#111113",
            backgroundGradientFrom: "#111113",
            backgroundGradientTo: "#111113",
            decimalCount: 1,
            color: (opacity = 1) => {
              if (color === "#F97316") return `rgba(249, 115, 22, ${opacity})`;
              if (color === "#3B82F6") return `rgba(59, 130, 246, ${opacity})`;
              if (color === "#22C55E") return `rgba(34, 197, 94, ${opacity})`;
              return `rgba(249, 115, 22, ${opacity})`;
            },
            labelColor: () => "#71717A",
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: color,
            },
            propsForBackgroundLines: {
              stroke: "rgba(255,255,255,0.05)",
            },
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
      </View>
    );
  };

  const renderProgreso = () => (
    <View style={styles.section}>
      {loadingStats ? (
        <ActivityIndicator
          color="#F97316"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : medidas.length === 0 ? (
        <View style={styles.emptyState}>
          <TrendingUp color="#71717A" size={40} />
          <Text style={styles.emptyText}>Sin registros de medidas</Text>
          <Text style={styles.emptySubText}>
            Registra medidas desde la web para ver el progreso aquí.
          </Text>
        </View>
      ) : (
        <>
          {renderChart(chartPeso, "Evolución de Peso (kg)", "#F97316")}
          {renderChart(chartGrasa, "Porcentaje de Grasa (%)", "#3B82F6")}
          {renderChart(chartCintura, "Cintura (cm)", "#22C55E")}

          {/* Últimos registros */}
          <Text style={styles.subTitle}>Últimos Registros</Text>
          {medidas.slice(0, 5).map((m, i) => (
            <View key={i} style={styles.medidaCard}>
              <Text style={styles.medidaFecha}>
                {formatDate(m.fecha_registro || m.created_at)}
              </Text>
              <View style={styles.medidaRow}>
                <MedidaItem
                  icon={Scale}
                  label="Peso"
                  value={m.peso}
                  unit="kg"
                />
                <MedidaItem
                  icon={Ruler}
                  label="Altura"
                  value={m.altura}
                  unit="cm"
                />
                <MedidaItem
                  icon={Activity}
                  label="% Grasa"
                  value={m.porcentaje_grasa}
                  unit="%"
                />
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
  // ═══════════════════════════════════
  // ── TAB: RUTINAS ──
  // ═══════════════════════════════════
  const renderRutinas = () => (
    <View style={styles.section}>
      {loadingRutinas ? (
        <ActivityIndicator
          color="#F97316"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : rutinas.length === 0 ? (
        <View style={styles.emptyState}>
          <Dumbbell color="#71717A" size={40} />
          <Text style={styles.emptyText}>Sin rutinas activas</Text>
          <Text style={styles.emptySubText}>
            Asigna una rutina desde la web para verla aquí.
          </Text>
        </View>
      ) : (
        rutinas.map((r, i) => (
          <View key={i} style={styles.rutinaCard}>
            <View style={styles.rutinaHeader}>
              <View style={styles.rutinaBadge}>
                <Dumbbell color="#F97316" size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rutinaNombre}>{r.nombre}</Text>
                <Text style={styles.rutinaInfo}>
                  {r.detalles?.length || 0} ejercicios
                </Text>
              </View>
            </View>
            {/* Lista de ejercicios */}
            {r.detalles && r.detalles.length > 0 && (
              <View style={styles.ejerciciosList}>
                {r.detalles.map((d, j) => (
                  <View key={j} style={styles.ejercicioRow}>
                    <View style={styles.ejercicioNum}>
                      <Text style={styles.ejercicioNumText}>{j + 1}</Text>
                    </View>
                    <View style={styles.ejercicioInfo}>
                      <Text style={styles.ejercicioNombre}>
                        {d.nombre_ejercicio || d.ejercicio}
                      </Text>
                      <Text style={styles.ejercicioDetalles}>
                        {d.series} series × {d.repeticiones} reps
                        {d.peso ? ` · ${d.peso}kg` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header con botón atrás ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft color="#FFFFFF" size={20} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {client.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{client.nombre}</Text>
            <Text style={styles.headerEmail}>{client.email}</Text>
          </View>
        </View>
      </View>
      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {[
          { id: "perfil", icon: User, label: "Perfil" },
          { id: "progreso", icon: Activity, label: "Progreso" },
          { id: "rutinas", icon: Dumbbell, label: "Rutinas" },
        ].map(({ id, icon: Icon, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, activeTab === id && styles.tabActive]}
            onPress={() => setActiveTab(id)}
          >
            <Icon color={activeTab === id ? "#F97316" : "#71717A"} size={16} />
            <Text
              style={[styles.tabText, activeTab === id && styles.tabTextActive]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* ── Contenido ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {activeTab === "perfil" && renderPerfil()}
        {activeTab === "progreso" && renderProgreso()}
        {activeTab === "rutinas" && renderRutinas()}
      </ScrollView>
    </SafeAreaView>
  );
}
function InfoRow({ icon: Icon, label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon color="#71717A" size={16} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}
function MedidaItem({ icon: Icon, label, value, unit }) {
  return (
    <View style={styles.medidaItem}>
      <Icon color="#F97316" size={14} />
      <Text style={styles.medidaLabel}>{label}</Text>
      <Text style={styles.medidaValue}>
        {value != null ? `${value} ${unit}` : "--"}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerEmail: {
    color: "#71717A",
    fontSize: 12,
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabActive: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
  },
  tabText: {
    color: "#71717A",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#F97316",
  },
  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    gap: 10,
  },
  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111113",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: "#71717A",
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "50%",
  },
  // Chart
  chartCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  chartTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subTitle: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  // Medidas
  medidaCard: {
    backgroundColor: "#111113",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  medidaFecha: {
    color: "#A1A1AA",
    fontSize: 12,
    marginBottom: 12,
  },
  medidaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  medidaItem: {
    alignItems: "center",
    gap: 4,
  },
  medidaLabel: {
    color: "#71717A",
    fontSize: 11,
  },
  medidaValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  // Rutinas
  rutinaCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 14,
  },
  rutinaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rutinaBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  rutinaNombre: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  rutinaInfo: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 2,
  },
  ejerciciosList: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
  },
  ejercicioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ejercicioNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  ejercicioNumText: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "bold",
  },
  ejercicioInfo: {
    flex: 1,
  },
  ejercicioNombre: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  ejercicioDetalles: {
    color: "#F97316",
    fontSize: 12,
    marginTop: 2,
  },
  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptySubText: {
    color: "#71717A",
    fontSize: 13,
    textAlign: "center",
  },
});
