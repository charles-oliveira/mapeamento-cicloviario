import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Platform } from 'react-native';
import { MapViewComponent } from './components/MapView';
import { RoutesScreen } from './components/RoutesScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomTabNavigator } from './components/BottomTabNavigator';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');

  const renderScreen = () => {
    switch (activeTab) {
      case 'map':
        return <MapViewComponent />;
      case 'routes':
        return <RoutesScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <MapViewComponent />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {renderScreen()}
        </View>
        <BottomTabNavigator
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
}); 