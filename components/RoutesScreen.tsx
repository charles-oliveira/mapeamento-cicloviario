import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface RouteData {
  coordinates: Array<{ latitude: number; longitude: number }>;
  name: string;
  description: string;
  id: string;
}

const STORAGE_KEYS = {
  ROUTES: '@routes',
};

export const RoutesScreen: React.FC = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const savedRoutes = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);
      if (savedRoutes) {
        setRoutes(JSON.parse(savedRoutes));
      }
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    }
  };

  const deleteRoute = async (id: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta rota?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRoutes = routes.filter(route => route.id !== id);
              setRoutes(updatedRoutes);
              await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(updatedRoutes));
            } catch (error) {
              console.error('Erro ao excluir rota:', error);
            }
          },
        },
      ],
    );
  };

  const renderRouteItem = ({ item }: { item: RouteData }) => (
    <View style={styles.routeItem}>
      <View style={styles.routeInfo}>
        <Text style={styles.routeName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.routeDescription}>{item.description}</Text>
        )}
        <Text style={styles.routePoints}>
          {item.coordinates.length} pontos
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteRoute(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma rota salva</Text>
            <Text style={styles.emptySubtext}>
              Adicione rotas no mapa para vê-las aqui
            </Text>
          </View>
        ) : (
          <FlatList
            data={routes}
            renderItem={renderRouteItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  routeItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  routePoints: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
}); 