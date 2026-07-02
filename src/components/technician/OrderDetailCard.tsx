import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  MessageCircle,
  MapPin,
  Navigation,
  Package,
  Calendar,
  Clock,
  User,
  Shield,
  Camera,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { getImageUrl } from '../../api/client';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MAP_HEIGHT = 200;

interface OrderDetailCardProps {
  order: any;
  navigation: any;
}

export default function OrderDetailCard({ order, navigation }: OrderDetailCardProps) {
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const mapRef = useRef<MapView>(null);

  const phone = order.contactNumber || order.customer?.phone;
  const altPhone = order.alternatePhone || order.customer?.alternatePhone;
  const address = order.deliveryAddress || order.customer?.address;
  const customerName = order.customerName || order.customer?.name || 'Customer';
  const orderedAt = order.createdAt ? new Date(order.createdAt) : null;
  const products = order.products || [];

  useEffect(() => {
    if (!address) return;
    const geocodeAddress = async () => {
      setGeocoding(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'SKTechApp/1.0' } });
        const data = await res.json();
        if (data && data[0]) {
          setGeocoded({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (e) {
        // silent
      } finally {
        setGeocoding(false);
      }
    };
    geocodeAddress();
  }, [address]);

  const openMaps = () => {
    if (!address) return;
    const q = encodeURIComponent(address);
    const url = Platform.OS === 'ios' ? `maps:0,0?q=${q}` : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`));
  };

  const openDirections = () => {
    if (!address) return;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`);
  };

  const callCustomer = (num: string) => {
    if (!num) return Alert.alert('No Number', 'Phone number not available.');
    Linking.openURL(`tel:${num}`).catch(() => Alert.alert('Error', 'Could not open dialer'));
  };

  const openWhatsApp = () => {
    if (!phone) return;
    const msg = encodeURIComponent(`Hello ${customerName}, regarding your Order #${order._id?.slice(-6)}. We are on our way. Thank you - SK Technology.`);
    Linking.openURL(`whatsapp://send?phone=${phone.replace(/\D/g, '')}&text=${msg}`).catch(() => Alert.alert('Error', 'Could not open WhatsApp'));
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const warrantyStart = new Date(order.warrantyStartDate || order.updatedAt || order.createdAt || Date.now());
  const warrantyEnd = new Date(warrantyStart);
  const wMonths = parseInt(((order.warrantyPeriod || '12').match(/\d+/) || ['12'])[0], 10);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + wMonths);
  const daysLeft = Math.ceil((warrantyEnd.getTime() - Date.now()) / 86400000);
  const warrantyExpired = daysLeft <= 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{customerName}</Text>
          <Text style={styles.headerSub}>Order #{order._id?.slice(-6)} · {(order.status || 'assigned').replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
        {expanded ? <ChevronUp color={Colors.fgMuted} size={20} /> : <ChevronDown color={Colors.fgMuted} size={20} />}
      </TouchableOpacity>

      {expanded && (
        <>
          {/* Date & Time Row */}
          <View style={styles.dateTimeRow}>
            <View style={styles.pill}>
              <Calendar color={Colors.primary} size={13} />
              <Text style={styles.pillText}>{orderedAt ? formatDate(orderedAt) : 'N/A'}</Text>
            </View>
            <View style={styles.pill}>
              <Clock color={Colors.primary} size={13} />
              <Text style={styles.pillText}>{orderedAt ? formatTime(orderedAt) : 'N/A'}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: warrantyExpired ? Colors.danger + '20' : Colors.success + '20' }]}>
              <Shield color={warrantyExpired ? Colors.danger : Colors.success} size={13} />
              <Text style={[styles.pillText, { color: warrantyExpired ? Colors.danger : Colors.success }]}>
                {warrantyExpired ? 'Warranty Exp.' : `${daysLeft}d warranty`}
              </Text>
            </View>
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User color={Colors.primary} size={14} />
              <Text style={styles.sectionLabel}>Customer Details</Text>
            </View>
            <Text style={styles.custName}>{customerName}</Text>
            {order.customer?.email ? <Text style={styles.custEmail}>{order.customer.email}</Text> : null}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '40' }]} onPress={() => callCustomer(phone)}>
                <Phone color={Colors.primary} size={16} />
                <View>
                  <Text style={[styles.actionBtnLabel, { color: Colors.primary }]}>Call</Text>
                  {phone ? <Text style={[styles.actionBtnSub, { color: Colors.primary + 'aa' }]}>{phone}</Text> : null}
                </View>
              </TouchableOpacity>
              {altPhone ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '40' }]} onPress={() => callCustomer(altPhone)}>
                  <Phone color={Colors.warning} size={16} />
                  <View>
                    <Text style={[styles.actionBtnLabel, { color: Colors.warning }]}>Alt Call</Text>
                    <Text style={[styles.actionBtnSub, { color: Colors.warning + 'aa' }]}>{altPhone}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDark]} onPress={() => navigation.navigate('OrderChat', { orderId: order._id, orderStatus: order.status, customerName })}>
                <MessageCircle color="#fff" size={16} />
                <Text style={[styles.actionBtnLabel, { color: '#fff' }]}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D36620', borderColor: '#25D36660' }]} onPress={openWhatsApp}>
                <Text style={{ fontSize: 16 }}>??</Text>
                <Text style={[styles.actionBtnLabel, { color: '#128C7E' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Map */}
          {address ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin color={Colors.primary} size={14} />
                <Text style={styles.sectionLabel}>Site Location</Text>
              </View>
              <Text style={styles.addressText}>{address}</Text>

              <View style={styles.mapWrapper}>
                {geocoding && (
                  <View style={styles.mapCenter}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                    <Text style={{ color: Colors.fgMuted, fontSize: 12, marginTop: 6 }}>Loading map...</Text>
                  </View>
                )}
                {!geocoding && geocoded && (
                  <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{ latitude: geocoded.lat, longitude: geocoded.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
                    scrollEnabled
                    zoomEnabled
                    pitchEnabled={false}
                  >
                    <Marker coordinate={{ latitude: geocoded.lat, longitude: geocoded.lng }} title={customerName} description={address} />
                  </MapView>
                )}
                {!geocoding && !geocoded && (
                  <View style={styles.mapCenter}>
                    <MapPin color={Colors.fgMuted} size={32} />
                    <Text style={{ color: Colors.fgMuted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>Map unavailable for this address</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDark]} onPress={openDirections}>
                  <Navigation color="#fff" size={15} />
                  <Text style={[styles.actionBtnLabel, { color: '#fff' }]}>Navigate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '40' }]} onPress={openMaps}>
                  <MapPin color={Colors.primary} size={15} />
                  <Text style={[styles.actionBtnLabel, { color: Colors.primary }]}>Open Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Products */}
          {products.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Package color={Colors.primary} size={14} />
                <Text style={styles.sectionLabel}>Products / Equipment</Text>
              </View>
              {products.map((p: any, i: number) => (
                <View key={i} style={[styles.productRow, i < products.length - 1 && styles.productRowBorder]}>
                  {p.product?.images?.[0] ? (
                    <Image source={{ uri: getImageUrl(p.product.images[0]) }} style={styles.productImg} />
                  ) : (
                    <View style={[styles.productImg, styles.productImgPlaceholder]}>
                      <Package color={Colors.fgMuted} size={18} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName} numberOfLines={2}>{p.product?.name || 'Product'}</Text>
                    <Text style={styles.productMeta}>Qty: {p.quantity || 1}{p.price ? ` · ?${(p.price * (p.quantity || 1)).toLocaleString()}` : ''}</Text>
                    {p.product?.brand ? <Text style={styles.productBrand}>{p.product.brand}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Camera Details */}
          {order.cameraDetails ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Camera color={Colors.primary} size={14} />
                <Text style={styles.sectionLabel}>Camera / Equipment Notes</Text>
              </View>
              <Text style={styles.notesText}>{order.cameraDetails}</Text>
            </View>
          ) : null}

          {/* Warranty & Service Grid */}
          <View style={[styles.section, { borderColor: warrantyExpired ? Colors.danger + '40' : Colors.success + '40', backgroundColor: warrantyExpired ? Colors.danger + '08' : Colors.success + '08' }]}>
            <View style={styles.sectionHeader}>
              <Shield color={warrantyExpired ? Colors.danger : Colors.success} size={14} />
              <Text style={[styles.sectionLabel, { color: warrantyExpired ? Colors.danger : Colors.success }]}>Warranty & Service Info</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Service Type</Text>
                <Text style={styles.infoCellValue}>{order.serviceType || order.category || 'CCTV Service'}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Order Type</Text>
                <Text style={styles.infoCellValue}>{order.orderType || 'Standard'}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Warranty Period</Text>
                <Text style={styles.infoCellValue}>{order.warrantyPeriod || '12 Months'}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Warranty Until</Text>
                <Text style={styles.infoCellValue}>{formatDate(warrantyEnd)}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Payment</Text>
                <Text style={styles.infoCellValue}>{(order.paymentMethod || 'N/A').toUpperCase()}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Total Amount</Text>
                <Text style={styles.infoCellValue}>?{(order.totalAmount || 0).toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.warrantyTag, { backgroundColor: warrantyExpired ? Colors.danger + '20' : Colors.success + '20' }]}>
              <Text style={[styles.warrantyTagText, { color: warrantyExpired ? Colors.danger : Colors.success }]}>
                {warrantyExpired ? '? PAID SERVICE — Warranty has expired' : '? FREE WARRANTY SERVICE eligible'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {(order.notes || order.customer?.notes) ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Info color={Colors.warning} size={14} />
                <Text style={[styles.sectionLabel, { color: Colors.warning }]}>Special Instructions</Text>
              </View>
              <Text style={styles.notesText}>{order.notes || order.customer?.notes}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bgSurface },
  headerTitle: { fontSize: 17, fontWeight: '900', color: Colors.fgPrimary },
  headerSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryFaint, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  section: { margin: 12, marginTop: 8, padding: 14, backgroundColor: Colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  custName: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  custEmail: { fontSize: 13, color: Colors.fgMuted, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  actionBtnDark: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionBtnLabel: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  actionBtnSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  addressText: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '600', lineHeight: 20 },
  mapWrapper: { height: MAP_HEIGHT, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  map: { flex: 1 },
  mapCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  productRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border + '60' },
  productImg: { width: 52, height: 52, borderRadius: 10 },
  productImgPlaceholder: { backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  productName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  productMeta: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  productBrand: { fontSize: 11, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  notesText: { fontSize: 13, color: Colors.fgPrimary, lineHeight: 20, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCell: { width: '46%' },
  infoCellLabel: { fontSize: 11, color: Colors.fgMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoCellValue: { fontSize: 13, color: Colors.fgPrimary, fontWeight: '800' },
  warrantyTag: { padding: 10, borderRadius: 10, alignItems: 'center' },
  warrantyTagText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
});
