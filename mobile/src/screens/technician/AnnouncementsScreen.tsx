import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { Radio, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function AnnouncementsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const load = async () => {
    try { 
      setLoading(true); 
      const d = await fetchWithAuth('/internal/announcements'); 
      setData(d || []); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <FlatList 
        data={data} 
        keyExtractor={(i, idx) => i._id || idx.toString()} 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelectedAnnouncement(item)}>
            <View style={s.ic}><Radio color={Colors.info} size={24} /></View>
            <View style={s.info}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc} numberOfLines={2}>{item.content || item.message || item.description || ''}</Text>
              <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No announcements available</Text>} 
      />

      <Modal
        visible={!!selectedAnnouncement}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{selectedAnnouncement?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                <X color={Colors.fgMuted} size={24} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalDate}>{selectedAnnouncement ? new Date(selectedAnnouncement.createdAt).toLocaleString() : ''}</Text>
            <View style={s.modalBody}>
              <Text style={s.modalText}>{selectedAnnouncement?.content || selectedAnnouncement?.message || selectedAnnouncement?.description || ''}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  desc: { fontSize: 14, color: Colors.fgMuted, fontWeight: '500', marginTop: 4, lineHeight: 20 },
  date: { fontSize: 11, color: Colors.fgDim, fontWeight: '600', marginTop: 8 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, flex: 1, marginRight: 16 },
  modalDate: { fontSize: 12, color: Colors.fgDim, fontWeight: '600', marginBottom: 16 },
  modalBody: { backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16 },
  modalText: { fontSize: 15, color: Colors.fgSecondary, fontWeight: '500', lineHeight: 22 },
});
