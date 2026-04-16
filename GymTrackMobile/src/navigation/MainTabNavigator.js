import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Users, Bell, QrCode, Dumbbell, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Importamos el TopBar
import TopBar from '../components/TopBar.js';

// Importamos la pantalla de Dashboard que ya tenías
import AccessQRScreen from '../features/attendance/AccessQRScreen.js';
import TrainingScreen from '../features/training/screens/TrainingDashboardScreen.js'; 

// Pantallas "Mock" temporales para las demás secciones
const DummyScreen = () => <View style={{ flex: 1, backgroundColor: COLORS.background }} />;

const Tab = createBottomTabNavigator();

// COMPONENTE BOTÓN CENTRAL ANIMADO
const CustomTabBarButton = ({ children, onPress }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const animateButton = () => {
        Animated.sequence([
            Animated.timing(scaleValue, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
        ]).start();
        onPress();
    };

    return (
        <TouchableOpacity style={styles.customButtonWrapper} onPress={animateButton} activeOpacity={1}>
            <Animated.View style={[styles.customButton, { transform: [{ scale: scaleValue }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function MainTabNavigator() {
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* El Top Bar siempre visible */}
            <TopBar />
            
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: styles.tabBar,
                }}
            >
                <Tab.Screen 
                    name="Coaches" 
                    component={DummyScreen} 
                    options={{ tabBarIcon: ({ focused }) => <Users color={focused ? COLORS.primary : COLORS.textMuted} size={24} /> }} 
                />
                <Tab.Screen 
                    name="Notificaciones" 
                    component={DummyScreen} 
                    options={{ tabBarIcon: ({ focused }) => <Bell color={focused ? COLORS.primary : COLORS.textMuted} size={24} /> }} 
                />
                
                {/* 🌟 BOTÓN CENTRAL QR */}
                <Tab.Screen 
                    name="AccesoQR" 
                    component={AccessQRScreen} // Vinculamos tu Dashboard aquí
                    options={{
                        tabBarIcon: ({ focused }) => <QrCode color="#FFF" size={32} />,
                        tabBarButton: (props) => <CustomTabBarButton {...props} />
                    }} 
                />
                
                <Tab.Screen 
                    name="Training" 
                    component={TrainingScreen} 
                    options={{ tabBarIcon: ({ focused }) => <Dumbbell color={focused ? COLORS.primary : COLORS.textMuted} size={24} /> }} 
                />
                <Tab.Screen 
                    name="Profile" 
                    component={DummyScreen} 
                    options={{ tabBarIcon: ({ focused }) => <User color={focused ? COLORS.primary : COLORS.textMuted} size={24} /> }} 
                />
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        elevation: 0,
        backgroundColor: 'rgba(24, 24, 27, 0.95)', // Gris oscuro casi negro, ligeramente transparente
        borderRadius: 25,
        height: 70,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    customButtonWrapper: {
        top: -25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    }
});