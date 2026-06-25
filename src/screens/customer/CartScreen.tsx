import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, Alert, Modal, ScrollView, TextInput, Platform } from 'react-native';
import { Trash2, Plus, Minus, CreditCard, ArrowRight, ShoppingCart, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';

export default function CartScreen({ navigation }: any) {
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const gstAmount = cartTotal * 0.18;
  const grandTotal = cartTotal + gstAmount;
  const [loading, setLoading] = useState(false);
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationObj, setLocationObj] = useState<any>(null);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  const getLocation = async () => {
    setFetchingLoc(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to fetch live location.');
        setFetchingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocationObj({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setFetchingLoc(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setScheduledDate(selectedDate);
  };

  const checkout = async () => {
    try { 
      setLoading(true);
      const payload = {
        products: cart.map(i => ({ product: i.product._id, quantity: i.quantity })),
        deliveryAddress: deliveryAddress.trim() || 'Store Pickup',
        scheduledDate: scheduledDate.toISOString(),
        paymentMethod: paymentMethod,
        locationDetails: locationObj
      };
      await fetchWithAuth('/orders', { method: 'POST', body: JSON.stringify(payload) }); 
      await clearCart();
      setInvoiceVisible(false);
      Alert.alert('Success', 'Order placed successfully!'); 
      navigation.navigate('Orders');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  if (!cart.length) return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>My Cart</Text></View>
      <View style={s.empty}><ShoppingCart size={48} color={Colors.fgDim} /><Text style={s.emptyT}>Your cart is empty</Text>
        <Button title="Browse Products" onPress={() => navigation.navigate('Products')} style={{ marginTop: 16 }} />
      </View>
    </View>
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>My Cart</Text><Text style={s.count}>{cart.length} items</Text></View>
      <FlatList data={cart} keyExtractor={i => i.product?._id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Image source={{ uri: getImageUrl(item.product?.image || item.product?.images?.[0]) }} style={s.img} />
            <View style={s.info}>
              <Text style={s.name} numberOfLines={1}>{item.product?.name}</Text>
              <Text style={s.price}>₹{item.product?.price?.toLocaleString()}</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(item.product._id, item.quantity - 1)}><Minus color={Colors.fgPrimary} size={14} /></TouchableOpacity>
                <Text style={s.qtyT}>{item.quantity}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(item.product._id, item.quantity + 1)}><Plus color={Colors.fgPrimary} size={14} /></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={s.delBtn} onPress={() => removeFromCart(item.product._id)}><Trash2 color={Colors.danger} size={18} /></TouchableOpacity>
          </View>
        )} />
      <View style={s.footer}>
        <View style={s.totRow}><Text style={s.totL}>Subtotal:</Text><Text style={s.totV}>₹{cartTotal.toLocaleString()}</Text></View>
        <View style={s.totRow}><Text style={s.totL}>GST (18%):</Text><Text style={[s.totV, { fontSize: 16, color: Colors.fgSecondary }]}>₹{Math.round(gstAmount).toLocaleString()}</Text></View>
        <View style={[s.totRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 }]}><Text style={[s.totL, { color: Colors.fgPrimary }]}>Grand Total:</Text><Text style={s.totV}>₹{Math.round(grandTotal).toLocaleString()}</Text></View>
        <Button title={loading ? "Processing..." : "Proceed to Pay"} onPress={() => { if (!user) { navigation.navigate('Login'); return; } if (user?.role === 'admin' || user?.role === 'technician') { Alert.alert('Access Denied', 'Administrators and Technicians are not permitted to place product orders.'); return; } setInvoiceVisible(true); }} icon={<CreditCard color="#fff" size={16} />} size="lg" disabled={loading} style={{ marginTop: 8 }} />
      </View>

      <Modal visible={invoiceVisible} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>Order Invoice</Text>
              <TouchableOpacity onPress={() => setInvoiceVisible(false)}><Text style={s.closeT}>Close</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              
              <View style={s.inputSection}>
                <Text style={s.inputLabel}>Delivery Address / Location</Text>
                <TextInput style={s.input} placeholder="Enter your full address" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholderTextColor={Colors.fgDim} multiline />
                
                <Text style={s.inputLabel}>Scheduled Date</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Calendar color={Colors.fgMuted} size={18} />
                  <Text style={s.dateBtnT}>{scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker value={scheduledDate} mode="date" display="default" minimumDate={new Date()} onChange={handleDateChange} />
                )}
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={s.summaryTitle}>Live Location (Optional)</Text>
                {locationObj ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successFaint, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.success }}>
                    <MapPin color={Colors.success} size={20} style={{ marginRight: 8 }} />
                    <Text style={{ color: Colors.success, fontWeight: '700' }}>Location Captured Successfully</Text>
                  </View>
                ) : (
                  <Button 
                    title={fetchingLoc ? "Fetching Location..." : "Capture Current Location"} 
                    onPress={getLocation} 
                    variant="secondary" 
                    disabled={fetchingLoc} 
                  />
                )}
              </View>

              <View style={s.summaryBox}>
                <Text style={s.summaryTitle}>Bill Summary</Text>
                {cart.map((item, i) => (
                  <View key={i} style={s.sumRow}>
                    <Text style={s.sumName} numberOfLines={1}>{item.quantity}x {item.product?.name}</Text>
                    <Text style={s.sumPrice}>₹{(item.product?.price * item.quantity).toLocaleString()}</Text>
                  </View>
                ))}
                <View style={[s.sumRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 }]}>
                  <Text style={s.sumTotL}>Subtotal</Text>
                  <Text style={s.sumTotV}>₹{cartTotal.toLocaleString()}</Text>
                </View>
                <View style={s.sumRow}>
                  <Text style={[s.sumTotL, { color: Colors.fgMuted, fontSize: 12 }]}>GST (18%)</Text>
                  <Text style={[s.sumTotV, { fontSize: 14, color: Colors.fgSecondary }]}>₹{Math.round(gstAmount).toLocaleString()}</Text>
                </View>
                <View style={[s.sumRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 }]}>
                  <Text style={s.sumTotL}>Grand Total</Text>
                  <Text style={s.sumTotV}>₹{Math.round(grandTotal).toLocaleString()}</Text>
                </View>
              </View>

              <View style={s.payMethods}>
                <View style={[s.payBtn, s.payBtnAct]}>
                  <Text style={[s.payBtnT, s.payBtnActT]}>Cash on Delivery</Text>
                </View>
              </View>

              <Button 
                title={loading ? "Processing..." : `Confirm & Place Order`} 
                onPress={checkout} 
                size="lg" 
                disabled={loading} 
                style={{ marginTop: 20 }} 
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  count: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyT: { fontSize: 16, fontWeight: '800', color: Colors.fgMuted },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  img: { width: 70, height: 70, borderRadius: 12, backgroundColor: Colors.bgMuted, marginRight: 12 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyT: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  delBtn: { padding: 10 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border, padding: 20, paddingBottom: 30, gap: 16 },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totL: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totV: { fontSize: 24, fontWeight: '900', color: Colors.primaryLight },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  closeT: { fontSize: 14, fontWeight: '800', color: Colors.danger },
  qrSection: { alignItems: 'center', backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 20 },
  qrImg: { width: 140, height: 140, marginBottom: 12 },
  qrT: { fontSize: 14, fontWeight: '800', color: '#000' },
  scanT: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 4 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fgPrimary },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, gap: 10 },
  dateBtnT: { fontSize: 14, color: Colors.fgPrimary, fontWeight: '600' },
  summaryBox: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumName: { fontSize: 13, color: Colors.fgSecondary, flex: 1, paddingRight: 12 },
  sumPrice: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  sumTotL: { fontSize: 14, fontWeight: '900', color: Colors.fgPrimary },
  sumTotV: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight },
  payMethods: { flexDirection: 'row', gap: 12 },
  payBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  payBtnAct: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  payBtnT: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted },
  payBtnActT: { color: '#fff' },
  verifyBtn: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.warning, alignItems: 'center', backgroundColor: Colors.warningFaint },
  verifyBtnAct: { backgroundColor: Colors.success, borderColor: Colors.success },
  verifyBtnT: { fontSize: 13, fontWeight: '800', color: Colors.warning },
  verifyBtnActT: { color: '#fff' }
});
