import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext.js';

export default function LoginScreen() {
    const [identificador, setIdentificador] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!identificador || !password) {
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }

        const result = await login(identificador, password);
        if (!result.success) {
            Alert.alert('Acceso Denegado', result.error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GYM<Text style={styles.orange}>TRACK</Text></Text>
            <Text style={styles.subtitle}>Portal de Clientes</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email o RUT"
                    placeholderTextColor="#A1A1AA"
                    value={identificador}
                    onChangeText={setIdentificador}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#A1A1AA"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Ingresar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 30 },
    title: { fontSize: 40, fontWeight: '900', color: '#FFF', textAlign: 'center', fontStyle: 'italic' },
    orange: { color: '#F97316' },
    subtitle: { color: '#A1A1AA', textAlign: 'center', marginBottom: 50, letterSpacing: 2 },
    form: { gap: 15 },
    input: { backgroundColor: '#18181B', color: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
    button: { backgroundColor: '#F97316', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});