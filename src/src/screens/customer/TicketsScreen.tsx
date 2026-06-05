import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { LifeBuoy, Plus, MessageCircle, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Badge, Button } from '../../components/ui';

const statusColors: any = { Open: 'amber', 'In Progress': 'blue', Resolved: 'green', Closed: 'gray' };

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/tickets/my');
      setTickets(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const createTicket = async () => {
    if (!subject || !description) return Alert.alert('Error', 'Please fill all fields');
    try {
      setLoading(true);
      await fetchWithAuth('/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, description, category, priority })
      });
      setNewModal(false);
      setSubject(''); setDescription('');
      loadTickets();
      Alert.alert('Success', 'Support ticket created successfully!');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}>
        <Text style={s.title}>Support Tickets</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setNewModal(true)}>
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={tickets} 
        keyExtractor={t => t._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTickets} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}><LifeBuoy color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.tSubject} numberOfLines={1}>{item.subject}</Text>
                <Text style={s.tDate}>{formatDate(item.createdAt)} • {item.category}</Text>
              </View>
              <Badge label={item.status} color={statusColors[item.status] || 'gray'} />
            </View>
            <View style={s.cardBottom}>
              <Text style={s.tDesc} numberOfLines={2}>{item.description}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No support tickets found</Text></View>}
      />

      <Modal visible={newModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.mHeader}>
              <Text style={s.modalTitle}>New Support Ticket</Text>
              <TouchableOpacity onPress={() => setNewModal(false)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>

            <Text style={s.label}>Subject</Text>
            <TextInput style={s.input} placeholder="Brief issue description" placeholderTextColor={Colors.fgDim} value={subject} onChangeText={setSubject} />
            
            <Text style={s.label}>Category</Text>
            <View style={s.pillRow}>
              {['Technical', 'Billing', 'Installation', 'Other'].map(c => (
                <TouchableOpacity key={c} style={[s.pill, category === c && s.pillAct]} onPress={() => setCategory(c)}>
                  <Text style={[s.pillT, category === c && s.pillTAct]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Detailed Description</Text>
            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Explain your issue in detail..." placeholderTextColor={Colors.fgDim} multiline value={description} onChangeText={setDescription} />

            <Button title="Submit Ticket" onPress={createTicket} size="lg" loading={loading} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  tSubject: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  tDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  cardBottom: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  tDesc: { fontSize: 13, color: Colors.fgSecondary, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  label: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 14, color: Colors.fgPrimary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border },
  pillAct: { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary },
  pillT: { fontSize: 12, fontWeight: '700', color: Colors.fgMuted },
  pillTAct: { color: Colors.primary },
});
