import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  X,
  User,
  Activity,
  Dumbbell,
  Mail,
  Hash,
  Scale,
  Ruler,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react-native";
import axios from "../api/axios";

export default function ClienteDetailSheet({
  visible,
  client,
  onClose,
  initialTab = "perfil",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [medidas, setMedidas] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [loadingMedidas, setLoadingMedidas] = useState(false);
  const [loadingRutinas, setLoadingRutinas] = useState(false);

  useEffect(() => {
    if (visible && client) {
      setActiveTab(initialTab);
      if (initialTab === "progreso") fetchMedidas();
      if (initialTab === "rutinas") fetchRutinas();
    }
  }, [visible, client, initialTab]);

  const fetchMedidas = async () => {
    setLoadingMedidas(true);
    try {
      const res = await axios.get(`/medidas/cliente/${client.id}`);
      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setMedidas(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (e) {
      console.error("Error medidas:", e);
    } finally {
      setLoadingMedidas(false);
    }
  };

  const fetchRutinas = async () => {
    setLoadingRutinas(true);
    try {
      const res = await axios.get(`/rutinas/active/${client.id}`);
      let data = res.data.body || res.data;
      if (data.body) data = data.body;
      setRutinas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error rutinas:", e);
    } finally {
      setLoadingRutinas(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "progreso" && medidas.length === 0) fetchMedidas();
    if (tab === "rutinas" && rutinas.length === 0) fetchRutinas();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("es-CL");
  };

  if (!client) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* ── Handle bar ── */}
          <View style={styles.handleBar} />
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {client.nombre?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{client.nombre}</Text>
              <Text style={styles.headerEmail}>{client.email}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#71717A" size={20} />
            </TouchableOpacity>
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
                onPress={() => handleTabChange(id)}
              >
                <Icon
                  color={activeTab === id ? "#F97316" : "#71717A"}
                  size={16}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === id && styles.tabTextActive,
                  ]}
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
          >
            {/* PERFIL */}
            {activeTab === "perfil" && (
              <View style={styles.section}>
                <InfoRow icon={User} label="Nombre" value={client.nombre} />
                <InfoRow icon={Mail} label="Email" value={client.email} />
                <InfoRow icon={Hash} label="RUT" value={client.rut || "--"} />
                <InfoRow
                  icon={CheckCircle}
                  label="Estado"
                  value={client.estado_membresia || client.estado || "--"}
                  valueColor={
                    client.estado_membresia === "active" ||
                    client.estado === "active"
                      ? "#22C55E"
                      : "#EF4444"
                  }
                />
                <InfoRow
                  icon={Clock}
                  label="Plan"
                  value={client.plan || "--"}
                />
              </View>
            )}
            {/* PROGRESO */}
            {activeTab === "progreso" && (
              <View style={styles.section}>
                {loadingMedidas ? (
                  <ActivityIndicator
                    color="#F97316"
                    style={{ marginTop: 40 }}
                  />
                ) : medidas.length === 0 ? (
                  <View style={styles.emptyState}>
                    <TrendingUp color="#71717A" size={40} />
                    <Text style={styles.emptyText}>
                      Sin registros de medidas
                    </Text>
                  </View>
                ) : (
                  medidas.map((m, i) => (
                    <View key={i} style={styles.medidaCard}>
                      <Text style={styles.medidaFecha}>
                        📅 {formatDate(m.fecha || m.created_at)}
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
                  ))
                )}
              </View>
            )}
            {/* RUTINAS */}
            {activeTab === "rutinas" && (
              <View style={styles.section}>
                {loadingRutinas ? (
                  <ActivityIndicator
                    color="#F97316"
                    style={{ marginTop: 40 }}
                  />
                ) : rutinas.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Dumbbell color="#71717A" size={40} />
                    <Text style={styles.emptyText}>Sin rutinas activas</Text>
                  </View>
                ) : (
                  rutinas.map((r, i) => (
                    <View key={i} style={styles.rutinaCard}>
                      <View style={styles.rutinaHeader}>
                        <Dumbbell color="#F97316" size={16} />
                        <Text style={styles.rutinaNombre}>{r.nombre}</Text>
                      </View>
                      {r.detalles && r.detalles.length > 0 && (
                        <View style={styles.ejerciciosList}>
                          {r.detalles.slice(0, 4).map((d, j) => (
                            <Text key={j} style={styles.ejercicioItem}>
                              • {d.nombre_ejercicio || d.ejercicio}{" "}
                              <Text style={styles.ejercicioSeries}>
                                {d.series}×{d.repeticiones}
                              </Text>
                            </Text>
                          ))}
                          {r.detalles.length > 4 && (
                            <Text style={styles.masEjercicios}>
                              +{r.detalles.length - 4} más...
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
// Componente auxiliar fila de info
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
// Componente auxiliar medida
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
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    backgroundColor: "#0A0A0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "50%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#3F3F46",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#F97316",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerEmail: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
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
    paddingVertical: 8,
    borderRadius: 10,
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
  // Contenido
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    gap: 10,
  },
  // Info rows (Perfil)
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
  // Medidas (Progreso)
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
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    gap: 10,
  },
  rutinaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rutinaNombre: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  ejerciciosList: {
    gap: 4,
    paddingLeft: 4,
  },
  ejercicioItem: {
    color: "#A1A1AA",
    fontSize: 13,
  },
  ejercicioSeries: {
    color: "#F97316",
    fontWeight: "600",
  },
  masEjercicios: {
    color: "#71717A",
    fontSize: 12,
    fontStyle: "italic",
  },
  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: "#71717A",
    fontSize: 14,
  },
});
