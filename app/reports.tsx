import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  TextInput,
  Modal,
  Share,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

interface MarkerData {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  problemType: string;
  description: string;
  date: string;
  id: string;
}

interface RouteData {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  name: string;
  description?: string;
  date: string;
}

const STORAGE_KEYS = {
  MARKERS: '@markers',
  ROUTES: '@routes',
};

export default function ReportsScreen() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [activeTab, setActiveTab] = useState<'problems' | 'routes'>('problems');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarkerData | RouteData | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedMarkers = await AsyncStorage.getItem(STORAGE_KEYS.MARKERS);
      const savedRoutes = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);

      if (savedMarkers) {
        const parsedMarkers = JSON.parse(savedMarkers);
        setMarkers(parsedMarkers);
      }
      if (savedRoutes) {
        const parsedRoutes = JSON.parse(savedRoutes);
        const validRoutes = parsedRoutes.map((route: any) => ({
          ...route,
          date: route.date || new Date().toISOString(),
          description: route.description || ''
        }));
        setRoutes(validRoutes);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const deleteMarker = async (id: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este problema?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const updatedMarkers = markers.filter(marker => marker.id !== id);
            setMarkers(updatedMarkers);
            await AsyncStorage.setItem(STORAGE_KEYS.MARKERS, JSON.stringify(updatedMarkers));
          },
        },
      ],
    );
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
            const updatedRoutes = routes.filter(route => route.id !== id);
            setRoutes(updatedRoutes);
            await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(updatedRoutes));
          },
        },
      ],
    );
  };

  const getProblemTypeText = (type: string) => {
    switch (type) {
      case 'buraco':
        return 'Buraco';
      case 'acidente':
        return 'Acidente';
      case 'alagamento':
        return 'Alagamento';
      default:
        return 'Outro';
    }
  };

  const getProblemIcon = (type: string) => {
    switch (type) {
      case 'buraco':
        return 'alert-circle-outline';
      case 'acidente':
        return 'warning-outline';
      case 'alagamento':
        return 'water-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getProblemColor = (type: string) => {
    switch (type) {
      case 'buraco':
        return '#FF9800';
      case 'acidente':
        return '#F44336';
      case 'alagamento':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleMapPress = (item: MarkerData | RouteData) => {
    setSelectedItem(item);
    setMapModalVisible(true);
  };

  const handleShare = async (item: MarkerData | RouteData) => {
    try {
      let message = '';
      if ('problemType' in item) {
        message = `Problema: ${getProblemTypeText(item.problemType)}\n` +
                 `Descrição: ${item.description}\n` +
                 `Localização: ${item.coordinate.latitude}, ${item.coordinate.longitude}\n` +
                 `Data: ${new Date(item.date).toLocaleDateString('pt-BR')}`;
      } else {
        message = `Rota: ${item.name}\n` +
                 `Descrição: ${item.description || 'Sem descrição'}\n` +
                 `Distância: ${Math.round(calculateDistance(item.coordinates))}m\n` +
                 `Pontos: ${item.coordinates.length}`;
      }

      await Share.share({
        message,
        title: 'Compartilhar ' + ('problemType' in item ? 'Problema' : 'Rota'),
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o item');
    }
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getFilteredAndSortedData = () => {
    if (activeTab === 'problems') {
      let data = [...markers];
      
      if (searchText) {
        data = data.filter(item => 
          item.description.toLowerCase().includes(searchText.toLowerCase()) ||
          getProblemTypeText(item.problemType).toLowerCase().includes(searchText.toLowerCase())
        );
      }

      if (selectedTypes.length > 0) {
        data = data.filter(item => selectedTypes.includes(item.problemType));
      }

      data.sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'type') {
          return sortOrder === 'asc'
            ? getProblemTypeText(a.problemType).localeCompare(getProblemTypeText(b.problemType))
            : getProblemTypeText(b.problemType).localeCompare(getProblemTypeText(a.problemType));
        }
        return 0;
      });

      return data;
    } else {
      let data = [...routes];
      
      if (searchText) {
        data = data.filter(item => 
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (item.description?.toLowerCase() || '').includes(searchText.toLowerCase())
        );
      }

      data.sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        return 0;
      });

      return data;
    }
  };

  const calculateDistance = (coordinates: Array<{ latitude: number; longitude: number }>) => {
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const lat1 = coordinates[i].latitude;
      const lon1 = coordinates[i].longitude;
      const lat2 = coordinates[i + 1].latitude;
      const lon2 = coordinates[i + 1].longitude;
      
      const R = 6371e3;
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      totalDistance += R * c;
    }
    return totalDistance;
  };

  const renderProblemItem = ({ item }: { item: MarkerData }) => (
    <View style={[styles.itemContainer, { borderLeftColor: getProblemColor(item.problemType) }]}>
      <View style={styles.itemHeader}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name={getProblemIcon(item.problemType)} 
            size={24} 
            color={getProblemColor(item.problemType)} 
            style={styles.icon}
          />
          <Text style={styles.itemTitle}>{getProblemTypeText(item.problemType)}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMapPress(item)}
          >
            <Ionicons name="map-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => deleteMarker(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
        </Text>
        <Text style={styles.coordinates}>
          {item.coordinate.latitude.toFixed(4)}, {item.coordinate.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );

  const renderRouteItem = ({ item }: { item: RouteData }) => (
    <View style={[styles.itemContainer, { borderLeftColor: '#4CAF50' }]}>
      <View style={styles.itemHeader}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name="map-outline" 
            size={24} 
            color="#4CAF50" 
            style={styles.icon}
          />
          <Text style={styles.itemTitle}>{item.name}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMapPress(item)}
          >
            <Ionicons name="map-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => deleteRoute(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.itemDescription}>
        {item.description || 'Sem descrição'}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.itemDate}>
          {item.coordinates.length} pontos
        </Text>
        <Text style={styles.distance}>
          {Math.round(calculateDistance(item.coordinates))}m
        </Text>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtros e Ordenação</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Ordenar por</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                onPress={() => setSortBy('date')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'date' && styles.activeSortButtonText]}>
                  Data
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'type' && styles.activeSortButton]}
                onPress={() => setSortBy('type')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'type' && styles.activeSortButtonText]}>
                  Tipo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
                onPress={() => setSortBy('name')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'name' && styles.activeSortButtonText]}>
                  Nome
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Ordem</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortOrder === 'asc' && styles.activeSortButton]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={[styles.sortButtonText, sortOrder === 'asc' && styles.activeSortButtonText]}>
                  Crescente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortOrder === 'desc' && styles.activeSortButton]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={[styles.sortButtonText, sortOrder === 'desc' && styles.activeSortButtonText]}>
                  Decrescente
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeTab === 'problems' && (
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Tipos de Problema</Text>
              <View style={styles.typeFilters}>
                {['buraco', 'acidente', 'alagamento'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeFilterButton,
                      selectedTypes.includes(type) && styles.activeTypeFilterButton,
                      { borderColor: getProblemColor(type) }
                    ]}
                    onPress={() => toggleTypeFilter(type)}
                  >
                    <Text style={[
                      styles.typeFilterText,
                      selectedTypes.includes(type) && styles.activeTypeFilterText,
                      { color: selectedTypes.includes(type) ? 'white' : getProblemColor(type) }
                    ]}>
                      {getProblemTypeText(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFilterModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderMapModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={mapModalVisible}
      onRequestClose={() => setMapModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.mapModalContent}>
          {selectedItem && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 'coordinate' in selectedItem ? selectedItem.coordinate.latitude : selectedItem.coordinates[0].latitude,
                longitude: 'coordinate' in selectedItem ? selectedItem.coordinate.longitude : selectedItem.coordinates[0].longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {'coordinate' in selectedItem ? (
                <Marker
                  coordinate={selectedItem.coordinate}
                  title={getProblemTypeText(selectedItem.problemType)}
                  description={selectedItem.description}
                  pinColor={getProblemColor(selectedItem.problemType)}
                />
              ) : (
                <Polyline
                  coordinates={selectedItem.coordinates}
                  strokeColor="#4CAF50"
                  strokeWidth={3}
                />
              )}
            </MapView>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setMapModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
        >
          <Ionicons name="options-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'problems' && styles.activeTab]}
          onPress={() => setActiveTab('problems')}
        >
          <Ionicons 
            name="alert-circle-outline" 
            size={24} 
            color={activeTab === 'problems' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'problems' && styles.activeTabText]}>
            Problemas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routes' && styles.activeTab]}
          onPress={() => setActiveTab('routes')}
        >
          <Ionicons 
            name="map-outline" 
            size={24} 
            color={activeTab === 'routes' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
            Rotas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'problems' ? (
        <FlatList
          data={getFilteredAndSortedData() as MarkerData[]}
          renderItem={renderProblemItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="alert-circle-outline"
                size={48} 
                color="#9E9E9E" 
              />
              <Text style={styles.emptyText}>
                {searchText 
                  ? 'Nenhum resultado encontrado'
                  : 'Nenhum problema reportado'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={getFilteredAndSortedData() as RouteData[]}
          renderItem={renderRouteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="map-outline"
                size={48} 
                color="#9E9E9E" 
              />
              <Text style={styles.emptyText}>
                {searchText 
                  ? 'Nenhum resultado encontrado'
                  : 'Nenhuma rota salva'}
              </Text>
            </View>
          }
        />
      )}

      {renderFilterModal()}
      {renderMapModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  filterButton: {
    padding: 10,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
    flexGrow: 1,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderLeftWidth: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    marginLeft: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 32,
  },
  itemDate: {
    fontSize: 14,
    color: '#999',
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  distance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  mapModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  activeSortButton: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    color: '#666',
  },
  activeSortButtonText: {
    color: 'white',
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeFilterButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  activeTypeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  typeFilterText: {
    fontSize: 14,
  },
  activeTypeFilterText: {
    color: 'white',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 10,
    textAlign: 'center',
  },
}); 