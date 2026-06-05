import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { Radio } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function AnnouncementsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          <View style={s.card}>
            <View style={s.ic}><Radio color={Colors.info} size={24} /></View>
            <View style={s.info}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc}>{item.message || item.description || ''}</Text>
              <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        )} 
        ListEmptyComponent={<Text style={s.empty}>No announcements available</Text>} 
      />
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
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
