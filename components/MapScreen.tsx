import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

export const STORAGE_KEYS = {
  MARKERS: '@markers',
  ROUTES: '@routes',
};

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
  coordinates: { latitude: number; longitude: number }[];
  name: string;
  description?: string;
  date: string;
}

export const MapScreen = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [problemType, setProblemType] = useState('buraco');
  const [description, setDescription] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{ coordinates: { latitude: number; longitude: number }[] } | null>(null);
  const [selectedTool, setSelectedTool] = useState<'marker' | 'route'>('marker');

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
    if (selectedTool === 'route' && isDrawingRoute && currentRoute) {
      const newCoordinates = [...currentRoute.coordinates, e.nativeEvent.coordinate];
      setCurrentRoute({ coordinates: newCoordinates });
      
      // Se o usuário tocar no último ponto, finaliza a rota
      if (newCoordinates.length > 1) {
        const lastPoint = newCoordinates[newCoordinates.length - 1];
        const secondLastPoint = newCoordinates[newCoordinates.length - 2];
        const distance = Math.sqrt(
          Math.pow(lastPoint.latitude - secondLastPoint.latitude, 2) +
          Math.pow(lastPoint.longitude - secondLastPoint.longitude, 2)
        );
        
        if (distance < 0.0001) { // Se o ponto estiver muito próximo do último
          finishDrawingRoute();
        }
      }
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
    setCurrentRoute({ coordinates: [] });
    Alert.alert(
      'Desenhar Rota',
      'Toque no mapa para adicionar pontos da rota. Toque no último ponto para finalizar.',
      [
        {
          text: 'OK',
          onPress: () => {},
        },
      ]
    );
  };

  const finishDrawingRoute = () => {
    if (!currentRoute || currentRoute.coordinates.length < 2) {
      Alert.alert('Erro', 'Uma rota precisa ter pelo menos 2 pontos.');
      return;
    }

    const newRoute: RouteData = {
      id: Date.now().toString(),
      coordinates: currentRoute.coordinates,
      name: routeName,
      description: routeDescription,
      date: new Date().toISOString()
    };

    setRoutes([...routes, newRoute]);
    setRouteModalVisible(false);
    setIsDrawingRoute(false);
    setCurrentRoute(null);
    setRouteName('');
    setRouteDescription('');
  };

  const saveRoute = () => {
    if (!currentRoute) return;
    
    if (routeName.trim() === '') {
      Alert.alert('Erro', 'Por favor, dê um nome à rota.');
      return;
    }

    const newRoute: RouteData = {
      id: Date.now().toString(),
      coordinates: currentRoute.coordinates,
      name: routeName,
      description: routeDescription,
      date: new Date().toISOString()
    };

    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    setRouteModalVisible(false);
    setIsDrawingRoute(false);
    setCurrentRoute(null);
    setRouteName('');
    setRouteDescription('');
    setSelectedTool('marker');
    saveData();
  };

  const cancelRoute = () => {
    setRouteModalVisible(false);
    setIsDrawingRoute(false);
    setCurrentRoute(null);
    setSelectedTool('marker');
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'buraco':
        return 'red';
      case 'obstaculo':
        return 'orange';
      case 'falta-infra':
        return 'green';
      case 'acidente':
        return 'purple';
      case 'alagamento':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const handleLocationPress = async () => {
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

  const handleSaveRoute = () => {
    if (!currentRoute) return;
    
    const newRoute: RouteData = {
      id: Date.now().toString(),
      coordinates: currentRoute.coordinates,
      name: routeName,
      description: routeDescription,
      date: new Date().toISOString()
    };

    setRoutes([...routes, newRoute]);
    setRouteModalVisible(false);
    setIsDrawingRoute(false);
    setCurrentRoute(null);
    setRouteName('');
    setRouteDescription('');
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

          {currentRoute && (
            <>
              <Polyline
                coordinates={currentRoute.coordinates}
                strokeColor="#4CAF50"
                strokeWidth={3}
              />
              {currentRoute.coordinates.map((coord, index) => (
                <Marker
                  key={`point-${index}`}
                  coordinate={coord}
                  title={`Ponto ${index + 1}`}
                  pinColor={index === currentRoute.coordinates.length - 1 ? "#FF0000" : "#4CAF50"}
                />
              ))}
            </>
          )}
        </MapView>
      )}

      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            selectedTool === 'marker' && styles.activeControlButton
          ]}
          onPress={() => setSelectedTool('marker')}
        >
          <Ionicons 
            name="pin-outline" 
            size={24} 
            color={selectedTool === 'marker' ? 'white' : '#333'} 
          />
          <Text style={[
            styles.controlButtonText,
            selectedTool === 'marker' && styles.activeControlButtonText
          ]}>
            Marcador
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            selectedTool === 'route' && styles.activeControlButton
          ]}
          onPress={startDrawingRoute}
        >
          <Ionicons 
            name="create-outline" 
            size={24} 
            color={selectedTool === 'route' ? 'white' : '#333'} 
          />
          <Text style={[
            styles.controlButtonText,
            selectedTool === 'route' && styles.activeControlButtonText
          ]}>
            Rota
          </Text>
        </TouchableOpacity>

        {isDrawingRoute && currentRoute && currentRoute.coordinates.length > 0 && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#2196F3' }]}
            onPress={finishDrawingRoute}
          >
            <Ionicons 
              name="checkmark-outline" 
              size={24} 
              color="white" 
            />
            <Text style={[styles.controlButtonText, { color: 'white' }]}>
              Finalizar
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleLocationPress}
        >
          <Ionicons 
            name="locate-outline" 
            size={24} 
            color="#333" 
          />
          <Text style={styles.controlButtonText}>
            Localização
          </Text>
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
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Problema</Text>
              <View style={styles.problemTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.problemTypeButton,
                    problemType === 'buraco' && styles.activeProblemTypeButton
                  ]}
                  onPress={() => setProblemType('buraco')}
                >
                  <Ionicons 
                    name="alert-circle-outline" 
                    size={20} 
                    color={problemType === 'buraco' ? 'white' : '#333'} 
                  />
                  <Text style={[
                    styles.problemTypeButtonText,
                    problemType === 'buraco' && styles.activeProblemTypeButtonText
                  ]}>
                    Buraco
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.problemTypeButton,
                    problemType === 'acidente' && styles.activeProblemTypeButton
                  ]}
                  onPress={() => setProblemType('acidente')}
                >
                  <Ionicons 
                    name="warning-outline" 
                    size={20} 
                    color={problemType === 'acidente' ? 'white' : '#333'} 
                  />
                  <Text style={[
                    styles.problemTypeButtonText,
                    problemType === 'acidente' && styles.activeProblemTypeButtonText
                  ]}>
                    Acidente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.problemTypeButton,
                    problemType === 'alagamento' && styles.activeProblemTypeButton
                  ]}
                  onPress={() => setProblemType('alagamento')}
                >
                  <Ionicons 
                    name="water-outline" 
                    size={20} 
                    color={problemType === 'alagamento' ? 'white' : '#333'} 
                  />
                  <Text style={[
                    styles.problemTypeButtonText,
                    problemType === 'alagamento' && styles.activeProblemTypeButtonText
                  ]}>
                    Alagamento
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva o problema"
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={addMarker}
              >
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={routeModalVisible}
        onRequestClose={cancelRoute}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Salvar Rota</Text>
            
            <Text>Nome da Rota:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setRouteName}
              value={routeName}
              placeholder="Nome da rota"
            />

            <Text>Descrição:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setRouteDescription}
              value={routeDescription}
              placeholder="Descrição da rota"
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={cancelRoute}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button}
                onPress={saveRoute}
              >
                <Text style={styles.buttonText}>Salvar</Text>
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
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controlButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  activeControlButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
  },
  activeControlButtonText: {
    color: 'white',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    height: 100,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
    width: '100%',
  },
  radioButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#ddd',
    borderColor: '#3498db',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  problemTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  problemTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeProblemTypeButton: {
    backgroundColor: '#4CAF50',
  },
  problemTypeButtonText: {
    marginLeft: 4,
    color: '#333',
  },
  activeProblemTypeButtonText: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 