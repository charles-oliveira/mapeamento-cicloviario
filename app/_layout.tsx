import { Stack } from 'expo-router';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  const pathname = usePathname();
  const showTabs = pathname !== '/';

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
