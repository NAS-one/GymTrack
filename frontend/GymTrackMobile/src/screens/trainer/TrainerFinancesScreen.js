import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrainerFinancesScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Mis Finanzas</Text>
                <Text style={styles.subtitle}>En construcción...</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#050505' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#71717A', fontSize: 16, marginTop: 8 }
});
