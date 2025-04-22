import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
  coordinates: Array<{ latitude: number; longitude: number }>;
  name: string;
  description: string;
  id: string;
}

const STORAGE_KEYS = {
  MARKERS: '@markers',
  ROUTES: '@routes',
};

export const MapViewComponent: React.FC = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [problemType, setProblemType] = useState('buraco');
  const [description, setDescription] = useState('');
  const [selectedTool, setSelectedTool] = useState<'marker' | 'route'>('marker');
  const [currentRoute, setCurrentRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);

  useEffect(() => {
    loadSavedData();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à localização para usar o aplicativo.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  const loadSavedData = async () => {
    try {
      const savedMarkers = await AsyncStorage.getItem(STORAGE_KEYS.MARKERS);
      const savedRoutes = await AsyncStorage.getItem(STORAGE_KEYS.ROUTES);

      if (savedMarkers) {
        setMarkers(JSON.parse(savedMarkers));
      }
      if (savedRoutes) {
        setRoutes(JSON.parse(savedRoutes));
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MARKERS, JSON.stringify(markers));
      await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    if (selectedTool === 'route' && isDrawingRoute) {
      setCurrentRoute([...currentRoute, e.nativeEvent.coordinate]);
    } else if (selectedTool === 'marker') {
      setCurrentMarker(e.nativeEvent.coordinate);
      setModalVisible(true);
    }
  };

  const addMarker = () => {
    if (currentMarker) {
      const newMarker: MarkerData = {
        coordinate: currentMarker,
        problemType,
        description,
        date: new Date().toISOString(),
        id: Date.now().toString(),
      };
      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      setModalVisible(false);
      setDescription('');
      saveData();
    }
  };

  const startDrawingRoute = () => {
    setSelectedTool('route');
    setIsDrawingRoute(true);
    setCurrentRoute([]);
  };

  const finishDrawingRoute = () => {
    if (currentRoute.length < 2) {
      Alert.alert('Erro', 'Uma rota precisa ter pelo menos 2 pontos.');
      return;
    }
    const newRoute: RouteData = {
      coordinates: currentRoute,
      name: `Rota ${routes.length + 1}`,
      description: '',
      id: Date.now().toString(),
    };
    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    setIsDrawingRoute(false);
    setCurrentRoute([]);
    setSelectedTool('marker');
    saveData();
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'buraco':
        return 'red';
      case 'acidente':
        return 'orange';
      case 'alagamento':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          onPress={handleMapPress}
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={`Problema: ${marker.problemType}`}
              description={marker.description}
              pinColor={getMarkerColor(marker.problemType)}
            />
          ))}
          
          {routes.map((route) => (
            <Polyline
              key={route.id}
              coordinates={route.coordinates}
              strokeColor="#0000FF"
              strokeWidth={3}
            />
          ))}

          {currentRoute.length > 0 && (
            <Polyline
              coordinates={currentRoute}
              strokeColor="#FF0000"
              strokeWidth={3}
            />
          )}
        </MapView>
      )}

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, selectedTool === 'marker' && styles.activeButton]}
          onPress={() => setSelectedTool('marker')}
        >
          <Ionicons name="pin" size={24} color={selectedTool === 'marker' ? '#fff' : '#666'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, selectedTool === 'route' && styles.activeButton]}
          onPress={isDrawingRoute ? finishDrawingRoute : startDrawingRoute}
        >
          <Ionicons 
            name={isDrawingRoute ? "checkmark" : "create"} 
            size={24} 
            color={selectedTool === 'route' ? '#fff' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Reportar Problema</Text>
            
            <View style={styles.problemTypeContainer}>
              <TouchableOpacity 
                style={[styles.problemTypeButton, problemType === 'buraco' && styles.activeProblemType]}
                onPress={() => setProblemType('buraco')}
              >
                <Text style={[styles.problemTypeText, problemType === 'buraco' && styles.activeProblemTypeText]}>
                  Buraco
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.problemTypeButton, problemType === 'acidente' && styles.activeProblemType]}
                onPress={() => setProblemType('acidente')}
              >
                <Text style={[styles.problemTypeText, problemType === 'acidente' && styles.activeProblemTypeText]}>
                  Acidente
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.problemTypeButton, problemType === 'alagamento' && styles.activeProblemType]}
                onPress={() => setProblemType('alagamento')}
              >
                <Text style={[styles.problemTypeText, problemType === 'alagamento' && styles.activeProblemTypeText]}>
                  Alagamento
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              onChangeText={setDescription}
              value={description}
              placeholder="Descreva o problema"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button}
                onPress={addMarker}
              >
                <Text style={styles.buttonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButton: {
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  problemTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  problemTypeButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
  },
  activeProblemType: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  problemTypeText: {
    textAlign: 'center',
    color: '#666',
  },
  activeProblemTypeText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 