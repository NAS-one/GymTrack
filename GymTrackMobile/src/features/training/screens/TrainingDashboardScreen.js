import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Play, Plus, MoreHorizontal, Clock, Dumbbell } from 'lucide-react-native';
import { COLORS } from '../../../theme/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingStore } from '../../../store/useTrainingStore';

export default function TrainingDashboardScreen() {
    const { user } = useAuth();
    const { rutinaHoy, misPlanes, rutinasBiblioteca, isLoading, fetchTrainingData } = useTrainingStore();
    
    const scaleValue = useRef(new Animated.Value(1)).current;

    // Cuando la pantalla carga, le pedimos a Zustand que busque las rutinas de este cliente
    useEffect(() => {
        if (user?.id) {
            fetchTrainingData(user.id);
        }
    }, [user]);

    const handleStartWorkout = () => {
        Animated.sequence([
            Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
        ]).start();
        // Próximo paso: Navegar a la pantalla de sesión activa
    };

    // Pantalla de carga mientras trae datos de PostgreSQL
    if (isLoading || !rutinaHoy) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textMuted, marginTop: 15 }}>Cargando tus rutinas...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
            
            {/* SECCIÓN 1: RUTINA DE HOY */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tu entrenamiento</Text>
            </View>
            
            <View style={styles.heroCard}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>{rutinaHoy.titulo}</Text>
                    <Text style={styles.heroSubtitle}>{rutinaHoy.ejercicios} ejercicios • {rutinaHoy.series} series</Text>
                    
                    <View style={styles.heroFooter}>
                        <Clock color={COLORS.text} size={16} />
                        <Text style={styles.heroTime}>{rutinaHoy.tiempo}</Text>
                    </View>
                </View>
                
                <TouchableOpacity onPress={handleStartWorkout} activeOpacity={1}>
                    <Animated.View style={[styles.primaryButton, { transform: [{ scale: scaleValue }] }]}>
                        <Play color="#FFF" size={16} fill="#FFF" />
                        <Text style={styles.primaryButtonText}>INICIAR SESIÓN</Text>
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* SECCIÓN 2: MIS PLANES */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tus Planes</Text>
                <TouchableOpacity><Plus color={COLORS.textMuted} size={24} /></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {misPlanes.map((plan) => (
                    <View key={plan.id} style={[styles.planCard, plan.activo && styles.planCardActive]}>
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>{plan.nombre}</Text>
                            <TouchableOpacity><MoreHorizontal color={COLORS.textMuted} size={20} /></TouchableOpacity>
                        </View>
                        <Text style={styles.planSubtitle}>{plan.equipo} • {plan.dias} días</Text>
                        
                        <View style={styles.daysContainer}>
                            {plan.semana.map((dia, index) => {
                                const isActive = plan.diasActivos.includes(dia);
                                return (
                                    <View key={index} style={[styles.dayBadge, isActive ? styles.dayActive : styles.dayInactive]}>
                                        <Text style={[styles.dayText, isActive ? styles.dayTextActive : styles.dayTextInactive]}>{dia}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        {plan.activo && <Text style={styles.activePlanLabel}>Plan Activo</Text>}
                    </View>
                ))}
            </ScrollView>

            {/* SECCIÓN 3: BIBLIOTECA */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rutinas</Text>
                <TouchableOpacity><Plus color={COLORS.textMuted} size={24} /></TouchableOpacity>
            </View>

            <View style={styles.routinesContainer}>
                {rutinasBiblioteca.map((rutina) => (
                    <View key={rutina.id} style={styles.routineCard}>
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>{rutina.nombre}</Text>
                            <TouchableOpacity><MoreHorizontal color={COLORS.textMuted} size={20} /></TouchableOpacity>
                        </View>
                        
                        <View style={styles.exercisesPreview}>
                            <View style={styles.exerciseItem}>
                                <View style={styles.iconBox}><Dumbbell color={COLORS.textMuted} size={16} /></View>
                                <Text style={styles.exerciseName}>{rutina.ej1}</Text>
                            </View>
                            <View style={styles.exerciseItem}>
                                <View style={styles.iconBox}><Dumbbell color={COLORS.textMuted} size={16} /></View>
                                <Text style={styles.exerciseName}>{rutina.ej2}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    contentScroll: { padding: 20, paddingBottom: 120, paddingTop: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    heroCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    heroContent: { marginBottom: 20 },
    heroTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 5 },
    heroSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 15 },
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    heroTime: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
    primaryButton: { backgroundColor: '#1E3A8A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16, gap: 10 },
    primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    horizontalScroll: { overflow: 'visible' },
    planCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 20, padding: 20, width: 280, marginRight: 15, borderWidth: 1, borderColor: COLORS.border },
    planCardActive: { borderColor: '#4B5563' },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    planTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5 },
    planSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
    daysContainer: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    dayBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    dayActive: { backgroundColor: COLORS.text },
    dayInactive: { backgroundColor: COLORS.border },
    dayText: { fontSize: 12, fontWeight: 'bold' },
    dayTextActive: { color: COLORS.background },
    dayTextInactive: { color: COLORS.textMuted },
    activePlanLabel: { color: COLORS.textMuted, fontSize: 12, textAlign: 'right', marginTop: 10 },
    routinesContainer: { gap: 15 },
    routineCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    exercisesPreview: { flexDirection: 'row', gap: 20, marginVertical: 20 },
    exerciseItem: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
    exerciseName: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', flexShrink: 1 }
});