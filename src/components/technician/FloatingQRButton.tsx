import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image, Dimensions, Animated } from 'react-native';
import { QrCode, X, Maximize } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { getQRCodes, QRCodeData } from '../../api/qrcodes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@sktech_qrcodes';
const { width } = Dimensions.get('window');

export default function FloatingQRButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [qrcodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);

  useEffect(() => {
    if (modalVisible) {
      loadData();
    }
  }, [modalVisible]);

  const loadData = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setQRCodes(JSON.parse(cached));
      
      const data = await getQRCodes();
      setQRCodes(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('FloatingQR load error', e);
    }
  };

  const groupedQRs = useMemo(() => {
    const groups: { [key: string]: QRCodeData[] } = {};
    qrcodes.forEach(qr => {
      const cat = qr.category === 'Custom' ? (qr.customCategory || 'Custom') : qr.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(qr);
    });
    return Object.entries(groups).map(([cat, items]) => ({ cat, items }));
  }, [qrcodes]);

  return (
    <>
      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <QrCode color="#fff" size={24} />
        <Text style={s.fabT}>Show QR</Text>
      </TouchableOpacity>

      {/* Main Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.sheetHdr}>
              <Text style={s.sheetTitle}>Quick QR Codes</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={s.closeBtn}>
                <X color={Colors.fgPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={groupedQRs}
              keyExtractor={item => item.cat}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={s.groupWrap}>
                  <Text style={s.groupTitle}>{item.cat}</Text>
                  <View style={s.grid}>
                    {item.items.map(qr => (
                      <TouchableOpacity key={qr._id} style={s.qrItem} onPress={() => setSelectedQR(qr)}>
                        <View style={s.qrItemIc}>
                          <QrCode color={Colors.primary} size={24} />
                        </View>
                        <Text style={s.qrItemT} numberOfLines={1}>{qr.qrName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Fullscreen QR Modal */}
      <Modal visible={!!selectedQR} transparent animationType="fade">
        <View style={s.fullOverlay}>
          <TouchableOpacity style={s.fullClose} onPress={() => setSelectedQR(null)}>
            <X color="#fff" size={32} />
          </TouchableOpacity>
          <View style={s.fullCard}>
            <Text style={s.fullTitle}>{selectedQR?.qrName}</Text>
            {selectedQR?.qrImage ? (
              <View style={s.qrImageContainer}>
                <Image source={{ uri: selectedQR.qrImage }} style={s.qrImage} resizeMode="contain" />
              </View>
            ) : (
              <View style={{ width: width * 0.8, height: width * 0.8, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
                <QrCode color={Colors.border} size={100} />
              </View>
            )}
            <Text style={s.fullSub}>Show this to the customer</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, zIndex: 999 },
  fabT: { color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: Colors.fgPrimary },
  closeBtn: { padding: 8, backgroundColor: Colors.bgSurface, borderRadius: 20 },
  groupWrap: { marginBottom: 24 },
  groupTitle: { fontSize: 16, fontWeight: '600', color: Colors.fgMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qrItem: { width: '47%', backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  qrItemIc: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  qrItemT: { fontSize: 14, fontWeight: '500', color: Colors.fgPrimary, flex: 1 },
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fullClose: { position: 'absolute', top: 50, right: 20, padding: 10 },
  fullCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center' },
  fullTitle: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 24 },
  fullSub: { fontSize: 16, color: '#666', marginTop: 24 },
  qrImageContainer: { alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 300, height: 300 }
});
