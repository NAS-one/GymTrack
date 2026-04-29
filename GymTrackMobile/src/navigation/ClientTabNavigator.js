import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Bell, QrCode, Dumbbell, User } from 'lucide-react-native';

// ─── Pantallas ──────────────────────────────────────────────────────────────
import HomeScreen from '../features/home/screens/HomeScreen';
import AccessQRScreen from '../features/attendance/AccessQRScreen.js';
import TrainingDashboardScreen from '../features/training/screens/TrainingDashboardScreen.js';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen.js';

const Tab = createBottomTabNavigator();

// ─── Identidad visual por tab ────────────────────────────────────────────────
const TABS = [
    { name: 'AccesoQR', label: 'QR', Icon: QrCode, accent: '#06B6D4', screen: AccessQRScreen },
    { name: 'Training', label: 'Training', Icon: Dumbbell, accent: '#F97316', screen: TrainingDashboardScreen },
    { name: 'Inicio', label: 'Home', Icon: Home, accent: '#60A5FA', screen: HomeScreen },
    { name: 'Notificaciones', label: 'Alerts', Icon: Bell, accent: '#FBBF24', screen: NotificationsScreen },
    { name: 'Profile', label: 'Perfil', Icon: User, accent: '#A78BFA', screen: ProfileScreen },
];

// ═══════════════════════════════════════════════════════════════════════════
//  Animaciones únicas por tab (todas con useNativeDriver: false)
// ═══════════════════════════════════════════════════════════════════════════
function runUniqueAnim(tabName, val) {
    const JS = { useNativeDriver: false };
    switch (tabName) {
        case 'AccesoQR':
            return Animated.sequence([
                Animated.timing(val, { toValue: 1, duration: 60, ...JS }),
                Animated.timing(val, { toValue: -1, duration: 60, ...JS }),
                Animated.timing(val, { toValue: 0.7, duration: 55, ...JS }),
                Animated.timing(val, { toValue: -0.7, duration: 55, ...JS }),
                Animated.timing(val, { toValue: 0, duration: 50, ...JS }),
            ]).start();

        case 'Training':
            return Animated.sequence([
                Animated.timing(val, { toValue: 1, duration: 90, ...JS }),
                Animated.spring(val, { toValue: 0, friction: 2, tension: 200, ...JS }),
            ]).start();

        case 'Inicio':
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration: 800, ...JS }),
                    Animated.timing(val, { toValue: 0, duration: 800, ...JS }),
                ]),
                { iterations: 5 }
            ).start();

        case 'Notificaciones':
            return Animated.sequence([
                Animated.timing(val, { toValue: 1, duration: 55, ...JS }),
                Animated.timing(val, { toValue: -1, duration: 55, ...JS }),
                Animated.timing(val, { toValue: 0.7, duration: 50, ...JS }),
                Animated.timing(val, { toValue: -0.7, duration: 50, ...JS }),
                Animated.timing(val, { toValue: 0.4, duration: 45, ...JS }),
                Animated.timing(val, { toValue: 0, duration: 45, ...JS }),
            ]).start();

        case 'Profile':
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration: 650, ...JS }),
                    Animated.timing(val, { toValue: 0, duration: 650, ...JS }),
                ]),
                { iterations: 3 }
            ).start();
    }
}

function getUniqueTransform(tabName, val) {
    switch (tabName) {
        case 'AccesoQR':
        case 'Notificaciones':
            return [{ rotate: val.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-22deg', '0deg', '22deg'] }) }];
        case 'Training':
            return [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }];
        case 'Inicio':
            return [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }];
        case 'Profile':
            return [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }];
        default:
            return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENTE DE TAB — driver JS únicamente para evitar conflictos
// ═══════════════════════════════════════════════════════════════════════════
function TabItem({ tabConfig, focused, onPress }) {
    const { Icon, accent, label } = tabConfig;
    const JS = { useNativeDriver: false }; // ← driver unificado, sin conflictos

    const iconScale = useRef(new Animated.Value(1)).current;
    const capsuleW = useRef(new Animated.Value(44)).current;
    const capsuleOp = useRef(new Animated.Value(0)).current;
    const labelOp = useRef(new Animated.Value(0)).current;
    const labelSlide = useRef(new Animated.Value(8)).current;
    const dotOp = useRef(new Animated.Value(0)).current;
    const glowOp = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.3)).current;
    const ringOp = useRef(new Animated.Value(0)).current;
    const uniq = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (focused) {
            // Onda expansiva de impacto
            ringOp.setValue(1);
            ringScale.setValue(0.3);
            Animated.parallel([
                Animated.timing(ringScale, { toValue: 2.2, duration: 450, ...JS }),
                Animated.timing(ringOp, { toValue: 0, duration: 450, ...JS }),
            ]).start();

            // Pop del ícono
            Animated.sequence([
                Animated.spring(iconScale, { toValue: 1.55, friction: 3, tension: 150, ...JS }),
                Animated.spring(iconScale, { toValue: 1.18, friction: 6, tension: 80, ...JS }),
            ]).start();

            // Glow, cápsula, label, dot
            Animated.parallel([
                Animated.timing(glowOp, { toValue: 1, duration: 280, ...JS }),
                Animated.spring(capsuleW, { toValue: 72, friction: 5, tension: 80, ...JS }),
                Animated.timing(capsuleOp, { toValue: 1, duration: 220, ...JS }),
                Animated.timing(labelOp, { toValue: 1, duration: 250, delay: 80, ...JS }),
                Animated.spring(labelSlide, { toValue: 0, friction: 6, tension: 80, ...JS }),
                Animated.spring(dotOp, { toValue: 1, friction: 5, tension: 120, ...JS }),
            ]).start();

            // Animación única del tab
            runUniqueAnim(tabConfig.name, uniq);

        } else {
            Animated.parallel([
                Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 80, ...JS }),
                Animated.spring(capsuleW, { toValue: 44, friction: 5, tension: 80, ...JS }),
                Animated.timing(capsuleOp, { toValue: 0, duration: 200, ...JS }),
                Animated.timing(labelOp, { toValue: 0, duration: 160, ...JS }),
                Animated.timing(labelSlide, { toValue: 8, duration: 160, ...JS }),
                Animated.timing(dotOp, { toValue: 0, duration: 180, ...JS }),
                Animated.timing(glowOp, { toValue: 0, duration: 220, ...JS }),
                Animated.timing(uniq, { toValue: 0, duration: 180, ...JS }),
            ]).start();
        }
    }, [focused]);

    const onPressIn = () =>
        Animated.spring(iconScale, { toValue: 0.65, friction: 4, tension: 180, ...JS }).start();

    const onPressOut = () => {
        if (!focused)
            Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 80, ...JS }).start();
    };

    const uniqueTransform = getUniqueTransform(tabConfig.name, uniq);

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            style={S.touch}
        >
            {/* Glow difuso */}
            <Animated.View style={[S.glow, { backgroundColor: accent, opacity: glowOp }]} />

            {/* Onda expansiva */}
            <Animated.View style={[S.ring, { borderColor: accent + 'BB', transform: [{ scale: ringScale }], opacity: ringOp }]} />

            {/* Cápsula activa */}
            <Animated.View style={[S.capsule, { width: capsuleW, opacity: capsuleOp, backgroundColor: accent + '28' }]} />

            {/* Ícono */}
            <Animated.View style={{ transform: [{ scale: iconScale }, ...uniqueTransform] }}>
                <Icon
                    color={focused ? accent : '#2C2C38'}
                    size={25}
                    strokeWidth={focused ? 2.4 : 1.6}
                />
            </Animated.View>

            {/* Label deslizante */}
            <Animated.Text style={[S.label, { color: accent, opacity: labelOp, transform: [{ translateY: labelSlide }] }]}>
                {label}
            </Animated.Text>

            {/* Punto indicador */}
            <Animated.View style={[S.dot, { backgroundColor: accent, opacity: dotOp, shadowColor: accent }]} />
        </TouchableOpacity>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  NAVEGADOR PRINCIPAL DE CLIENTE
// ═══════════════════════════════════════════════════════════════════════════
export default function ClientTabNavigator() {
    return (
        <View style={{ flex: 1, backgroundColor: '#07070A' }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: S.tabBar,
                    tabBarHideOnKeyboard: true,
                }}
            >
                {TABS.map((tab) => (
                    <Tab.Screen
                        key={tab.name}
                        name={tab.name}
                        component={tab.screen}
                        options={{
                            tabBarButton: ({ onPress, accessibilityState }) => (
                                <TabItem
                                    tabConfig={tab}
                                    focused={accessibilityState?.selected ?? false}
                                    onPress={onPress}
                                />
                            ),
                        }}
                    />
                ))}
            </Tab.Navigator>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ESTILOS
// ═══════════════════════════════════════════════════════════════════════════
const S = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 20,
        left: 12,
        right: 12,
        height: 72,
        borderRadius: 30,
        borderTopWidth: 0,
        backgroundColor: '#0C0C11',
        borderWidth: 1,
        borderColor: '#1C1C26',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 25,
    },
    touch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
    },
    glow: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        transform: [{ scale: 1.5 }],
    },
    ring: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
    },
    capsule: {
        position: 'absolute',
        height: 44,
        borderRadius: 16,
    },
    label: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    dot: {
        position: 'absolute',
        bottom: 3,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 5,
    },
});
