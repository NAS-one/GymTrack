import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // Aquí usamos tu endpoint existente para validar el perfil
                const response = await axios.get('/perfil');
                setUser(response.data.body);
            }
        } catch (error) {
            console.log("Token inválido o expirado");
            await AsyncStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    };

const login = async (identificador, password) => {
        try {
            const response = await axios.post('/auth/login', { identificador, password });
            const { token, user: userData } = response.data.body;
            
            await AsyncStorage.setItem('token', token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            // 🌟 BLINDAJE: Extraemos el error asegurándonos de que SIEMPRE sea un String
            const data = error.response?.data;
            let mensajeError = 'Error de conexión con el servidor';

            if (data) {
                // Si tu backend manda { error: true, body: "Mensaje" }
                if (typeof data.body === 'string') mensajeError = data.body;
                // Si manda { error: "Mensaje" }
                else if (typeof data.error === 'string') mensajeError = data.error;
            }

            return { success: false, error: mensajeError };
        }
    };  

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);