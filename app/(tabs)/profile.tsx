import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator, Share, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  USER_PREFERENCES: '@user_preferences',
  USER_STATS: '@user_stats',
};

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  profileImage: string | null;
  socialLinks?: {
    instagram?: string;
    strava?: string;
    twitter?: string;
  };
}

interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  language: string;
}

interface UserStats {
  totalMappedCyclingPaths: number;
  totalKilometers: number;
  lastActivity: string;
  recentActivities: Array<{
    date: string;
    type: string;
    description: string;
  }>;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profileImage: null,
    socialLinks: {},
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: false,
    notifications: true,
    language: 'pt-BR',
  });

  const [stats, setStats] = useState<UserStats>({
    totalMappedCyclingPaths: 0,
    totalKilometers: 0,
    lastActivity: '',
    recentActivities: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'preferences'>('profile');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [savedProfile, savedPreferences, savedStats] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.USER_STATS),
      ]);

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats)),
      ]);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareProfile = async () => {
    try {
      const message = `Confira o perfil de ${profile.name} no Mapeamento Cicloviário!\n\n` +
        `Ciclovias mapeadas: ${stats.totalMappedCyclingPaths}\n` +
        `Quilômetros percorridos: ${stats.totalKilometers}\n\n` +
        `Baixe o app e comece a mapear também!`;
      
      await Share.share({
        message,
        title: 'Compartilhar Perfil',
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o perfil.');
    }
  };

  const renderProfileTab = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.profileImageContainer}>
          {profile.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={80} color="#4CAF50" />
          )}
          {isEditing && (
            <View style={styles.editImageOverlay}>
              <Ionicons name="camera" size={24} color="white" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={profile.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Seu nome"
            editable={isEditing}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={profile.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="seu@email.com"
            keyboardType="email-address"
            editable={isEditing}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={profile.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            editable={isEditing}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={profile.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Seu endereço"
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Biografia</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={profile.bio}
            onChangeText={(value) => handleInputChange('bio', value)}
            placeholder="Conte um pouco sobre você"
            multiline
            numberOfLines={4}
            editable={isEditing}
          />
        </View>

        <View style={styles.socialLinksContainer}>
          <Text style={styles.sectionTitle}>Redes Sociais</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={profile.socialLinks?.instagram}
              onChangeText={(value) => setProfile(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, instagram: value }
              }))}
              placeholder="@seu_usuario"
              editable={isEditing}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Strava</Text>
            <TextInput
              style={styles.input}
              value={profile.socialLinks?.strava}
              onChangeText={(value) => setProfile(prev => ({
                ...prev,
                socialLinks: { ...prev.socialLinks, strava: value }
              }))}
              placeholder="Seu perfil no Strava"
              editable={isEditing}
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderStatsTab = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <Ionicons name="map-outline" size={32} color="#4CAF50" />
        <Text style={styles.statsNumber}>{stats.totalMappedCyclingPaths}</Text>
        <Text style={styles.statsLabel}>Ciclovias Mapeadas</Text>
      </View>

      <View style={styles.statsCard}>
        <Ionicons name="speedometer-outline" size={32} color="#4CAF50" />
        <Text style={styles.statsNumber}>{stats.totalKilometers}</Text>
        <Text style={styles.statsLabel}>Quilômetros</Text>
      </View>

      <View style={styles.recentActivities}>
        <Text style={styles.sectionTitle}>Atividades Recentes</Text>
        {stats.recentActivities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.activityContent}>
              <Text style={styles.activityDate}>{activity.date}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.preferencesContainer}>
      <View style={styles.preferenceItem}>
        <View style={styles.preferenceInfo}>
          <Ionicons name="moon-outline" size={24} color="#666" />
          <Text style={styles.preferenceLabel}>Modo Escuro</Text>
        </View>
        <Switch
          value={preferences.darkMode}
          onValueChange={(value) => setPreferences(prev => ({ ...prev, darkMode: value }))}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={preferences.darkMode ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      <View style={styles.preferenceItem}>
        <View style={styles.preferenceInfo}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.preferenceLabel}>Notificações</Text>
        </View>
        <Switch
          value={preferences.notifications}
          onValueChange={(value) => setPreferences(prev => ({ ...prev, notifications: value }))}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={preferences.notifications ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      <View style={styles.preferenceItem}>
        <View style={styles.preferenceInfo}>
          <Ionicons name="language-outline" size={24} color="#666" />
          <Text style={styles.preferenceLabel}>Idioma</Text>
        </View>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>
            {preferences.language === 'pt-BR' ? 'Português' : 'English'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfile(prev => ({
        ...prev,
        profileImage: result.assets[0].uri,
      }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={activeTab === 'profile' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="stats-chart-outline"
            size={24}
            color={activeTab === 'stats' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Estatísticas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'preferences' && styles.activeTab]}
          onPress={() => setActiveTab('preferences')}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={activeTab === 'preferences' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'preferences' && styles.activeTabText]}>
            Preferências
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                loadAllData();
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveAllData}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={shareProfile}
            >
              <Text style={styles.buttonText}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 8,
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
  recentActivities: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  preferencesContainer: {
    padding: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  languageText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  socialLinksContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
}); 