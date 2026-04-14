import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext.js';
import { View, ActivityIndicator } from 'react-native';

// Pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/main/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#F97316" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Usuario Autenticado
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                ) : (
                    // Usuario No Autenticado
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}