import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDevStore } from './dev/dev.store';
import { getDb } from './storage/db';
import { ThemeProvider } from './theme/ThemeProvider';
import { useAppFonts } from './theme/useAppFonts';

async function startUp(): Promise<void> {
  await getDb();
  if (__DEV__) await useDevStore.getState().hydrate();
}

export function AppRoot() {
  const fontsReady = useAppFonts();
  const [dataReady, setDataReady] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    startUp()
      .then(() => setDataReady(true))
      .catch((error: unknown) => setStartError(error instanceof Error ? error.message : String(error)));
  }, []);

  if (startError) {
    // Shown before the theme exists, e.g. a database from a newer build. System text on purpose.
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Could not start: {startError}</Text>
      </View>
    );
  }
  if (!fontsReady || !dataReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
