import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, Platform, RefreshControl, Image } from 'react-native';
import { QrCode, Plus, Trash2, Edit, Copy, EyeOff, Eye, Image as ImageIcon, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge } from '../../components/ui';
import { getAdminQRCodes, deleteQRCode, updateQRCode, QRCodeData } from '../../api/qrcodes';

export default function QRCodeCenterScreen({ navigation }: any) {
  const [qrcodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAdminQRCodes();
      setQRCodes(data || []);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to load QR Codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this QR code?')) {
        try {
          await deleteQRCode(id);
          setQRCodes(prev => prev.filter(q => q._id !== id));
        } catch (e: any) { alert(e.message); }
      }
    } else {
      Alert.alert('Delete QR Code', 'Are you sure you want to delete this QR Code permanently?', [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteQRCode(id);
            setQRCodes(prev => prev.filter(q => q._id !== id));
          } catch (e: any) { Alert.alert('Error', e.message); }
        }}
      ]);
    }
  };

  const toggleStatus = async (item: QRCodeData) => {
    try {
      const updated = await updateQRCode(item._id!, { status: !item.status });
      setQRCodes(prev => prev.map(q => q._id === item._id ? updated : q));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderItem = ({ item }: { item: QRCodeData }) => (
    <View style={[s.card, !item.status && { opacity: 0.6 }]}>
      <View style={s.row}>
        <View style={[s.ic, { backgroundColor: item.color || Colors.primaryLight }]}>
          {item.qrImage ? (
            <Image source={{ uri: item.qrImage }} style={{ width: 40, height: 40, borderRadius: 8 }} />
          ) : (
            <QrCode color="#fff" size={24} />
          )}
        </View>
        <View style={s.info}>
          <Text style={s.cName}>{item.qrName}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            <Badge label={item.category === 'Custom' ? item.customCategory || 'Custom' : item.category} color="blue" />
            {!item.status && <Badge label="Inactive" color="red" />}
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity onPress={() => toggleStatus(item)} style={s.actionBtn}>
            {item.status ? <Eye color={Colors.fgMuted} size={18} /> : <EyeOff color={Colors.fgMuted} size={18} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('QRCodeForm', { qrData: item })} style={s.actionBtn}>
            <Edit color={Colors.primary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id!)} style={s.actionBtn}>
            <Trash2 color={Colors.danger} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      {item.description && <Text style={s.cSub}>{item.description}</Text>}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <ArrowLeft color={Colors.fgPrimary} size={28} />
          </TouchableOpacity>
          <Text style={s.title}>QR Code Center</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('QRCodeForm')}>
          <Plus color="#fff" size={20} />
          <Text style={s.addBtnT}>Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={qrcodes} 
        keyExtractor={i => i._id!}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <QrCode color={Colors.border} size={64} />
            <Text style={{ color: Colors.fgMuted, marginTop: 16 }}>No QR Codes found</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.fgPrimary },
  addBtn: { flexDirection: 'row', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignItems: 'center', gap: 6 },
  addBtnT: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  info: { flex: 1 },
  cName: { fontSize: 16, fontWeight: '600', color: Colors.fgPrimary },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, backgroundColor: Colors.background, borderRadius: 8 },
  cSub: { fontSize: 13, color: Colors.fgMuted, marginTop: 12, lineHeight: 18 }
});
