import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Package, Clock, CheckCircle, Truck, ChevronRight, Activity, MapPin } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

const statusColors: Record<string, 'blue' | 'amber' | 'green' | 'red' | 'gray' | 'purple'> = {
  pending: 'amber', confirmed: 'blue', processing: 'blue', shipped: 'purple', delivered: 'green', completed: 'green', cancelled: 'red',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [trackOrder, setTrackOrder] = useState<any>(null);

  const submitReview = async () => {
    try {
      setLoading(true);
      await fetchWithAuth(`/reviews`, { 
        method: 'POST', 
        body: JSON.stringify({ orderId: reviewOrder._id, rating, comment }) 
      });
      Alert.alert('Success', 'Review submitted successfully!');
      setReviewOrder(null);
      loadOrders();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/orders/my-orders');
      setOrders(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = orders.filter(o => tab === 'active' ? !['delivered', 'completed', 'cancelled'].includes(o.status) : ['delivered', 'completed', 'cancelled'].includes(o.status));

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}><Text style={s.title}>My Orders</Text></View>
      <View style={s.tabs}>
        {(['active', 'past'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabT, tab === t && s.tabTActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={o => o._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card}>
            <View style={s.cardTop}>
              <View style={s.orderIcon}><Package color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.orderId}>Order #{item._id?.slice(-6)}</Text>
                <Text style={s.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Badge label={item.status} color={statusColors[item.status] || 'gray'} />
            </View>
            <View style={s.cardBottom}>
              <Text style={s.itemCount}>{item.products?.length || 0} items</Text>
              <Text style={s.total}>₹{item.totalAmount?.toLocaleString()}</Text>
            </View>
            {item.status === 'completed' && !item.feedback?.rating && (
              <Button title={`Rate ${item.technician?.name || 'Technician'}`} onPress={() => { setReviewOrder(item); setRating(5); setComment(''); }} style={{ marginTop: 12 }} size="sm" variant="secondary" />
            )}
            {item.status !== 'completed' && item.status !== 'delivered' && item.status !== 'cancelled' && (
              <Button title="Track Status" onPress={() => setTrackOrder(item)} style={{ marginTop: 12 }} size="sm" variant="secondary" />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No orders yet</Text></View>}
      />

      <Modal visible={!!reviewOrder} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Rate Your Experience</Text>
            <Text style={s.modalSub}>Order #{reviewOrder?._id?.slice(-6)}</Text>
            
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Text style={[s.star, rating >= i ? s.starActive : null]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.input}
              placeholder="Leave a comment (optional)"
              placeholderTextColor={Colors.fgMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            <View style={s.modalActions}>
              <Button title="Cancel" onPress={() => setReviewOrder(null)} variant="secondary" style={{ flex: 1 }} />
              <Button title="Submit" onPress={submitReview} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Tracking Modal */}
      <Modal visible={!!trackOrder} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Order Tracking</Text>
            <Text style={s.modalSub}>Order #{trackOrder?._id?.slice(-6)}</Text>
            
            <View style={s.trackBox}>
              {['pending', 'accepted', 'in_progress', 'completed'].map((stage, idx) => {
                // Determine if stage is active or passed based on trackingTimeline or simple logic
                const isActive = trackOrder?.status === stage || 
                                 (stage === 'pending') || 
                                 (stage === 'accepted' && ['in_progress', 'completed'].includes(trackOrder?.status)) ||
                                 (stage === 'in_progress' && trackOrder?.status === 'completed');
                
                return (
                  <View key={stage} style={s.trackRow}>
                    <View style={s.trackLineBox}>
                      <View style={[s.trackDot, isActive && s.trackDotActive]} />
                      {idx < 3 && <View style={[s.trackLine, isActive && s.trackLineActive]} />}
                    </View>
                    <View style={s.trackContent}>
                      <Text style={[s.trackStageT, isActive && s.trackStageTAct]}>
                        {stage.replace('_', ' ').toUpperCase()}
                      </Text>
                      {isActive && <Text style={s.trackStageSub}>{idx === 0 ? 'Order received' : idx === 1 ? `${trackOrder?.technician?.name || 'Technician'} assigned` : idx === 2 ? `${trackOrder?.technician?.name || 'Technician'} on-site` : 'Service completed'}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            <Button title="Close Tracking" onPress={() => setTrackOrder(null)} style={{ marginTop: 24 }} size="lg" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.bgMuted, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabT: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  tabTActive: { color: '#fff' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  orderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  orderDate: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  itemCount: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  total: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, textAlign: 'center' },
  modalSub: { fontSize: 12, color: Colors.fgMuted, textAlign: 'center', marginTop: 4 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 24 },
  star: { fontSize: 40, color: Colors.border },
  starActive: { color: Colors.warning },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 14, color: Colors.fgPrimary, height: 100, textAlignVertical: 'top', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  trackBox: { marginTop: 24, paddingHorizontal: 12 },
  trackRow: { flexDirection: 'row', gap: 16, minHeight: 70 },
  trackLineBox: { alignItems: 'center', width: 20 },
  trackDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.border, zIndex: 2 },
  trackDotActive: { backgroundColor: Colors.primary },
  trackLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: -2, marginBottom: -2 },
  trackLineActive: { backgroundColor: Colors.primary },
  trackContent: { flex: 1, paddingBottom: 24, marginTop: -4 },
  trackStageT: { fontSize: 14, fontWeight: '800', color: Colors.fgMuted },
  trackStageTAct: { color: Colors.fgPrimary },
  trackStageSub: { fontSize: 12, color: Colors.fgMuted, marginTop: 4 },
});
