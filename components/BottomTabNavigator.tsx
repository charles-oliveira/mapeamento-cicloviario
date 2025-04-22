import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabPress('map')}
      >
        <Ionicons 
          name={activeTab === 'map' ? 'map' : 'map-outline'} 
          size={24} 
          color={activeTab === 'map' ? '#4CAF50' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>
          Mapa
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabPress('routes')}
      >
        <Ionicons 
          name={activeTab === 'routes' ? 'list' : 'list-outline'} 
          size={24} 
          color={activeTab === 'routes' ? '#4CAF50' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'routes' && styles.activeTabText]}>
          Rotas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabPress('profile')}
      >
        <Ionicons 
          name={activeTab === 'profile' ? 'person' : 'person-outline'} 
          size={24} 
          color={activeTab === 'profile' ? '#4CAF50' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
}); 