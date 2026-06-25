import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, Alert, ScrollView, Linking } from 'react-native';
import { LifeBuoy, X, Trash2, Edit2, Phone, MessageSquare, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Badge } from '../../components/ui';

const statusColors: any = { Open: 'amber', 'In Progress': 'blue', Resolved: 'green', Closed: 'gray' };
const priorityColors: any = { High: Colors.danger, Medium: Colors.warning, Low: Colors.info };

export default function AdminTicketsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/tickets/admin/all'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetchWithAuth(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected(null);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Support Tickets</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)}>
            <View style={s.ic}><LifeBuoy color={Colors.info} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName} numberOfLines={1}>{item.subject || 'Issue'}</Text>
              <Text style={s.cSub}>{item.customer?.name || 'Customer'} • {item.status || 'Open'}</Text>
            </View>
            <Badge label={item.status} color={statusColors[item.status] || 'gray'} />
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No support tickets</Text>} />

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}>
              <Text style={s.mT}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
              <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <View style={[s.badge, { backgroundColor: (priorityColors[selected?.priority] || Colors.fgMuted) + '20' }]}>
                    <Text style={[s.badgeT, { color: priorityColors[selected?.priority] || Colors.fgMuted }]}>{selected?.priority || 'Normal'} Priority</Text>
                  </View>
                  <Text style={s.dLabel}>{formatDate(selected?.createdAt)}</Text>
                </View>

                <View style={s.customerCard}>
                  <Text style={s.dLabel}>Customer Contact</Text>
                  <Text style={s.dVal}>{selected?.customer?.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <TouchableOpacity style={s.contactBtn} onPress={() => Linking.openURL(`tel:${selected?.customer?.phone}`).catch(() => console.log('Could not open phone'))}>
                      <Phone color={Colors.primary} size={16} /><Text style={s.contactBtnT}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.contactBtn, { borderColor: Colors.success }]} onPress={() => Linking.openURL(`whatsapp://send?phone=+91${selected?.customer?.phone}`).catch(() => console.log('Could not open whatsapp'))}>
                      <MessageSquare color={Colors.success} size={16} /><Text style={[s.contactBtnT, { color: Colors.success }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={s.dLabel}>Subject</Text>
                <Text style={s.dVal}>{selected?.subject}</Text>
                
                <Text style={[s.dLabel, { marginTop: 16 }]}>Description</Text>
                <View style={s.descBox}>
                  <AlertCircle color={Colors.fgMuted} size={16} style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={s.descTxt}>{selected?.description}</Text>
                </View>
                
                <Text style={[s.dLabel, { marginTop: 24, marginBottom: 12 }]}>Update Status</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 40 }}>
                  {['Open', 'In Progress', 'Resolved', 'Closed'].map(st => (
                    <TouchableOpacity key={st} style={[s.sBtn, selected?.status === st && s.sBtnAct]} onPress={() => handleStatusUpdate(selected._id, st)}>
                      <Text style={[s.sBtnT, selected?.status === st && s.sBtnTAct]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
          </View>
        </View>
      </Modal>
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
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 30 },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  dLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase' },
  dVal: { fontSize: 18, color: Colors.fgPrimary, fontWeight: '800', marginTop: 4 },
  sBtn: { backgroundColor: Colors.bgSurface, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, width: '48%' },
  sBtnAct: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  sBtnT: { color: Colors.fgPrimary, fontWeight: '700' },
  sBtnTAct: { color: Colors.primary, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeT: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  customerCard: { backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  contactBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.bgCard },
  contactBtnT: { color: Colors.primary, fontWeight: '700', marginLeft: 8 },
  descBox: { backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row' },
  descTxt: { fontSize: 15, color: Colors.fgPrimary, lineHeight: 22, flex: 1 }
});
