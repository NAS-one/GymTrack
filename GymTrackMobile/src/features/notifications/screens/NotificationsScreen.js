import React, { useRef, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, StatusBar
} from 'react-native';
import {
    Bell, CheckCheck, Trophy, AlertTriangle,
    CreditCard, Info, Trash2
} from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';

// ─── Paleta extendida Enterprise ───────────────────────────────────────────
const C = {
    ...COLORS,
    orange: '#F97316', orangeDim: 'rgba(249,115,22,0.15)',
    blue: '#3B82F6', blueDim: 'rgba(59,130,246,0.15)',
    emerald: '#10B981', emeraldDim: 'rgba(16,185,129,0.15)',
    red: '#EF4444', redDim: 'rgba(239,68,68,0.15)',
    card: '#111113', cardBorder: '#1F1F23', textMuted: '#A1A1AA'
};

// ─── Componente Físico Táctil ───────────────────────────────────────────────
const TouchableScale = ({ children, onPress, style }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const handlePressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
        </TouchableOpacity>
    );
};

// ─── Animación de entrada para la lista ─────────────────────────────────────
const useFadeSlide = (delay = 0) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return { opacity, transform: [{ translateY }] };
};

// ─── Datos Simulados (Mapeados de tu BD) ────────────────────────────────────
const INITIAL_NOTIFICATIONS = [
    { id: '1', titulo: '¡Nueva racha desbloqueada!', mensaje: 'Has entrenado 3 días seguidos. Sigue así, estás más cerca de tu meta.', tipo: 'success', leida: false, fecha: 'Hace 2 horas' },
    { id: '2', titulo: 'Tu plan vence pronto', mensaje: 'Tu Plan Black vence en 5 días. Renuévalo ahora para no perder tu acceso.', tipo: 'warning', leida: false, fecha: 'Hace 5 horas' },
    { id: '3', titulo: 'Problema con tu pago', mensaje: 'No pudimos procesar el cobro automático de tu mensualidad. Por favor, actualiza tu método de pago.', tipo: 'error', leida: true, fecha: 'Ayer' },
    { id: '4', titulo: 'Horario especial por feriado', mensaje: 'Este viernes el gimnasio operará en horario especial de 09:00 a 14:00 hrs.', tipo: 'info', leida: true, fecha: 'Hace 2 días' }
];

// ─── Helper para estilos por tipo ───────────────────────────────────────────
const getNotificationStyles = (tipo) => {
    switch (tipo) {
        case 'success': return { icon: Trophy, color: C.emerald, bg: C.emeraldDim };
        case 'warning': return { icon: AlertTriangle, color: C.orange, bg: C.orangeDim };
        case 'error': return { icon: CreditCard, color: C.red, bg: C.redDim };
        case 'info': default: return { icon: Info, color: C.blue, bg: C.blueDim };
    }
};

// ─── Tarjeta Individual de Notificación ─────────────────────────────────────
const NotificationCard = ({ item, index, onMarkAsRead }) => {
    const anim = useFadeSlide(index * 100); // Efecto cascada
    const { icon: Icon, color, bg } = getNotificationStyles(item.tipo);

    return (
        <Animated.View style={[anim]}>
            <TouchableScale
                onPress={() => onMarkAsRead(item.id)}
                style={[styles.card, !item.leida && styles.cardUnread]}
            >
                {/* Punto indicador de no leída */}
                {!item.leida && <View style={[styles.unreadDot, { backgroundColor: color }]} />}

                <View style={styles.cardContent}>
                    <View style={[styles.iconBox, { backgroundColor: bg }]}>
                        <Icon color={color} size={20} />
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.title, !item.leida && styles.titleUnread]}>{item.titulo}</Text>
                            <Text style={styles.timeText}>{item.fecha}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={2}>{item.mensaje}</Text>
                    </View>
                </View>
            </TouchableScale>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
//  PANTALLA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const headerAnim = useFadeSlide(0);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, leida: true })));
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, leida: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.leida).length;

    // Vista cuando no hay notificaciones
    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
                <Bell color={C.textMuted} size={40} />
            </View>
            <Text style={styles.emptyTitle}>Todo al día</Text>
            <Text style={styles.emptySub}>No tienes notificaciones nuevas por el momento.</Text>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <Animated.View style={[styles.header, headerAnim]}>
                <View>
                    <Text style={styles.headerTitle}>Notificaciones</Text>
                    <Text style={styles.headerSub}>
                        {unreadCount === 0 ? 'Estás al día' : `Tienes ${unreadCount} sin leer`}
                    </Text>
                </View>

                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                        <CheckCheck color={C.orange} size={18} />
                        <Text style={styles.markAllText}>Marcar leídas</Text>
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* ── LISTA DE NOTIFICACIONES ────────────────────────────── */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <NotificationCard item={item} index={index} onMarkAsRead={markAsRead} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ESTILOS
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
    headerTitle: { fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontSize: 14, color: C.textMuted, marginTop: 4, fontWeight: '500' },
    markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orangeDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
    markAllText: { color: C.orange, fontSize: 12, fontWeight: '700' },

    // Lista
    listContent: { padding: 20, paddingBottom: 120 },

    // Tarjeta
    card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 12, overflow: 'hidden' },
    cardUnread: { backgroundColor: '#16161A', borderColor: 'rgba(255,255,255,0.08)' },
    unreadDot: { position: 'absolute', top: 16, left: 16, width: 8, height: 8, borderRadius: 4, zIndex: 10 },
    cardContent: { flexDirection: 'row', gap: 14 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, justifyContent: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 15, fontWeight: '600', color: C.textMuted, flex: 1, marginRight: 10 },
    titleUnread: { color: C.text, fontWeight: '800' },
    timeText: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
    message: { fontSize: 13, color: C.textMuted, lineHeight: 18 },

    // Empty State
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.textMuted, textAlign: 'center', paddingHorizontal: 40 }
});