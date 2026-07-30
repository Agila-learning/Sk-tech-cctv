import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Modal, TextInput, Alert, Image, Linking } from 'react-native';
import { Package, Clock, CheckCircle, Truck, ChevronRight, Activity, MapPin, Phone, MessageCircle, LifeBuoy, Search, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import AuthGuardModal from '../../components/auth/AuthGuardModal';

const statusColors: Record<string, 'blue' | 'amber' | 'green' | 'red' | 'gray' | 'purple'> = {
  pending: 'amber', confirmed: 'blue', processing: 'blue', shipped: 'purple', delivered: 'green', completed: 'green', cancelled: 'red', pending_approval: 'amber', pending_admin_approval: 'amber'
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [search, setSearch] = useState('');
  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [productRating, setProductRating] = useState(5);
  const [installationRating, setInstallationRating] = useState(5);
  const [technicianRating, setTechnicianRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [trackOrder, setTrackOrder] = useState<any>(null);
  const [detailsOrder, setDetailsOrder] = useState<any>(null);
  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const submitReview = async () => {
    try {
      setLoading(true);
      await fetchWithAuth(`/reviews`, { 
        method: 'POST', 
        body: JSON.stringify({ 
          orderId: reviewOrder._id, 
          rating, 
          productRating, 
          installationRating, 
          technicianRating, 
          comment, 
          tipAmount: Number(tipAmount) || 0 
        }) 
      });
      Alert.alert('Success', 'Review submitted successfully!');
      setReviewOrder(null);
      setTipAmount('');
      loadOrders();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleClaimWarranty = async (orderId: string) => {
    try {
      setLoading(true);
      await fetchWithAuth(`/orders/${orderId}/warranty-claim`, { method: 'POST' });
      Alert.alert('Success', 'Warranty claim submitted successfully! You can track the process flow in your Support Tickets.');
      setDetailsOrder(null);
      loadOrders();
      setTab('active');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to claim warranty');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    // Close the details modal first to prevent Alert from being hidden behind it on Android
    setDetailsOrder(null);
    setTimeout(() => {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          { 
            text: 'No', 
            style: 'cancel',
            onPress: () => {
              // Reopen the modal if user changes their mind
              const order = orders.find(o => o._id === orderId);
              if (order) setDetailsOrder(order);
            }
          },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await fetchWithAuth(`/orders/${orderId}/cancel`, { method: 'PATCH' });
                Alert.alert('Success', 'Order cancelled successfully');
                loadOrders();
              } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to cancel order');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    }, 300);
  };

  const loadOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setShowAuthGuard(true);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchWithAuth('/orders');
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) loadOrders(); else setLoading(false); }, [isAuthenticated]);

  useEffect(() => {
    if (socket) {
      socket.on('order_updated', loadOrders);
      socket.on('task_updated', loadOrders);
      return () => {
        socket.off('order_updated', loadOrders);
        socket.off('task_updated', loadOrders);
      };
    }
  }, [socket]);

  const cleanSearch = search.trim().replace(/^#/, '').toLowerCase();
  const filtered = orders.filter(o => tab === 'active' ? !['delivered', 'completed', 'cancelled'].includes(o.status) : ['delivered', 'completed', 'cancelled'].includes(o.status)).filter(o => 
    (o._id || '').toLowerCase().includes(cleanSearch) || 
    (o.products?.[0]?.product?.name || '').toLowerCase().includes(cleanSearch)
  );

  const formatDate = (d: string) => { try { return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return 'N/A'; } };

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
      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <Search color={Colors.fgDim} size={18} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by Order ID or Product Name..."
            placeholderTextColor={Colors.fgMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X color={Colors.fgMuted} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <FlatList data={filtered} keyExtractor={o => o._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[s.card, { borderColor: statusColors[item.status] ? `${statusColors[item.status]}40` : Colors.border }]} 
            onPress={() => setDetailsOrder(item)}
          >
            <View style={s.cardTop}>
              {item.products?.[0]?.product?.images?.[0] ? (
                <Image source={{ uri: getImageUrl(item.products[0].product.images[0]) }} style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12, backgroundColor: Colors.borderLight }} />
              ) : (
                <View style={s.orderIcon}><Package color={Colors.primaryLight} size={20} /></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.orderId} numberOfLines={1}>{item.products?.[0]?.product?.name || `Order #${item._id?.slice(-6)}`}</Text>
                <Text style={s.orderDate}>Booked: {formatDate(item.createdAt)}</Text>
              </View>
              <Badge label={item.status} color={statusColors[item.status] || 'gray'} />
            </View>
            <View style={s.cardMid}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Technician:</Text>
                <Text style={s.infoValue}>{item.technician?.name || 'Awaiting Assignment'}</Text>
              </View>
              {item.scheduledDate && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Service Date:</Text>
                  <Text style={s.infoValue}>{formatDate(item.scheduledDate)}</Text>
                </View>
              )}
            </View>
            <View style={s.cardBottom}>
              <Text style={s.itemCount}>{item.products?.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0) || 0} items</Text>
              <Text style={s.total}>₹{item.totalAmount?.toLocaleString()}</Text>
            </View>
            {item.status === 'completed' && !item.feedback?.rating && (
              <Button title={`Rate ${item.technician?.name || 'Technician'}`} onPress={() => { setReviewOrder(item); setRating(5); setProductRating(5); setInstallationRating(5); setTechnicianRating(5); setComment(''); }} style={{ marginTop: 12 }} size="sm" variant="secondary" />
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              {item.status !== 'completed' && item.status !== 'delivered' && item.status !== 'cancelled' && (
                <Button title="Track Status" onPress={() => setTrackOrder(item)} size="sm" variant="secondary" style={{ flex: 1 }} />
              )}
              <Button 
                title="Chat with Tech/Admin" 
                onPress={() => navigation.navigate('OrderChat', { orderId: item._id, orderStatus: item.status, customerName: item.customerName || item.customer?.name || user?.name })} 
                size="sm" 
                style={{ flex: 1 }} 
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No orders yet</Text></View>}
      />

      <Modal visible={!!reviewOrder} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Rate Your Experience</Text>
            <Text style={s.modalSub}>Order #{reviewOrder?._id?.slice(-6)}</Text>
            
            <Text style={{fontSize: 12, fontWeight: '700', color: Colors.fgMuted, marginTop: 12, textAlign: 'center'}}>Overall Rating</Text>
            <View style={[s.stars, {marginVertical: 4}]}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Text style={[s.star, rating >= i ? s.starActive : null, {fontSize: 32}]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 10}}>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 10, fontWeight: '700', color: Colors.fgMuted}}>Product</Text>
                <View style={{flexDirection: 'row'}}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setProductRating(i)}>
                      <Text style={[s.star, productRating >= i ? s.starActive : null, {fontSize: 22, marginHorizontal: -2}]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 10, fontWeight: '700', color: Colors.fgMuted}}>Install</Text>
                <View style={{flexDirection: 'row'}}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setInstallationRating(i)}>
                      <Text style={[s.star, installationRating >= i ? s.starActive : null, {fontSize: 22, marginHorizontal: -2}]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 10, fontWeight: '700', color: Colors.fgMuted}}>Tech</Text>
                <View style={{flexDirection: 'row'}}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setTechnicianRating(i)}>
                      <Text style={[s.star, technicianRating >= i ? s.starActive : null, {fontSize: 22, marginHorizontal: -2}]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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

            <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8, alignSelf: 'flex-start' }}>Add a Tip for Technician (₹)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24, height: 48 }}>
              <Text style={{ fontSize: 16, color: Colors.fgMuted, marginRight: 4 }}>₹</Text>
              <TextInput
                style={{ flex: 1, color: Colors.fgPrimary, fontSize: 16 }}
                placeholder="e.g. 50"
                placeholderTextColor={Colors.fgMuted}
                keyboardType="number-pad"
                value={tipAmount}
                onChangeText={setTipAmount}
              />
            </View>

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
            
            {trackOrder?.status !== 'completed' && trackOrder?.status !== 'delivered' && trackOrder?.status !== 'cancelled' && (
              <View style={{ backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 12, marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '30' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', marginBottom: 4 }}>Delivery ETA</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.fgPrimary }}>~ {trackOrder?.status === 'pending' || trackOrder?.status === 'confirmed' ? '3-5 Days' : trackOrder?.status === 'shipped' ? '1-2 Days' : 'Processing...'}</Text>
              </View>
            )}
            
            <View style={s.trackBox}>
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((stage, idx) => {
                const stages = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                const currentIdx = stages.indexOf(trackOrder?.status || 'pending');
                const isPassed = currentIdx >= idx;
                const isActive = currentIdx === idx;
                
                return (
                  <View key={stage} style={s.trackRow}>
                    <View style={s.trackLineBox}>
                      <View style={[s.trackDot, (isActive || isPassed) && s.trackDotActive]} />
                      {idx < 4 && <View style={[s.trackLine, (isPassed && !isActive) && s.trackLineActive]} />}
                    </View>
                    <View style={s.trackContent}>
                      <Text style={[s.trackStageT, (isActive || isPassed) && s.trackStageTAct]}>
                        {stage.toUpperCase()}
                      </Text>
                      {(isActive || isPassed) && <Text style={s.trackStageSub}>
                        {idx === 0 ? 'Order Placed' : idx === 1 ? 'Order Confirmed' : idx === 2 ? 'Packing & Quality Check' : idx === 3 ? 'Handed to Courier' : 'Delivered to you'}
                      </Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            <Button title="Close Tracking" onPress={() => setTrackOrder(null)} style={{ marginTop: 24 }} size="lg" />
          </View>
        </View>
      </Modal>

      {/* Details/Invoice Modal */}
      <Modal visible={!!detailsOrder} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={[s.modalContainer, { maxHeight: '90%' }]}>
            <Text style={s.modalTitle}>Order Details</Text>
            <Text style={s.modalSub}>Order #{detailsOrder?._id?.slice(-6)} • {formatDate(detailsOrder?.createdAt)}</Text>
            
            <FlatList 
              data={detailsOrder?.products || []}
              keyExtractor={(item, idx) => idx.toString()}
              style={{ marginTop: 20, marginBottom: 16 }}
              renderItem={({ item: p }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12 }}>
                  {p.product?.image || p.product?.images?.[0] ? (
                    <Image source={{ uri: getImageUrl(p.product.image || p.product.images[0]) }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Package color={Colors.fgDim} size={24} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.fgPrimary }} numberOfLines={2}>{p.product?.name || 'Product'}</Text>
                    <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 4 }}>Qty: {p.quantity || 1} × ₹{(p.price || 0).toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primaryLight }}>₹{((p.price || 0) * (p.quantity || 1)).toLocaleString()}</Text>
                    <Text style={{ fontSize: 10, color: Colors.fgDim, marginTop: 2 }}>+18% GST Appli.</Text>
                  </View>
                </View>
              )}
            />

            {detailsOrder?.technician ? (
              <View style={{ backgroundColor: Colors.primaryFaint, padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' }}>Assigned Technician</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {detailsOrder.technician.profilePic ? (
                    <Image source={{ uri: getImageUrl(detailsOrder.technician.profilePic) }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{detailsOrder.technician.name?.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.fgPrimary }}>{detailsOrder.technician.name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.fgMuted }}>★ {detailsOrder.technician.rating || 'New'}</Text>
                  </View>
                  {(detailsOrder.status !== 'completed' && detailsOrder.status !== 'cancelled') ? (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${detailsOrder.technician.phone}`).catch(() => console.log('Could not open phone'))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Phone color="#fff" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=+91${detailsOrder.technician.phone}`).catch(() => console.log('Could not open whatsapp'))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle color="#fff" size={18} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:+919600975483`).catch(() => console.log('Could not open phone'))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}>
                      <LifeBuoy color={Colors.fgPrimary} size={14} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.fgPrimary }}>Admin Support</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8 }}>Service Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
                  <LifeBuoy color={Colors.fgMuted} size={20} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.fgPrimary }}>Awaiting Assignment</Text>
                    <Text style={{ fontSize: 12, color: Colors.fgMuted }}>A technician will be assigned soon</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: Colors.fgMuted }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: Colors.fgPrimary }}>₹{detailsOrder?.subtotal?.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: Colors.fgMuted }}>GST (18%)</Text>
                <Text style={{ fontSize: 13, color: Colors.fgPrimary }}>₹{detailsOrder?.gstAmount?.toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.fgPrimary }}>Grand Total</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primaryLight }}>₹{detailsOrder?.totalAmount?.toLocaleString()}</Text>
              </View>
            </View>

            {(() => {
              if (detailsOrder?.status === 'completed' || detailsOrder?.status === 'delivered') {
                const startDate = new Date(detailsOrder.warrantyStartDate || detailsOrder.updatedAt || detailsOrder.createdAt || Date.now());
                const endDate = new Date(startDate);
                const wMatch = (detailsOrder.warrantyPeriod || '12 Months').match(/\d+/);
                endDate.setMonth(endDate.getMonth() + (wMatch ? parseInt(wMatch[0], 10) : 12));
                const isValid = new Date() <= endDate;
                
                if (isValid && !detailsOrder.isWarrantyClaim) {
                  return (
                    <Button 
                      title="Claim Free Warranty Service" 
                      onPress={() => handleClaimWarranty(detailsOrder._id)} 
                      style={{ marginTop: 24, backgroundColor: Colors.success }} 
                      size="lg" 
                    />
                  );
                }
              }
              return null;
            })()}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              {['pending', 'confirmed', 'assigned', 'accepted'].includes(detailsOrder?.status) && (
                <Button title="Cancel Order" onPress={() => handleCancelOrder(detailsOrder._id)} style={{ flex: 1, backgroundColor: Colors.danger }} size="lg" />
              )}
              <Button title="Close" onPress={() => setDetailsOrder(null)} style={{ flex: 1 }} size="lg" variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>

      <AuthGuardModal visible={showAuthGuard} onClose={() => setShowAuthGuard(false)} title="Sign in to View Orders" subtitle="You must be logged in to view and manage your orders and tickets." />
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
  searchContainer: { paddingHorizontal: 20, paddingBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14, gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.fgPrimary, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, padding: 18, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardMid: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12, gap: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  infoValue: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '700' },
  orderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orderId: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 2 },
  orderDate: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
