import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Settings } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>GYM<Text style={styles.accent}>TRACK</Text></Text>
            
            <View style={styles.rightSection}>
                <TouchableOpacity style={styles.iconButton}>
                    <Settings color={COLORS.textMuted} size={20} />
                </TouchableOpacity>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.nombre?.charAt(0) || 'U'}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60, // Margen para la barra de estado del celular
        paddingBottom: 15,
        backgroundColor: COLORS.background,
    },
    logo: { fontSize: 22, fontWeight: '900', color: COLORS.text, fontStyle: 'italic' },
    accent: { color: COLORS.primary },
    rightSection: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconButton: { padding: 5 },
    avatar: {
        width: 35, height: 35, borderRadius: 18, 
        backgroundColor: COLORS.surfaceLight, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border
    },
    avatarText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }
});