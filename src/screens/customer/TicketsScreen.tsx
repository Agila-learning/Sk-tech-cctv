import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { LifeBuoy, Plus, X, Paperclip, CheckCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import { fetchWithAuth } from '../../api/client';
import { Badge, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const statusColors: any = { Open: 'amber', 'In Progress': 'blue', Resolved: 'green', Closed: 'gray' };

const statusIcons: any = {
  Open: AlertCircle,
  'In Progress': Clock,
  Resolved: CheckCircle,
  Closed: CheckCircle,
};

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [photo, setPhoto] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadTickets = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await fetchWithAuth('/tickets/my');
      setTickets(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) loadTickets(); else setLoading(false); }, [isAuthenticated]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission required', 'We need media library permissions to upload an image.');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const createTicket = async () => {
    if (!subject || !description) return Alert.alert('Error', 'Please fill all fields');
    try {
      setLoading(true);
      await fetchWithAuth('/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, description, category, priority, photoUrl: photo || null })
      });
      setNewModal(false);
      setSubject(''); setDescription(''); setPhoto(null);
      loadTickets();
      Alert.alert('Success', 'Support ticket created successfully!');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };
  const formatDateTime = (d: string) => { try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return 'N/A'; } };

  const getStageColor = (status: string) => {
    if (status === 'Resolved' || status === 'Closed') return Colors.success;
    if (status === 'In Progress') return Colors.primary;
    return Colors.warning;
  };

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
          <TouchableOpacity style={s.card} onPress={() => setDetailModal(item)}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}><LifeBuoy color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.tSubject} numberOfLines={1}>{item.subject}</Text>
                <Text style={s.tDate}>{formatDate(item.createdAt)} • {item.category}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Badge label={item.status} color={statusColors[item.status] || 'gray'} />
                <ChevronRight color={Colors.fgMuted} size={16} />
              </View>
            </View>
            <View style={s.cardBottom}>
              <Text style={s.tDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            {/* Stage Progress Bar */}
            <View style={s.stageRow}>
              {['Open', 'In Progress', 'Resolved', 'Closed'].map((stage, idx) => {
                const stageIndex = ['Open', 'In Progress', 'Resolved', 'Closed'].indexOf(item.status);
                const isDone = idx <= stageIndex;
                return (
                  <View key={stage} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={[s.stageDot, { backgroundColor: isDone ? getStageColor(item.status) : Colors.bgMuted, borderColor: isDone ? getStageColor(item.status) : Colors.border }]} />
                    <Text style={[s.stageLabel, { color: isDone ? getStageColor(item.status) : Colors.fgDim }]} numberOfLines={1}>{stage.split(' ')[0]}</Text>
                    {idx < 3 && <View style={[s.stageLine, { backgroundColor: idx < stageIndex ? getStageColor(item.status) : Colors.border }]} />}
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No support tickets found</Text></View>}
      />

      {/* Detail Modal — Stage-wise View */}
      <Modal visible={!!detailModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={[s.modalContainer, { maxHeight: '92%' }]}>
            <View style={s.mHeader}>
              <Text style={s.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setDetailModal(null)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 32 }}>
              {/* Header Info */}
              <View style={s.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.detailSubject}>{detailModal?.subject}</Text>
                  <Text style={s.detailMeta}>{detailModal?.category} • Priority: {detailModal?.priority}</Text>
                  <Text style={s.detailMeta}>Opened: {formatDate(detailModal?.createdAt)}</Text>
                </View>
                <Badge label={detailModal?.status || 'Open'} color={statusColors[detailModal?.status] || 'gray'} />
              </View>

              {/* Description */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>Description</Text>
                <View style={s.descBox}>
                  <Text style={s.descText}>{detailModal?.description}</Text>
                </View>
              </View>

              {/* Assigned To */}
              {detailModal?.assignedTo && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Assigned Technician</Text>
                  <View style={s.assignedBox}>
                    <View style={s.assignedAvatar}>
                      <Text style={s.assignedInitial}>{detailModal.assignedTo?.name?.charAt(0) || 'T'}</Text>
                    </View>
                    <Text style={s.assignedName}>{detailModal.assignedTo?.name || 'Technician'}</Text>
                  </View>
                </View>
              )}

              {/* Stage Timeline */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>Stage History</Text>
                {detailModal?.history && detailModal.history.length > 0 ? (
                  <View style={s.timeline}>
                    {detailModal.history.map((h: any, idx: number) => {
                      const isLast = idx === detailModal.history.length - 1;
                      const StageIcon = statusIcons[h.status] || Clock;
                      const stageColor = getStageColor(h.status);
                      return (
                        <View key={idx} style={s.timelineItem}>
                          {/* Dot + Line */}
                          <View style={s.timelineLeft}>
                            <View style={[s.timelineDot, { backgroundColor: stageColor }]}>
                              <StageIcon color="#fff" size={10} />
                            </View>
                            {!isLast && <View style={s.timelineConnector} />}
                          </View>
                          {/* Content */}
                          <View style={[s.timelineContent, !isLast && { paddingBottom: 20 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <Text style={[s.timelineStatus, { color: stageColor }]}>{h.status}</Text>
                            </View>
                            {h.comment && <Text style={s.timelineComment}>{h.comment}</Text>}
                            <Text style={s.timelineDate}>{formatDateTime(h.updatedAt)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={s.descBox}>
                    <Text style={{ color: Colors.fgMuted, fontSize: 14, fontStyle: 'italic' }}>No stage history yet. Ticket is open.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Ticket Modal */}
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

            <Text style={s.label}>Priority</Text>
            <View style={s.pillRow}>
              {['Low', 'Medium', 'High'].map(p => (
                <TouchableOpacity key={p} style={[s.pill, priority === p && s.pillAct]} onPress={() => setPriority(p)}>
                  <Text style={[s.pillT, priority === p && s.pillTAct]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Detailed Description</Text>
            <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Explain your issue in detail..." placeholderTextColor={Colors.fgDim} multiline value={description} onChangeText={setDescription} />
            
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginTop: 12, marginBottom: 20 }} onPress={pickImage}>
              <Paperclip color={Colors.primary} size={20} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: photo ? Colors.success : Colors.primary, marginLeft: 10 }}>{photo ? 'Photo Attached ✅' : 'Attach Photo / Screenshot'}</Text>
            </TouchableOpacity>

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
  cardBottom: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 12 },
  tDesc: { fontSize: 13, color: Colors.fgSecondary, lineHeight: 20 },
  // Stage progress
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  stageDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, marginBottom: 4 },
  stageLine: { position: 'absolute', top: 4, left: '50%', right: '-50%', height: 2 },
  stageLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
  // Modals
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
  // Detail Modal
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  detailSubject: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 4 },
  detailMeta: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  descBox: { backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
  descText: { fontSize: 14, color: Colors.fgSecondary, lineHeight: 22 },
  assignedBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  assignedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  assignedInitial: { fontSize: 16, fontWeight: '900', color: '#fff' },
  assignedName: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  // Timeline
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: Colors.border, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 4 },
  timelineStatus: { fontSize: 14, fontWeight: '900' },
  timelineComment: { fontSize: 13, color: Colors.fgSecondary, marginTop: 2, lineHeight: 20 },
  timelineDate: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 4 },
});
