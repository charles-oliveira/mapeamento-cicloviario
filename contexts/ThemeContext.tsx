import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  primaryText: string;
  text: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  statusBar: 'light' | 'dark';
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  primary: '#4CAF50',
  primaryText: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  tabBar: '#ffffff',
  statusBar: 'dark',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#4CAF50',
  primaryText: '#ffffff',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#2a2a2a',
  tabBar: '#1e1e1e',
  statusBar: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('@user_preferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setIsDarkMode(preferences.darkMode || false);
      } else {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      
      const savedPreferences = await AsyncStorage.getItem('@user_preferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      preferences.darkMode = newValue;
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};