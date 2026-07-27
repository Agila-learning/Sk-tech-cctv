import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, Alert, TextInput, Platform, TouchableOpacity, FlatList, RefreshControl, Modal, Animated, Easing } from 'react-native';
import { Hammer, Calendar as CalendarIcon, MapPin, X, FileText, Clock, CheckCircle, MessageSquare } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

const statusColors: any = { pending: 'amber', in_progress: 'blue', completed: 'green', cancelled: 'red' };

export default function BookServiceScreen({ route, navigation }: any) {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [tab, setTab] = useState<'request' | 'my-requests'>('request');
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const [serviceType, setServiceType] = useState(route?.params?.initialService || '');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [locationObj, setLocationObj] = useState<any>(null);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(formFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [tab]);

  useEffect(() => {
    if (fetchingLoc) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [fetchingLoc]);

  const loadMyBookings = async () => {
    if (!isAuthenticated) { setLoadingBookings(false); return; }
    try {
      setLoadingBookings(true);
      const data = await fetchWithAuth('/bookings/my');
      setMyBookings(data || []);
    } catch (e) { console.error(e); } finally { setLoadingBookings(false); }
  };

  useEffect(() => {
    if (tab === 'my-requests' && isAuthenticated) {
      loadMyBookings();
    }
  }, [tab, isAuthenticated]);

  const getLocation = async () => {
    try {
      setFetchingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to fetch live location.');
        setFetchingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocationObj({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      
      const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geocode && geocode.length > 0) {
        const p = geocode[0];
        const addrStr = [p.name, p.street, p.city, p.region, p.postalCode].filter(Boolean).join(', ');
        setAddress(addrStr);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setFetchingLoc(false);
    }
  };

  const submitRequest = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (user?.role === 'admin' || user?.role === 'technician') {
      return Alert.alert('Access Denied', 'Administrators and Technicians are not permitted to place service bookings.');
    }
    if (!serviceType.trim() || !address.trim() || !description.trim()) {
      return Alert.alert('Missing Fields', 'Please fill in all required fields.');
    }

    try {
      setLoading(true);
      
      // Ensure serviceType matches backend enum if possible, else default to 'Installation'
      const validTypes = ['Installation', 'Maintenance', 'Repair', 'Site Survey'];
      const st = validTypes.includes(serviceType) ? serviceType : 'Installation';

      const payload = {
        serviceType: st,
        details: description, // mapped to backend details
        address,
        scheduledDate: date.toISOString(), // mapped to backend scheduledDate
        notes: `Original Request: ${serviceType}`,
        locationDetails: locationObj
      };
      
      await fetchWithAuth('/bookings', { method: 'POST', body: JSON.stringify(payload) });
      if (socket) {
        socket.emit('new_booking_created', { serviceType: st, address });
      }
      
      setShowSuccessModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setServiceType('');
    setDescription('');
    setAddress(user?.address || '');
    setLocationObj(null);
    setTab('my-requests');
  };

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Service Center</Text>
        <Text style={s.sub}>Book an installation, repair, or check your past service requests.</Text>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'request' && s.tabActive]} onPress={() => setTab('request')}>
          <Text style={[s.tabT, tab === 'request' && s.tabTActive]}>Request Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'my-requests' && s.tabActive]} onPress={() => setTab('my-requests')}>
          <Text style={[s.tabT, tab === 'my-requests' && s.tabTActive]}>My Requests</Text>
        </TouchableOpacity>
      </View>

      {tab === 'request' ? (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.card, { opacity: formFade }]}>
            <Text style={s.label}>Service Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {['Installation', 'Maintenance', 'Repair', 'Site Survey'].map((type) => (
                <TouchableOpacity 
                  key={type}
                  onPress={() => setServiceType(type)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
                    borderColor: serviceType === type ? Colors.primary : Colors.border,
                    backgroundColor: serviceType === type ? Colors.primary : Colors.bgSurface,
                    marginRight: 8
                  }}
                >
                  <Text style={{ color: serviceType === type ? '#fff' : Colors.fgPrimary, fontWeight: '600' }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Description of Issue/Requirement *</Text>
            <TextInput 
              style={[s.input, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="Describe what you need..." 
              placeholderTextColor={Colors.fgMuted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={s.label}>Service Address *</Text>
            <TextInput 
              style={[s.input, { height: 80, textAlignVertical: 'top' }]} 
              placeholder="Full Address" 
              placeholderTextColor={Colors.fgMuted}
              multiline
              value={address}
              onChangeText={setAddress}
            />

            <Text style={s.label}>Preferred Date</Text>
            <View style={[s.input, { padding: 0 }]}>
              <Button 
                title={date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} 
                variant="ghost" 
                icon={<CalendarIcon color={Colors.primary} size={18} />} 
                onPress={() => setShowPicker(true)} 
                style={{ justifyContent: 'flex-start', borderBottomWidth: 0, paddingLeft: 16 }}
              />
            </View>
            {showPicker && (
              <DateTimePicker 
                value={date} 
                mode="date" 
                minimumDate={new Date()}
                display="default" 
                onChange={(e, d) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (d) setDate(d);
                }} 
              />
            )}

            <Text style={s.label}>Exact Location (Optional)</Text>
            {locationObj ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successFaint, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.success }}>
                <MapPin color={Colors.success} size={20} style={{ marginRight: 8 }} />
                <Text style={{ color: Colors.success, fontWeight: '700' }}>Location Captured Successfully</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={getLocation} disabled={fetchingLoc} style={s.locBtn}>
                <Animated.View style={[s.locIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                  <MapPin color={fetchingLoc ? Colors.primaryLight : Colors.primary} size={20} />
                </Animated.View>
                <Text style={s.locBtnT}>{fetchingLoc ? 'Fetching GPS Coordinates...' : 'Use Current Location'}</Text>
              </TouchableOpacity>
            )}

            <Button 
              title="Submit Service Request" 
              icon={<Hammer color="#fff" size={18} />} 
              onPress={submitRequest} 
              loading={loading}
              style={{ marginTop: 24, paddingVertical: 16 }}
              size="lg"
            />
          </Animated.View>
        </ScrollView>
      ) : (
        <FlatList 
          data={myBookings}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={loadingBookings} onRefresh={loadMyBookings} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.bookingCard} onPress={() => setSelectedBooking(item)}>
              <View style={s.bCardTop}>
                <View style={s.bIcon}><Hammer color={Colors.primaryLight} size={20} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bServiceType} numberOfLines={1}>{item.serviceType || 'Service Request'}</Text>
                  <Text style={s.bDate}>Scheduled: {formatDate(item.scheduledDate)}</Text>
                </View>
                <Badge label={item.status || 'pending'} color={statusColors[item.status?.toLowerCase()] || 'amber'} />
              </View>
              <View style={s.bCardBottom}>
                <Text style={s.bAddress} numberOfLines={2}>{item.address}</Text>
                {item.adminResponse ? (
                  <View style={s.respBox}>
                    <MessageSquare color={Colors.info} size={14} style={{ marginRight: 6 }} />
                    <Text style={s.respText} numberOfLines={1}>Response: {item.adminResponse}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No past service requests found</Text></View>}
        />
      )}

      <Modal visible={!!selectedBooking} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.mHeader}>
              <Text style={s.mTitle}>Request Details</Text>
              <TouchableOpacity style={s.mClose} onPress={() => setSelectedBooking(null)}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.mSec}>
                <Text style={s.mLabel}>Service Type</Text>
                <Text style={s.mVal}>{selectedBooking?.serviceType}</Text>
              </View>
              
              <View style={s.mSec}>
                <Text style={s.mLabel}>Scheduled Date</Text>
                <Text style={s.mVal}>{formatDate(selectedBooking?.scheduledDate)}</Text>
              </View>

              <View style={s.mSec}>
                <Text style={s.mLabel}>Service Address</Text>
                <Text style={s.mVal}>{selectedBooking?.address}</Text>
              </View>

              <View style={s.mSec}>
                <Text style={s.mLabel}>Issue Description</Text>
                <Text style={s.mVal}>{selectedBooking?.details || selectedBooking?.notes || 'No details provided.'}</Text>
              </View>

              <View style={s.mSec}>
                <Text style={s.mLabel}>Status</Text>
                <Badge label={selectedBooking?.status || 'pending'} color={statusColors[selectedBooking?.status?.toLowerCase()] || 'amber'} size="md" />
              </View>

              <Button title="Close" onPress={() => setSelectedBooking(null)} style={{ marginTop: 16 }} size="lg" variant="secondary" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.successCard}>
            <View style={s.successIconWrap}>
              <CheckCircle color={Colors.success} size={48} />
            </View>
            <Text style={s.successTitle}>Request Submitted!</Text>
            <Text style={s.successSub}>Your service request has been received. Our team will contact you shortly to confirm the appointment.</Text>
            <Button title="View My Requests" onPress={handleSuccessClose} style={{ width: '100%', marginTop: 20 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: Colors.bgCard },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  sub: { fontSize: 14, color: Colors.fgMuted, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.bgMuted, borderRadius: 14, padding: 4, marginTop: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabT: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  tabTActive: { color: '#fff' },
  content: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: Colors.bgCard, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: Colors.fgPrimary, fontSize: 15 },
  bookingCard: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  bCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  bServiceType: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  bDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  bCardBottom: { paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  bAddress: { fontSize: 13, color: Colors.fgSecondary, lineHeight: 18 },
  respBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.info + '15', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: Colors.info + '40' },
  respText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.info },
  bStatus: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  bArrow: { backgroundColor: Colors.bgMuted, padding: 8, borderRadius: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: Colors.bgSurface, borderRadius: 24, padding: 20, maxHeight: '80%' },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mTitle: { fontSize: 20, fontWeight: '800', color: Colors.fgPrimary },
  mClose: { padding: 4 },
  mSec: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginBottom: 16 },
  mLabel: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  mVal: { fontSize: 16, color: Colors.fgPrimary, fontWeight: '600' },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  successCard: { backgroundColor: Colors.bgSurface, borderRadius: 32, padding: 32, alignItems: 'center', elevation: 10, shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
  successIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 14, color: Colors.fgMuted, textAlign: 'center', lineHeight: 22 },
  locBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary + '40' },
  locIconWrap: { marginRight: 12 },
  locBtnT: { fontSize: 15, fontWeight: '700', color: Colors.primary }
});
