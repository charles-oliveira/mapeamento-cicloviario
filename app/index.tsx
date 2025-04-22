import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="bicycle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Mapeamento Cicloviário</Text>
          <Text style={styles.subtitle}>Sua cidade mais ciclável</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.featureCard}>
            <Ionicons name="map-outline" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Mapa Interativo</Text>
            <Text style={styles.featureDescription}>
              Visualize e adicione marcadores de problemas nas ciclovias da cidade
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="create-outline" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Rotas Personalizadas</Text>
            <Text style={styles.featureDescription}>
              Crie e compartilhe suas rotas preferidas de bicicleta
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Reporte Problemas</Text>
            <Text style={styles.featureDescription}>
              Ajude a melhorar a infraestrutura cicloviária reportando problemas
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/map')}
        >
          <Text style={styles.startButtonText}>Começar</Text>
          <Ionicons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f9f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  content: {
    gap: 20,
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
}); 