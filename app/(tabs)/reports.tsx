import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { STORAGE_KEYS } from '../../components/MapScreen';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../../contexts/ThemeContext';

interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  problemType: string;
  description: string;
  date: string;
}

export default function ReportsScreen() {
  const { colors, isDarkMode } = useTheme();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    try {
      const savedMarkers = await AsyncStorage.getItem(STORAGE_KEYS.MARKERS);
      if (savedMarkers) {
        setMarkers(JSON.parse(savedMarkers));
      }
    } catch (error) {
      console.error('Erro ao carregar marcadores:', error);
    }
  };

  const filteredMarkers = markers.filter(marker => {
    const matchesFilter = selectedFilter === 'all' || marker.problemType === selectedFilter;
    const matchesSearch = marker.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const getProblemTitle = (type: string) => {
    switch (type) {
      case 'buraco':
        return 'Buraco na Pista';
      case 'acidente':
        return 'Acidente';
      case 'alagamento':
        return 'Alagamento';
      default:
        return 'Outro Problema';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const handleMarkerPress = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: MarkerData }) => (
    <TouchableOpacity 
      style={[styles.reportItem, { backgroundColor: colors.surface }]}
      onPress={() => handleMarkerPress(item)}
    >
      <View style={styles.reportHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getProblemColor(item.problemType) + '20' }]}>
          <Ionicons 
            name={getProblemIcon(item.problemType)} 
            size={24} 
            color={getProblemColor(item.problemType)} 
          />
        </View>
        <View style={styles.reportInfo}>
          <Text style={[styles.reportType, { color: colors.text }]}>{getProblemTitle(item.problemType)}</Text>
          <Text style={[styles.reportDate, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </View>
      <Text style={[styles.reportDescription, { color: colors.text }]} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar relatórios..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton, 
                { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
                selectedFilter === 'all' && styles.selectedFilter
              ]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[
                styles.filterText, 
                { color: isDarkMode ? colors.text : '#666' },
                selectedFilter === 'all' && styles.selectedFilterText
              ]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
                selectedFilter === 'buraco' && styles.selectedFilter
              ]}
              onPress={() => setSelectedFilter('buraco')}
            >
              <Text style={[
                styles.filterText,
                { color: isDarkMode ? colors.text : '#666' },
                selectedFilter === 'buraco' && styles.selectedFilterText
              ]}>
                Buracos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
                selectedFilter === 'acidente' && styles.selectedFilter
              ]}
              onPress={() => setSelectedFilter('acidente')}
            >
              <Text style={[
                styles.filterText,
                { color: isDarkMode ? colors.text : '#666' },
                selectedFilter === 'acidente' && styles.selectedFilterText
              ]}>
                Acidentes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' },
                selectedFilter === 'alagamento' && styles.selectedFilter
              ]}
              onPress={() => setSelectedFilter('alagamento')}
            >
              <Text style={[
                styles.filterText,
                { color: isDarkMode ? colors.text : '#666' },
                selectedFilter === 'alagamento' && styles.selectedFilterText
              ]}>
                Alagamentos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <FlatList
          data={filteredMarkers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum relatório encontrado</Text>
            </View>
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedMarker && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconContainer, { backgroundColor: getProblemColor(selectedMarker.problemType) + '20' }]}>
                      <Ionicons 
                        name={getProblemIcon(selectedMarker.problemType)} 
                        size={32} 
                        color={getProblemColor(selectedMarker.problemType)} 
                      />
                    </View>
                    <Text style={styles.modalTitle}>{getProblemTitle(selectedMarker.problemType)}</Text>
                    <Text style={styles.modalDate}>{formatDate(selectedMarker.date)}</Text>
                  </View>
                  <View style={styles.modalBody}>
                    <Text style={styles.modalDescription}>{selectedMarker.description}</Text>
                    <View style={styles.coordinatesContainer}>
                      <Text style={styles.coordinatesLabel}>Localização:</Text>
                      <Text style={styles.coordinatesText}>
                        {selectedMarker.coordinate.latitude.toFixed(6)}, {selectedMarker.coordinate.longitude.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
  selectedFilter: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
  },
  selectedFilterText: {
    color: '#fff',
  },
  listContainer: {
    padding: 10,
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reportDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  coordinatesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 