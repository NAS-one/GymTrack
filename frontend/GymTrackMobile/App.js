import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext.js';
import AppNavigator from './src/navigation/AppNavigator.js';
import { StatusBar } from 'expo-status-bar';

export default function App() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <AppNavigator />
        </AuthProvider>
    );
}