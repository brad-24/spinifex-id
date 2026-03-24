import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.primary,
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="identify"
          options={{ title: 'Identify Plant', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="results"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
