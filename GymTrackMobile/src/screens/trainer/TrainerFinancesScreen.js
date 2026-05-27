import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Wallet,
  DollarSign,
  Users,
  TrendingUp,
  CalendarCheck,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react-native";
import axios from "../../api/axios";

export default function TrainerFinancesScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinanzas = async () => {
    try {
      const res = await axios.get("/entrenadores/mis-finanzas");
      setData(res.data.body);
    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanzas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanzas();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Wallet color="#71717A" size={40} />
          <Text style={styles.errorText}>
            No se pudieron cargar tus datos financieros.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { perfil, sesiones, totalesMes, totalEstimado } = data;
  const esFijo = perfil.modelo_contrato === "sueldo_fijo";

  const formatMoney = (amount) => {
    if (amount == null) return "$0";
    return `$${Number(amount).toLocaleString("es-CL")}`;
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "realizada":
        return { bg: "rgba(34, 197, 94, 0.1)", color: "#22C55E", icon: CheckCircle };
      case "cancelada":
        return { bg: "rgba(239, 68, 68, 0.1)", color: "#EF4444", icon: XCircle };
      default:
        return { bg: "rgba(249, 115, 22, 0.1)", color: "#F97316", icon: AlertCircle };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F97316"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Wallet color="#22C55E" size={16} />
            <Text style={styles.headerBadge}>
              {esFijo ? "Contrato Sueldo Fijo" : "Contrato por Comisión"}
            </Text>
          </View>
          <Text style={styles.headerTitle}>Mis Finanzas</Text>
          <Text style={styles.headerSubtitle}>
            Balance financiero del mes actual
          </Text>
        </View>

        {/* KPIs */}
        <View style={styles.kpiContainer}>
          {esFijo ? (
            <>
              <KpiCard
                title="Sueldo Base"
                value={formatMoney(perfil.sueldo_base)}
                subtitle="Monto fijo mensual"
                icon={DollarSign}
                color="green"
              />
              <KpiCard
                title="Bono por Alumnos"
                value={formatMoney(5000 * (perfil.total_alumnos_activos || 0))}
                subtitle={`${perfil.total_alumnos_activos || 0} alumnos activos`}
                icon={Users}
                color="blue"
              />
              <KpiCard
                title="Total Estimado"
                value={formatMoney(totalEstimado)}
                subtitle="Sueldo + Bonos"
                icon={TrendingUp}
                color="orange"
                highlight
              />
            </>
          ) : (
            <>
              <KpiCard
                title="Comisiones del Mes"
                value={formatMoney(totalesMes?.comisiones_realizadas)}
                subtitle={`${totalesMes?.total_sesiones || 0} sesiones este mes`}
                icon={DollarSign}
                color="green"
              />
              <KpiCard
                title="Sesiones Realizadas"
                value={`${(totalesMes?.total_sesiones || 0) - (totalesMes?.sesiones_pendientes || 0)}`}
                subtitle={`${totalesMes?.sesiones_pendientes || 0} pendientes`}
                icon={CalendarCheck}
                color="blue"
              />
              <KpiCard
                title="Total Ganado"
                value={formatMoney(totalEstimado)}
                subtitle={`Retención gym: ${(Number(perfil.porcentaje_retencion || 0) * 100).toFixed(0)}%`}
                icon={TrendingUp}
                color="orange"
                highlight
              />
            </>
          )}
        </View>

        {/* Sesiones del Mes */}
        <View style={styles.sesionesSection}>
          <Text style={styles.sectionTitle}>Sesiones del Mes</Text>

          {!sesiones || sesiones.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock color="#71717A" size={36} />
              <Text style={styles.emptyText}>
                No tienes sesiones registradas este mes.
              </Text>
            </View>
          ) : (
            sesiones.map((s, i) => {
              const estado = getEstadoStyle(s.estado);
              const EstadoIcon = estado.icon;
              return (
                <View key={s.id || i} style={styles.sesionCard}>
                  {/* Fila superior: Fecha + Estado */}
                  <View style={styles.sesionTop}>
                    <Text style={styles.sesionFecha}>
                      {s.fecha_formateada}
                      <Text style={styles.sesionHora}> {s.hora_formateada}</Text>
                    </Text>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: estado.bg },
                      ]}
                    >
                      <EstadoIcon color={estado.color} size={10} />
                      <Text style={[styles.estadoText, { color: estado.color }]}>
                        {s.estado}
                      </Text>
                    </View>
                  </View>

                  {/* Cliente */}
                  <View style={styles.sesionCliente}>
                    <User color="#71717A" size={14} />
                    <Text style={styles.sesionClienteText}>
                      {s.cliente || "Sin cliente"}
                    </Text>
                  </View>

                  {/* Fila inferior: Duración + Montos */}
                  <View style={styles.sesionBottom}>
                    <View style={styles.sesionStat}>
                      <Text style={styles.statLabel}>Duración</Text>
                      <Text style={styles.statValue}>
                        {s.duracion_minutos || 60} min
                      </Text>
                    </View>
                    <View style={styles.sesionStat}>
                      <Text style={styles.statLabel}>Cobrado</Text>
                      <Text style={styles.statValue}>
                        {formatMoney(s.valor_cobrado)}
                      </Text>
                    </View>
                    <View style={styles.sesionStat}>
                      <Text style={styles.statLabel}>Tu Comisión</Text>
                      <Text style={[styles.statValue, { color: "#22C55E" }]}>
                        {formatMoney(s.monto_entrenador)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente KPI Card
function KpiCard({ title, value, subtitle, icon: Icon, color, highlight }) {
  const colors = {
    green: {
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.2)",
      text: "#22C55E",
      iconBg: "rgba(34, 197, 94, 0.15)",
    },
    blue: {
      bg: "rgba(59, 130, 246, 0.08)",
      border: "rgba(59, 130, 246, 0.2)",
      text: "#3B82F6",
      iconBg: "rgba(59, 130, 246, 0.15)",
    },
    orange: {
      bg: "rgba(249, 115, 22, 0.08)",
      border: "rgba(249, 115, 22, 0.2)",
      text: "#F97316",
      iconBg: "rgba(249, 115, 22, 0.15)",
    },
  };

  const c = colors[color] || colors.green;

  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: c.bg,
          borderColor: highlight ? "rgba(249, 115, 22, 0.35)" : c.border,
        },
      ]}
    >
      <View style={styles.kpiTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kpiTitle}>{title}</Text>
          <Text style={[styles.kpiValue, { color: c.text }]}>{value}</Text>
        </View>
        <View style={[styles.kpiIcon, { backgroundColor: c.iconBg }]}>
          <Icon color={c.text} size={18} />
        </View>
      </View>
      <Text style={styles.kpiSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    color: "#71717A",
    fontSize: 14,
    textAlign: "center",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  headerBadge: {
    color: "#52525B",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: "#52525B",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },

  // KPIs
  kpiContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  kpiTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  kpiTitle: {
    color: "#71717A",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "900",
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiSubtitle: {
    color: "#52525B",
    fontSize: 12,
    fontWeight: "600",
  },

  // Sesiones
  sesionesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "#71717A",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 14,
  },
  sesionCard: {
    backgroundColor: "#111113",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 12,
  },
  sesionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sesionFecha: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
  },
  sesionHora: {
    color: "#52525B",
    fontSize: 12,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sesionCliente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sesionClienteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sesionBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
  },
  sesionStat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#52525B",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: "#71717A",
    fontSize: 13,
  },
});
