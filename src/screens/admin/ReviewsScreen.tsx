import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';

export default function ReviewsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/reviews'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Reviews</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
              <View style={s.ic}><Star color="#EAB308" fill="#EAB308" size={20} /></View>
              <View style={s.info}>
                <Text style={s.cName}>{item.customer?.name || 'Customer'}</Text>
                <Text style={s.cSub}>"{item.comment || 'No comment'}"</Text>
                
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight }}>
                  <Text style={{ fontSize: 10, color: Colors.fgDim, marginTop: 4 }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}
                  </Text>
                  {item.order && <Text style={{ fontSize: 10, color: Colors.fgMuted, marginTop: 2 }}>Order #{item.order.slice ? item.order.slice(-6).toUpperCase() : item.order}</Text>}
                  {item.technician?.name && <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '700', marginTop: 2 }}>Tech: {item.technician.name}</Text>}
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={s.rating}>{item.rating || 5}/5</Text>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No reviews found</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  rating: { fontSize: 16, fontWeight: '900', color: '#EAB308' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
