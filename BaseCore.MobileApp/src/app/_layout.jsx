import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthContext';
import { addPushTapListener } from '../utils/push';
import { colors } from '../theme';

function PushTapListener() {
  const router = useRouter();
  useEffect(() => {
    // addPushTapListener tự bỏ qua trên Expo Go (no-op), chỉ chạy trên dev build/thiết bị.
    return addPushTapListener(() => router.push('/notifications'));
  }, [router]);
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PushTapListener />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="v" />
            <Stack.Screen name="o" />
            <Stack.Screen name="s" />
            <Stack.Screen name="a" />
            <Stack.Screen name="events/[id]" />
            <Stack.Screen name="events/new" />
            <Stack.Screen name="events/edit/[id]" />
            <Stack.Screen name="events/manage/[id]" />
            <Stack.Screen name="organizer-verification" />
            <Stack.Screen name="insights" />
            <Stack.Screen name="sponsor-profile" />
            <Stack.Screen name="checkin/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="channels" />
            <Stack.Screen name="channels/[id]" />
            <Stack.Screen name="interview" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="achievements" />
            <Stack.Screen name="my-donations" />
            <Stack.Screen name="verify-certificate" />
            <Stack.Screen name="profile/[userId]" />
            <Stack.Screen name="admin/events" />
            <Stack.Screen name="admin/organizers" />
            <Stack.Screen name="admin/kyc" />
            <Stack.Screen name="admin/users" />
            <Stack.Screen name="admin/skill-verifications" />
            <Stack.Screen name="admin/ratings" />
            <Stack.Screen name="admin/finance" />
            <Stack.Screen name="admin/catalog" />
            <Stack.Screen name="admin/monitoring" />
            <Stack.Screen name="admin/export" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
