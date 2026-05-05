import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, StatusBar, Dimensions, ActivityIndicator, RefreshControl
} from 'react-native';
import {
    Flame, Zap, TrendingUp, Calendar, Clock, Bell,
    ChevronRight, Play, Trophy, Target, Dumbbell,
    Activity, BarChart2, Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { COLORS } from '../../../theme/colors';

// ──────────────────DATOS DE MEMORIA ────────────────────────────
import { useTrainingStore } from '../../../store/useTrainingStore';
import { useHomeStore } from '../../../store/useHomeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Paleta extendida Enterprise ───────────────────────────────────────────
const C = {
    ...COLORS,
    orange: '#F97316',
    orangeDim: 'rgba(249,115,22,0.15)',
    orangeGlow: 'rgba(249,115,22,0.35)',
    blue: '#3B82F6',
    blueDim: 'rgba(59,130,246,0.15)',
    emerald: '#10B981',
    emeraldDim: 'rgba(16,185,129,0.15)',
    violet: '#8B5CF6',
    violetDim: 'rgba(139,92,246,0.15)',
    card: '#111113',
    cardBorder: '#1F1F23',
    gold: '#FBBF24',
};

// ─── Utilidades de animación ────────────────────────────────────────────────
const useFadeSlide = (delay = 0) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return { opacity, transform: [{ translateY }] };
};

const usePulse = () => {
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return scale;
};

// ─── Componente Físico Táctil (Micro-interacciones Premium) ────────────────
const TouchableScale = ({ children, onPress, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Saludo dinámico ────────────────────────────────────────────────────────
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

// ─── Datos Simulados ────────────────────────────────────────────────────────
const WEEK_BARS = [
    { day: 'L', value: 0.8, done: true },
    { day: 'M', value: 0.5, done: true },
    { day: 'X', value: 0.9, done: true },
    { day: 'J', value: 0.3, done: true },
    { day: 'V', value: 1.0, done: false },
    { day: 'S', value: 0.0, done: false },
    { day: 'D', value: 0.0, done: false },
];
const TODAY_INDEX = 4;

// ─── Sub-Componentes ────────────────────────────────────────────────────────
const WeekBar = ({ item, index, isToday }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, {
            toValue: item.value,
            duration: 700,
            delay: 300 + index * 80,
            useNativeDriver: false,
        }).start();
    }, []);

    const barColor = isToday ? C.orange : item.done ? C.emerald : C.cardBorder;
    const BAR_MAX = 52;

    return (
        <View style={styles.barColumn}>
            <Animated.View style={[styles.bar, {
                height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, BAR_MAX] }),
                backgroundColor: barColor,
                opacity: item.value === 0 ? 0.3 : 1,
            }]} />
            <Text style={[styles.barLabel, isToday && { color: C.orange, fontWeight: '700' }]}>{item.day}</Text>
        </View>
    );
};

// ──────────────────COMPONENTE METRICCARD────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color, colorDim, delay, onPress }) => {
    const anim = useFadeSlide(delay);
    return (
        <Animated.View style={[styles.metricCard, anim]}>
            <TouchableScale onPress={onPress}>
                <View style={[styles.metricIcon, { backgroundColor: colorDim }]}>
                    <Icon color={color} size={18} />
                </View>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricLabel}>{label}</Text>
                {sub && <Text style={styles.metricSub}>{sub}</Text>}
            </TouchableScale>
        </Animated.View>
    );
};


const QuickChip = ({ icon: Icon, label, color }) => (
    <TouchableScale style={[styles.chip, { borderColor: color + '40' }]}>
        <View style={[styles.chipIcon, { backgroundColor: color + '20' }]}>
            <Icon color={color} size={16} />
        </View>
        <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </TouchableScale>
);

const AchievementBadge = ({ icon: Icon, label, locked = false }) => (
    <View style={[styles.badge, locked && styles.badgeLocked]}>
        <Icon color={locked ? C.textMuted : C.gold} size={22} />
        <Text style={[styles.badgeText, locked && { color: C.textMuted }]}>{label}</Text>
    </View>
);

// ═══════════════════════════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
    const { user } = useAuth();

    // 1. STORES
    const { rutinaHoy, isLoading: isLoadingTraining, fetchTrainingData } = useTrainingStore();
    const { metrics, fetchHomeMetrics } = useHomeStore();

    const [refreshing, setRefreshing] = useState(false);

    // 2. ANIMACIONES
    const headerAnim = useFadeSlide(0);
    const heroAnim = useFadeSlide(100);
    const statsAnim = useFadeSlide(200);
    const weekAnim = useFadeSlide(300);
    const pulseScale = usePulse();

    // 3. EFECTOS Y CARGA DE DATOS
    useEffect(() => {
        if (user?.id) {
            fetchTrainingData(user.id);
            fetchHomeMetrics(user.id);
        }
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (user?.id) {
            // Promise.all permite que ambas peticiones se hagan a la vez (más rápido)
            await Promise.all([
                fetchTrainingData(user.id),
                fetchHomeMetrics(user.id)
            ]);
        }
        setRefreshing(false);
    }, [user]);

    // 4. PREPARACIÓN DE DATOS DINÁMICOS
    const firstName = user?.nombre?.split(' ')[0] || 'Atleta';

    // Valores por defecto seguros para las métricas (evita crasheos si la BD tarda)
    const racha = metrics?.asistencia?.racha || 0;
    const sesionesMes = metrics?.asistencia?.sesionesMes || 0;
    const volumenTotal = metrics?.volumen?.tonelajeSemanal || 0;
    const pesoActual = metrics?.evolucion?.pesoActual || '--';
    const grasaActual = metrics?.evolucion?.grasa || '--';
    const planNombre = metrics?.plan?.nombre || 'Sin plan asignado';
    const planSemanas = metrics?.plan?.duracion || 0;

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />}
            >
                {/* ── HEADER CON AVATAR ──────────────────────────────────────── */}
                <Animated.View style={[styles.header, headerAnim]}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.username}>{firstName}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity activeOpacity={0.8} style={styles.streakBadge}>
                            <Flame color={C.orange} size={16} />
                            {/* Conectado a BD: */}
                            <Text style={styles.streakText}>{racha} d</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Bell color={C.text} size={20} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* ── HERO CARD: Entrenamiento de hoy ────────────────────────── */}
                <Animated.View style={[styles.heroCardContainer, heroAnim]}>
                    <LinearGradient colors={[C.card, C.orangeDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
                        <Animated.View style={[styles.heroGlow, { transform: [{ scale: pulseScale }] }]} />

                        <View style={styles.heroTop}>
                            <View style={styles.heroLabel}>
                                <Zap color={C.orange} size={14} fill={C.orange} />
                                <Text style={styles.heroLabelText}>ENTRENAMIENTO DE HOY</Text>
                            </View>
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>ACTIVO</Text>
                            </View>
                        </View>

                        {isLoadingTraining ? (
                            <ActivityIndicator color={C.orange} style={{ marginVertical: 24 }} />
                        ) : (
                            <>
                                <Text style={styles.heroTitle} numberOfLines={2}>
                                    {rutinaHoy?.titulo || 'Día de descanso'}
                                </Text>
                                <View style={styles.heroMeta}>
                                    <View style={styles.heroMetaItem}>
                                        <Dumbbell color={C.textMuted} size={14} />
                                        <Text style={styles.heroMetaText}>{rutinaHoy?.ejercicios ?? '0'} ejercicios</Text>
                                    </View>
                                    <View style={styles.heroMetaDot} />
                                    <View style={styles.heroMetaItem}>
                                        <Activity color={C.textMuted} size={14} />
                                        <Text style={styles.heroMetaText}>{rutinaHoy?.series ?? '0'} series</Text>
                                    </View>
                                    <View style={styles.heroMetaDot} />
                                    <View style={styles.heroMetaItem}>
                                        <Clock color={C.textMuted} size={14} />
                                        <Text style={styles.heroMetaText}>{rutinaHoy?.tiempo || '0 min'}</Text>
                                    </View>
                                </View>

                                {/* Progreso visual (Placeholder futuro) */}
                                <View style={styles.progressRow}>
                                    <Text style={styles.progressLabel}>Progreso semanal</Text>
                                    <Text style={styles.progressPct}>60%</Text>
                                </View>
                                <View style={styles.progressTrack}>
                                    <Animated.View style={[styles.progressFill, { width: '60%' }]} />
                                </View>

                                {/* CTA principal */}
                                <TouchableScale style={styles.cta} onPress={() => console.log('Ir a rutina')}>
                                    <Play color="#FFF" size={18} fill="#FFF" />
                                    <Text style={styles.ctaText}>INICIAR SESIÓN</Text>
                                </TouchableScale>
                            </>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* ── MÉTRICAS 2×2 (CONECTADAS A BASE DE DATOS) ──────────────── */}
                <Animated.View style={[styles.metricsGrid, statsAnim]}>
                    <MetricCard
                        icon={Target}
                        label="Asistencia"
                        value={sesionesMes}
                        sub="sesiones este mes"
                        color={C.emerald} colorDim={C.emeraldDim} delay={220}
                        onPress={() => console.log('Abrir Historial de Accesos')}
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Carga Total"
                        value={`${volumenTotal}t`}
                        sub="volumen ult. 7 días"
                        color={C.blue} colorDim={C.blueDim} delay={280}
                        onPress={() => console.log('Abrir Analítica de Volumen')}
                    />
                    <MetricCard
                        icon={Flame}
                        label="Peso Actual"
                        value={`${pesoActual}kg`}
                        sub={`Grasa: ${grasaActual}%`}
                        color={C.orange} colorDim={C.orangeDim} delay={340}
                        onPress={() => console.log('Abrir Medidas Físicas')}
                    />
                    <MetricCard
                        icon={Trophy}
                        label="Plan Activo"
                        value={planNombre.length > 12 ? planNombre.substring(0, 10) + '...' : planNombre}
                        sub={`${planSemanas} semanas en total`}
                        color={C.violet} colorDim={C.violetDim} delay={400}
                        onPress={() => console.log('Abrir Detalles del Plan')}
                    />
                </Animated.View>

                {/* ── ACCIONES RÁPIDAS ───────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acceso rápido</Text>
                    <View style={styles.chipsRow}>
                        <QuickChip icon={Calendar} label="Mi plan" color={C.blue} />
                        <QuickChip icon={Dumbbell} label="Ejercicios" color={C.emerald} />
                        <QuickChip icon={BarChart2} label="Progreso" color={C.violet} />
                    </View>
                </View>

                {/* ── GRÁFICA SEMANAL ────────────────────────────────────── */}
                <Animated.View style={[styles.section, weekAnim]}>
                    <View style={styles.sectionRow}>
                        <View>
                            <Text style={styles.sectionTitle}>Actividad semanal</Text>
                            <Text style={styles.sectionSub}>3 de 5 días completados</Text>
                        </View>
                        <TouchableOpacity style={styles.sectionLink}>
                            <BarChart2 color={C.orange} size={16} />
                            <Text style={styles.sectionLinkText}>Ver historial</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.barsContainer}>
                        {WEEK_BARS.map((item, i) => (
                            <WeekBar key={i} item={item} index={i} isToday={i === TODAY_INDEX} />
                        ))}
                    </View>
                </Animated.View>

                <View style={{ height: 110 }} />
            </ScrollView>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ESTILOS
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

    // ── Header ──
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.cardBorder, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: C.text, fontSize: 18, fontWeight: 'bold' },
    greeting: { fontSize: 13, color: C.textMuted, fontWeight: '500', marginBottom: 2 },
    username: { fontSize: 22, color: C.text, fontWeight: '800', letterSpacing: -0.5 },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
    notificationDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange, borderWidth: 2, borderColor: C.card },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.orangeDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
    streakText: { color: C.orange, fontWeight: '700', fontSize: 13 },

    // ── Hero Card ──
    heroCardContainer: { marginBottom: 20, shadowColor: C.orange, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
    heroCard: { borderRadius: 24, borderWidth: 1, borderColor: C.cardBorder, padding: 22, overflow: 'hidden' },
    heroGlow: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: C.orangeGlow, opacity: 0.25 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    heroLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    heroLabelText: { fontSize: 11, color: C.orange, fontWeight: '800', letterSpacing: 1.2 },
    heroBadge: { backgroundColor: C.emeraldDim, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    heroBadgeText: { color: C.emerald, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.8, marginBottom: 10, lineHeight: 34 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    heroMetaText: { color: C.textMuted, fontSize: 13, fontWeight: '500' },
    heroMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.border },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressLabel: { color: C.textMuted, fontSize: 12, fontWeight: '600' },
    progressPct: { color: C.orange, fontSize: 12, fontWeight: '800' },
    progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: C.orange },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.orange, borderRadius: 16, paddingVertical: 16 },
    ctaText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },

    // ── Métricas ──
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    metricCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 16, width: (SCREEN_WIDTH - 50) / 2 },
    metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    metricValue: { fontSize: 22, fontWeight: '900', color: C.text, marginBottom: 2 },
    metricLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
    metricSub: { fontSize: 10, color: C.textMuted, marginTop: 2 },

    // ── Secciones Generales ──
    section: { marginBottom: 20 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
    sectionSub: { fontSize: 12, color: C.textMuted },
    sectionLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    sectionLinkText: { color: C.orange, fontSize: 12, fontWeight: '600' },

    // ── Barras semanales ──
    barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
    barColumn: { alignItems: 'center', gap: 6, flex: 1 },
    bar: { width: 8, borderRadius: 6, minHeight: 4 },
    barLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600' },

    // ── Chips ──
    chipsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    chip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10 },
    chipIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    chipLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

    // ── Next Card ──
    nextCard: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nextLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    nextIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center' },
    nextTitle: { fontSize: 14, fontWeight: '700', color: C.text },
    nextSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

    // ── Badges ──
    badge: { alignItems: 'center', gap: 6, backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, marginRight: 10 },
    badgeLocked: { backgroundColor: C.card, borderColor: C.cardBorder },
    badgeText: { fontSize: 11, color: C.gold, fontWeight: '700', textAlign: 'center' },
});