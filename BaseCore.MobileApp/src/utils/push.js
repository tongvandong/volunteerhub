import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationApi } from '../api/client';

// QUAN TRỌNG: expo-notifications (push) đã bị gỡ khỏi Expo Go từ SDK 53 — chỉ cần *import* nó
// trong Expo Go là throw ngay lúc nạp module → vỡ app. Vì vậy KHÔNG import ở đầu file; chỉ
// require động khi đang chạy trên dev build / thiết bị thật (không phải Expo Go).
const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

let lastToken = null;

export async function registerForPush() {
  if (isExpoGo) return null;       // Expo Go không hỗ trợ push remote
  if (!Device.isDevice) return null; // máy ảo không nhận push thật
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowAlert: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Mặc định',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const resp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = resp?.data;
    if (token) {
      lastToken = token;
      await notificationApi.registerDeviceToken(token, Platform.OS).catch(() => {});
    }
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPush() {
  try {
    if (lastToken) {
      await notificationApi.removeDeviceToken(lastToken).catch(() => {});
      lastToken = null;
    }
  } catch { /* ignore */ }
}

// Đăng ký lắng nghe khi người dùng bấm vào thông báo đẩy. Trả hàm cleanup (hoặc no-op).
export function addPushTapListener(onTap) {
  if (isExpoGo || !Device.isDevice) return () => {};
  try {
    const Notifications = require('expo-notifications');
    const sub = Notifications.addNotificationResponseReceivedListener(() => onTap?.());
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
