import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, StatusBar, Dimensions
} from 'react-native';
import {
    User, Settings, CreditCard, Bell, Shield,
    LogOut, ChevronRight, Edit2, Activity, Ruler, Weight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../theme/colors';

// ─── Paleta extendida Enterprise (Consistente con Home) ───────────────────
const C = {
    ...COLORS,
    orange: '#F97316',
    orangeDim: 'rgba(249,115,22,0.15)',
    orangeGlow: 'rgba(249,115,22,0.35)',
    emerald: '#10B981',
    emeraldDim: 'rgba(16,185,129,0.15)',
    red: '#EF4444',
    redDim: 'rgba(239,68,68,0.1)',
    card: '#111113',
    cardBorder: '#1F1F23',
};

// ─── Utilidades de animación ────────────────────────────────────────────────
const useFadeSlide = (delay = 0) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return { opacity, transform: [{ translateY }] };
};

// ─── Componente Físico Táctil (Micro-interacciones) ─────────────────────────
const TouchableScale = ({ children, onPress, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Componentes de UI Internos ─────────────────────────────────────────────
const MenuItem = ({ icon: Icon, label, color = C.text, hideArrow = false, isDanger = false, onPress }) => (
    <TouchableScale onPress={onPress}>
        <View style={[styles.menuItem, isDanger && styles.menuItemDanger]}>
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, isDanger && { backgroundColor: C.redDim }]}>
                    <Icon color={isDanger ? C.red : C.textMuted} size={20} />
                </View>
                <Text style={[styles.menuLabel, { color }]}>{label}</Text>
            </View>
            {!hideArrow && <ChevronRight color={C.border} size={20} />}
        </View>
    </TouchableScale>
);

const PhysicalMetric = ({ icon: Icon, value, unit, label }) => (
    <View style={styles.metricBox}>
        <Icon color={C.orange} size={20} style={{ marginBottom: 8 }} />
        <Text style={styles.metricValue}>{value}<Text style={styles.metricUnit}>{unit}</Text></Text>
        <Text style={styles.metricLabel}>{label}</Text>
    </View>
);

// ═══════════════════════════════════════════════════════════════════════════
//  PANTALLA DE PERFIL
// ═══════════════════════════════════════════════════════════════════════════
export default function ProfileScreen() {
    const { user, logout } = useAuth();

    // Animaciones secuenciales
    const headerAnim = useFadeSlide(0);
    const membershipAnim = useFadeSlide(100);
    const metricsAnim = useFadeSlide(200);
    const menuAnim = useFadeSlide(300);

    const firstName = user?.nombre?.split(' ')[0] || 'Cliente';
    const initial = firstName.charAt(0);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── 1. HEADER / AVATAR ──────────────────────────────────────── */}
                <Animated.View style={[styles.headerSection, headerAnim]}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarGlow} />
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <Edit2 color="#FFF" size={12} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{user?.nombre || 'Usuario GymTrack'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'cliente@gymtrack.cl'}</Text>
                </Animated.View>

                {/* ── 2. TARJETA DE MEMBRESÍA ─────────────────────────────────── */}
                <Animated.View style={[styles.section, membershipAnim]}>
                    <Text style={styles.sectionTitle}>Membresía</Text>
                    <LinearGradient colors={[C.card, '#1A1A24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.membershipCard}>
                        <View style={styles.membershipTop}>
                            <View>
                                <Text style={styles.membershipName}>Plan Black Anual</Text>
                                <Text style={styles.membershipId}>ID: {user?.id?.substring(0, 8) || 'GT-847291'}</Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Activo</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.membershipBottom}>
                            <Text style={styles.membershipSub}>Vence el 15 Nov, 2026</Text>
                            <Text style={styles.membershipDays}>Quedan 180 días</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* ── 3. MÉTRICAS FÍSICAS (Fase 5 DB) ─────────────────────────── */}
                <Animated.View style={[styles.section, metricsAnim]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Medidas Físicas</Text>
                        <TouchableOpacity><Text style={styles.linkText}>Actualizar</Text></TouchableOpacity>
                    </View>
                    <View style={styles.metricsGrid}>
                        <PhysicalMetric icon={Weight} value="74" unit="kg" label="Peso actual" />
                        <PhysicalMetric icon={Activity} value="14" unit="%" label="Índice de Grasa" />
                        <PhysicalMetric icon={Ruler} value="178" unit="cm" label="Estatura" />
                    </View>
                </Animated.View>

                {/* ── 4. MENÚ DE CONFIGURACIÓN ────────────────────────────────── */}
                <Animated.View style={[styles.section, menuAnim]}>
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    <View style={styles.menuContainer}>
                        <MenuItem icon={User} label="Datos de la Cuenta" />
                        <MenuItem icon={CreditCard} label="Métodos de Pago" />
                        <MenuItem icon={Bell} label="Notificaciones" />
                        <MenuItem icon={Shield} label="Privacidad y Seguridad" />
                        <MenuItem icon={Settings} label="Ajustes de la Aplicación" />
                    </View>
                </Animated.View>

                {/* ── 5. CERRAR SESIÓN ────────────────────────────────────────── */}
                <Animated.View style={[styles.section, menuAnim, { marginTop: 10 }]}>
                    <MenuItem
                        icon={LogOut}
                        label="Cerrar Sesión"
                        color={C.red}
                        hideArrow
                        isDanger
                        onPress={logout}
                    />
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ESTILOS
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

    // Header & Avatar
    headerSection: { alignItems: 'center', marginBottom: 35 },
    avatarWrapper: { position: 'relative', marginBottom: 15 },
    avatarGlow: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, backgroundColor: C.orangeGlow, borderRadius: 50, opacity: 0.5 },
    avatarContainer: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.cardBorder, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.card },
    avatarText: { color: C.text, fontSize: 32, fontWeight: '900' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: C.orange, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.background },
    userName: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 4 },
    userEmail: { fontSize: 14, color: C.textMuted, fontWeight: '500' },

    // Secciones genéricas
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 15 },
    linkText: { color: C.orange, fontSize: 14, fontWeight: '600', marginBottom: 15 },

    // Tarjeta de Membresía
    membershipCard: { borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, padding: 20 },
    membershipTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    membershipName: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 4 },
    membershipId: { color: C.textMuted, fontSize: 12, letterSpacing: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.emeraldDim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.emerald },
    statusText: { color: C.emerald, fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 15 },
    membershipBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    membershipSub: { color: C.textMuted, fontSize: 13, fontWeight: '500' },
    membershipDays: { color: C.text, fontSize: 13, fontWeight: '700' },

    // Métricas Físicas
    metricsGrid: { flexDirection: 'row', gap: 12 },
    metricBox: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 16, padding: 15, alignItems: 'center' },
    metricValue: { color: C.text, fontSize: 22, fontWeight: '900', marginBottom: 2 },
    metricUnit: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
    metricLabel: { color: C.textMuted, fontSize: 11, fontWeight: '500', textAlign: 'center' },

    // Menú de Configuración
    menuContainer: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    menuItemDanger: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.redDim },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: 15, fontWeight: '600' }
});