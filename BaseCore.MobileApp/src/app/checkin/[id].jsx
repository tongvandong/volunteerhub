import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { registrationApi } from '../../api/client';
import { colors, radius, spacing } from '../../theme';

async function tryGetCoords() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return {};
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return {};
  }
}

export default function CheckIn() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  const doCheckin = async (payload, label) => {
    if (busy) return;
    setBusy(true);
    try {
      await registrationApi.selfCheckin(id, payload);
      Alert.alert('Điểm danh thành công', `Đã điểm danh bằng ${label}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      handled.current = false; // cho phép quét lại
      Alert.alert('Điểm danh thất bại', e?.response?.data?.message || 'Mã QR/vị trí không hợp lệ hoặc bạn chưa đăng ký.');
    } finally {
      setBusy(false);
    }
  };

  const onScanned = async ({ data }) => {
    if (handled.current) return;
    handled.current = true;
    const coords = await tryGetCoords();
    await doCheckin({ qrCode: data, ...coords }, 'QR');
  };

  const onGpsCheckin = async () => {
    const coords = await tryGetCoords();
    if (!coords.latitude) {
      Alert.alert('Không lấy được vị trí', 'Hãy cấp quyền vị trí và bật GPS.');
      return;
    }
    await doCheckin(coords, 'vị trí (GPS)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={[s.topbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Điểm danh</Text>
      </View>

      {!permission ? (
        <View style={s.center}><ActivityIndicator color="#fff" /></View>
      ) : !permission.granted ? (
        <View style={s.center}>
          <Text style={s.permText}>Cần quyền camera để quét mã QR.</Text>
          <TouchableOpacity style={s.btn} onPress={requestPermission}>
            <Text style={s.btnText}>Cấp quyền camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy ? undefined : onScanned}
        >
          <View style={s.overlay}>
            <View style={s.frame} />
            <Text style={s.hint}>Đưa mã QR của sự kiện vào khung</Text>
          </View>
        </CameraView>
      )}

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={[s.gpsBtn, busy && { opacity: 0.6 }]} onPress={onGpsCheckin} disabled={busy}>
          <Ionicons name="location" size={18} color="#fff" />
          <Text style={s.btnText}>{busy ? 'Đang xử lý…' : 'Điểm danh bằng vị trí (GPS)'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingBottom: 10 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  permText: { color: '#fff', fontSize: 14.5, textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: { width: 230, height: 230, borderWidth: 3, borderColor: '#fff', borderRadius: 18, backgroundColor: 'transparent' },
  hint: { color: '#fff', marginTop: spacing.md, fontSize: 13.5 },
  footer: { padding: spacing.md, backgroundColor: '#000' },
  btn: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 13, paddingHorizontal: spacing.lg, alignItems: 'center' },
  gpsBtn: { flexDirection: 'row', gap: 8, justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
