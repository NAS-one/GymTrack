import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexts/AuthContext.js';
import { LogOut } from 'lucide-react-native'; // Usamos los mismos iconos que en web

export default function DashboardScreen() {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.name}>{user?.nombre || 'Cliente'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <LogOut color="#EF4444" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Tu Pase de Acceso</Text>
                <Text style={styles.cardSub}>Acércalo al lector de la recepción</Text>
                
                <View style={styles.qrContainer}>
                    {/* El QR codifica el ID o RUT del usuario para que el scanner lo lea */}
                    <QRCode 
                        value={user?.id?.toString() || 'Sin ID'} 
                        size={220} 
                        backgroundColor="#FFF"
                        color="#000"
                    />
                </View>
                
                <Text style={styles.statusText}>Estado: <Text style={styles.statusActive}>Activo</Text></Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 25, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
    greeting: { color: '#A1A1AA', fontSize: 16 },
    name: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
    logoutBtn: { padding: 10, backgroundColor: '#EF444420', borderRadius: 12 },
    card: { backgroundColor: '#18181B', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
    cardTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    cardSub: { color: '#A1A1AA', fontSize: 14, marginBottom: 30, marginTop: 5 },
    qrContainer: { padding: 15, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 30 },
    statusText: { color: '#FFF', fontSize: 16 },
    statusActive: { color: '#22C55E', fontWeight: 'bold' }
});