import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, Image, Dimensions, RefreshControl, Share, Alert } from 'react-native';
import { QrCode, Search, Filter, X, Share2, Copy, AlertCircle, WifiOff } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { getQRCodes, QRCodeData } from '../../api/qrcodes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const CACHE_KEY = '@sktech_qrcodes';
const { width, height } = Dimensions.get('window');

export default function TechnicianQRCodeCenterScreen() {
  const [qrcodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);

  const loadData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      
      // Load from cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setQRCodes(JSON.parse(cached));
      }

      // Fetch from API
      const data = await getQRCodes();
      setQRCodes(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setOffline(false);
    } catch (e: any) {
      console.log('Failed to fetch QRs from network', e.message);
      setOffline(true);
      if (!qrcodes.length) {
        Alert.alert('Offline Mode', 'No QR codes cached. Please connect to internet to sync.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const categories = useMemo(() => {
    const cats = new Set(qrcodes.map(q => q.category === 'Custom' ? q.customCategory! : q.category));
    return ['All', ...Array.from(cats)];
  }, [qrcodes]);

  const filteredData = useMemo(() => {
    return qrcodes.filter(q => {
      const matchCat = selectedCat === 'All' || (q.category === 'Custom' ? q.customCategory === selectedCat : q.category === selectedCat);
      const matchSearch = q.qrName.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [qrcodes, selectedCat, search]);

  const handleCopy = async (val: string) => {
    await Clipboard.setStringAsync(val);
    Alert.alert('Copied', 'Target value copied to clipboard!');
  };

  const renderItem = ({ item }: { item: QRCodeData }) => (
    <TouchableOpacity style={s.card} onPress={() => setSelectedQR(item)}>
      <View style={s.ic}>
        {item.qrImage ? (
          <Image source={{ uri: item.qrImage }} style={{ width: 40, height: 40, borderRadius: 8 }} />
        ) : (
          <QrCode color="#fff" size={24} />
        )}
      </View>
      <View style={s.info}>
        <Text style={s.cName}>{item.qrName}</Text>
        <Text style={s.cCat}>{item.category === 'Custom' ? item.customCategory : item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>QR Code Center</Text>
        {offline && (
          <View style={s.offlineBadge}>
            <WifiOff color={Colors.warning} size={14} />
            <Text style={s.offlineT}>Offline (Using Cached)</Text>
          </View>
        )}
      </View>

      <View style={s.catsWrap}>
        <FlatList 
          horizontal 
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[s.chip, selectedCat === item && s.chipActive]} 
              onPress={() => setSelectedCat(item)}
            >
              <Text style={[s.chipT, selectedCat === item && s.chipTActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingVertical: 10 }}
        />
      </View>

      <FlatList 
        data={filteredData} 
        keyExtractor={i => i._id!}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadData(true)} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <AlertCircle color={Colors.border} size={48} />
            <Text style={{ color: Colors.fgMuted, marginTop: 16 }}>No QR Codes available</Text>
          </View>
        ) : null}
      />

      <Modal visible={!!selectedQR} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>{selectedQR?.qrName}</Text>
              <TouchableOpacity onPress={() => setSelectedQR(null)} style={s.closeBtn}>
                <X color={Colors.fgPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={s.qrBox}>
              {selectedQR?.qrImage ? (
                <Image source={{ uri: selectedQR.qrImage }} style={{ width: width * 0.7, height: width * 0.7 }} resizeMode="contain" />
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', height: width * 0.7 }}>
                  <QrCode color={Colors.border} size={100} />
                  <Text style={{ color: Colors.fgMuted, marginTop: 20 }}>No image provided</Text>
                </View>
              )}
            </View>

            {selectedQR?.description ? <Text style={s.modalDesc}>{selectedQR.description}</Text> : null}

            {selectedQR?.targetValue ? (
              <TouchableOpacity style={s.copyBox} onPress={() => handleCopy(selectedQR.targetValue!)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.copyLabel}>{selectedQR.targetType || 'Value'}</Text>
                  <Text style={s.copyVal} numberOfLines={1}>{selectedQR.targetValue}</Text>
                </View>
                <Copy color={Colors.primary} size={20} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.fgPrimary },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  offlineT: { color: Colors.warning, fontSize: 12, fontWeight: '600' },
  catsWrap: { borderBottomWidth: 1, borderColor: Colors.border },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipT: { color: Colors.fgMuted, fontWeight: '500' },
  chipTActive: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  ic: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  info: { flex: 1 },
  cName: { fontSize: 16, fontWeight: '600', color: Colors.fgPrimary },
  cCat: { fontSize: 13, color: Colors.fgMuted, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.fgPrimary },
  closeBtn: { padding: 8, backgroundColor: Colors.background, borderRadius: 20 },
  qrBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  modalDesc: { color: Colors.fgMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  copyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  copyLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginBottom: 4 },
  copyVal: { fontSize: 15, color: Colors.fgPrimary, fontWeight: '500' }
});
