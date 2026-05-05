import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../contexts/AuthContext.js';
import { COLORS } from '../../theme/colors.js'; // Usamos nuestra paleta global

export default function AccessQRScreen() {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            {/* Contenedor centralizado para el QR */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Pase de Acceso</Text>
                <Text style={styles.cardSub}>Acércalo al lector de la recepción</Text>
                
                <View style={styles.qrContainer}>
                    <QRCode 
                        value={user?.id?.toString() || 'Sin ID'} 
                        size={220} 
                        backgroundColor="#FFFFFF"
                        color="#000000"
                    />
                </View>
                
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Estado: </Text>
                    <Text style={styles.statusActive}>Activo</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.background, // Usa el negro global
        justifyContent: 'center', // Centra la tarjeta verticalmente
        alignItems: 'center',
        paddingHorizontal: 20,
        // Agregamos un padding inferior para que la barra de navegación flotante no tape la tarjeta
        paddingBottom: 100, 
    },
    card: { 
        backgroundColor: COLORS.surface, 
        borderRadius: 35, 
        padding: 35, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: COLORS.border,
        width: '100%',
        // Sombra sutil para darle profundidad "Premium"
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    cardTitle: { 
        color: COLORS.text, 
        fontSize: 24, 
        fontWeight: '900',
        letterSpacing: 0.5
    },
    cardSub: { 
        color: COLORS.textMuted, 
        fontSize: 14, 
        marginBottom: 35, 
        marginTop: 8 
    },
    qrContainer: { 
        padding: 15, 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        marginBottom: 35 
    },
    statusBadge: {
        flexDirection: 'row',
        backgroundColor: COLORS.surfaceLight,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    statusText: { 
        color: COLORS.textMuted, 
        fontSize: 15,
        fontWeight: '600'
    },
    statusActive: { 
        color: '#10B981', // Verde esmeralda moderno
        fontWeight: '900',
        fontSize: 15,
        textTransform: 'uppercase',
        letterSpacing: 1
    }
});