import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, TextInput, Alert, Platform, Linking, Image } from 'react-native';
import { Shield, ShieldCheck, ShieldAlert, ArrowLeft, Search, Phone, Calendar, Clock, HelpCircle, CheckCircle, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Badge, Button } from '../../components/ui';

export default function WarrantyScreen({ navigation }: any) {
  const { user } = useAuth();
  const { socket, triggerNotification } = useSocket();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const handleWarrantyLookup = async () => {
    if (!lookupQuery.trim()) {
      Alert.alert('Enter Query', 'Please enter an Order ID or Phone Number to check warranty status.');
      return;
    }
    try {
      setLookingUp(true);
      setLookupError('');
      setLookupResult(null);

      // First check existing data in state
      const foundLocally = data.find(item => 
        item._id?.toLowerCase() === lookupQuery.trim().toLowerCase() ||
        item._id?.slice(-6).toLowerCase() === lookupQuery.trim().toLowerCase() ||
        item.contactNumber?.includes(lookupQuery.trim()) ||
        item.customer?.phone?.includes(lookupQuery.trim())
      );

      if (foundLocally) {
        setLookupResult(foundLocally);
        return;
      }

      // If not found locally, query backend (handles offline orders and external orders)
      const [res, intTasks] = await Promise.all([
        fetchWithAuth(`/orders/all`).catch(() => []),
        fetchWithAuth(`/internal/tasks`).catch(() => [])
      ]);

      const mappedIntTasks = (intTasks || []).filter((t: any) => t.customerName).map((t: any) => ({
        _id: t._id,
        customerName: t.customerName,
        contactNumber: t.customerPhone,
        serviceType: `Internal Task: ${t.title}`,
        warrantyStartDate: t.createdAt || Date.now(),
        warrantyPeriod: t.warrantyPeriod || '12 Months',
        status: t.status,
        isInternalTask: true
      }));

      const allData = [...(res || []), ...mappedIntTasks];

      const match = allData.find((item: any) => 
        item._id?.toLowerCase() === lookupQuery.trim().toLowerCase() ||
        item._id?.slice(-6).toLowerCase() === lookupQuery.trim().toLowerCase() ||
        item.contactNumber?.includes(lookupQuery.trim()) ||
        item.customer?.phone?.includes(lookupQuery.trim())
      );

      if (match) {
        const startDate = new Date(match.warrantyStartDate || match.updatedAt || match.createdAt || Date.now());
        const endDate = new Date(startDate);
        
        // Dynamically parse warranty period
        const wStr = match.warrantyPeriod || match.customer?.warrantyPeriod || '12';
        const wMatch = wStr.match(/\d+/);
        const months = wMatch ? parseInt(wMatch[0], 10) : 12;
        endDate.setMonth(endDate.getMonth() + months);

        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isExpired = diffDays <= 0;
        const isExpiringSoon = !isExpired && diffDays <= 30;

        setLookupResult({
          ...match,
          calculatedWarrantyStart: startDate,
          calculatedWarrantyEnd: endDate,
          daysRemaining: diffDays > 0 ? diffDays : 0,
          isExpired,
          isExpiringSoon,
          warrantyStatusLabel: isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active',
          serviceCoverage: isExpired ? 'Paid Service Required' : 'Free Warranty Service',
        });
      } else {
        setLookupError('No warranty records found for the provided Order ID or Phone Number.');
      }
    } catch (e) {
      setLookupError('Failed to verify warranty. Please check your connection and try again.');
    } finally {
      setLookingUp(false);
    }
  };

  const loadWarranties = async () => {
    try {
      setLoading(true);
      let orders: any[] = [];
      let internalOrders: any[] = [];

      try {
        if (user?.role === 'admin' || user?.role === 'technician') {
          const internalTasks = await fetchWithAuth('/internal/tasks').catch(() => []);
          internalOrders = (internalTasks || []).filter((t: any) => t.customerName).map((t: any) => ({
            _id: t._id,
            customerName: t.customerName,
            contactNumber: t.customerPhone,
            serviceType: `Internal Task: ${t.title}`,
            warrantyStartDate: t.createdAt || Date.now(),
            warrantyPeriod: t.warrantyPeriod || '12 Months',
            status: t.status,
            isInternalTask: true
          }));
        }
      } catch (e) {}

      if (user?.role === 'admin') {
        const allOrders = await fetchWithAuth('/orders/all').catch(() => []);
        orders = [...allOrders, ...internalOrders];
      } else if (user?.role === 'technician') {
        const tasks = await fetchWithAuth('/technician/my-tasks').catch(() => []);
        const standardOrders = (tasks || []).map((t: any) => t.order ? { ...t.order, taskDetails: t } : null).filter(Boolean);
        orders = [...standardOrders, ...internalOrders];
      } else {
        orders = await fetchWithAuth('/orders/my-orders').catch(() => []);
      }

      // Filter and map warranty fields
      const processed = (orders || []).map((order: any) => {
        const startDate = new Date(order.warrantyStartDate || order.updatedAt || order.createdAt || Date.now());
        const endDate = new Date(startDate);
        
        // Dynamically parse warranty period
        const wStr = order.warrantyPeriod || order.customer?.warrantyPeriod || '12';
        const wMatch = wStr.match(/\d+/);
        const months = wMatch ? parseInt(wMatch[0], 10) : 12;
        endDate.setMonth(endDate.getMonth() + months);

        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const isExpired = diffDays <= 0;
        const isExpiringSoon = !isExpired && diffDays <= 30;

        return {
          ...order,
          calculatedWarrantyStart: startDate,
          calculatedWarrantyEnd: endDate,
          daysRemaining: diffDays > 0 ? diffDays : 0,
          isExpired,
          isExpiringSoon,
          warrantyStatusLabel: isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active',
          serviceCoverage: isExpired ? 'Paid Service Required' : 'Free Warranty Service',
        };
      });

      setData(processed);
    } catch (e) {
      console.error('Failed to load warranties:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranties();
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('order_updated', loadWarranties);
      socket.on('new_order', loadWarranties);
      return () => {
        socket.off('order_updated', loadWarranties);
        socket.off('new_order', loadWarranties);
      };
    }
  }, [socket]);

  const notifyUserPush = async (item: any) => {
    try {
      const customerId = item.customer?._id || item.customer;
      if (!customerId && !item.contactNumber) {
        Alert.alert('Error', 'No customer ID or contact number associated with this record.');
        return;
      }

      const msg = item.isExpired 
        ? `Warranty for Order #${item._id?.slice(-6).toUpperCase()} expired on ${new Date(item.calculatedWarrantyEnd).toLocaleDateString()}. Future services will be chargeable.` 
        : `Warranty for Order #${item._id?.slice(-6).toUpperCase()} is active until ${new Date(item.calculatedWarrantyEnd).toLocaleDateString()}. (${item.daysRemaining} days remaining - Free Service Available).`;

      const title = `Warranty Status: ${item.warrantyStatusLabel}`;

      // Call backend notification creation to send physical push notifications via Expo
      await fetchWithAuth('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title,
          message: msg,
          role: 'customer',
          userId: customerId,
          orderId: item._id,
          type: 'warranty_alert'
        })
      });

      // Local push notification fallback for active session feedback
      triggerNotification(title, msg, { type: 'warranty_alert', orderId: item._id });

      Alert.alert('Success', `Push notification sent successfully to customer!`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send notification');
    }
  };

  const shareViaWhatsApp = (item: any) => {
    const customerPhone = item.contactNumber || item.customer?.phone;
    if (!customerPhone) {
      Alert.alert('No Number', 'Customer phone number is not available.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const prodNames = item.products && item.products.length > 0 
      ? item.products.map((p: any) => `${p.product?.name || 'Product'} (Qty: ${p.quantity || 1})`).join(', ')
      : (item.serviceType || item.category || 'CCTV Service');

    const textMessage = `Hello *${item.customerName || item.customer?.name || 'Customer'}*,\n\nHere is the Warranty status for your Order *#${item._id?.slice(-6).toUpperCase()}*:\n\n*Product:* ${prodNames}\n*Start Date:* ${new Date(item.calculatedWarrantyStart).toLocaleDateString('en-IN')}\n*End Date:* ${new Date(item.calculatedWarrantyEnd).toLocaleDateString('en-IN')}\n*Status:* *${item.warrantyStatusLabel.toUpperCase()}* (${item.daysRemaining} days left)\n\nThank you for choosing SK Technology!`;

    const url = `whatsapp://send?text=${encodeURIComponent(textMessage)}&phone=${formattedPhone}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textMessage)}`).catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed or supported.');
      });
    });
  };

  const callCustomer = (phone: string) => {
    if (!phone) {
      Alert.alert('No Number', 'Customer phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Could not open phone dialer'));
  };

  const filteredData = data.filter((item: any) => {
    const matchesSearch = 
      (item._id || '').toLowerCase().includes(search.toLowerCase()) || 
      (item.customerName || item.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.serviceType || item.category || '').toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'active') return !item.isExpired;
    if (filter === 'expired') return item.isExpired;
    return true;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={Colors.fgPrimary} size={20} />
        </TouchableOpacity>
        <Text style={s.title}>Warranty Management</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={s.searchContainer}>
          <Search color={Colors.fgMuted} size={18} style={{ marginRight: 10 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by Order ID, Customer, or Product..."
            placeholderTextColor={Colors.fgMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tabBtn, filter === 'all' && s.tabBtnAct]} onPress={() => setFilter('all')}>
            <Text style={[s.tabBtnT, filter === 'all' && s.tabBtnTAct]}>All ({data.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, filter === 'active' && s.tabBtnAct]} onPress={() => setFilter('active')}>
            <Text style={[s.tabBtnT, filter === 'active' && s.tabBtnTAct]}>Active ({data.filter(i => !i.isExpired).length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, filter === 'expired' && s.tabBtnAct]} onPress={() => setFilter('expired')}>
            <Text style={[s.tabBtnT, filter === 'expired' && s.tabBtnTAct]}>Expired ({data.filter(i => i.isExpired).length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWarranties} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 100 }}
        ListHeaderComponent={(
          <View style={{ marginBottom: 16 }}>
            {/* Warranty Checker Card */}
            <View style={s.lookupCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <ShieldCheck color={Colors.primary} size={24} />
                <Text style={s.lookupTitle}>Warranty Verification Checker</Text>
              </View>
              <Text style={s.lookupDesc}>Instantly verify product warranty status, coverage dates, and free service eligibility by entering your Order ID or Phone Number.</Text>
              
              <View style={s.lookupInputRow}>
                <TextInput
                  style={s.lookupInput}
                  placeholder="Enter Order ID or Phone Number..."
                  placeholderTextColor={Colors.fgMuted}
                  value={lookupQuery}
                  onChangeText={setLookupQuery}
                  onSubmitEditing={handleWarrantyLookup}
                />
                <Button title="Check" onPress={handleWarrantyLookup} loading={lookingUp} style={{ paddingHorizontal: 20 }} />
              </View>

              {lookupError ? (
                <View style={s.errorBox}>
                  <AlertCircle color={Colors.danger} size={16} />
                  <Text style={s.errorText}>{lookupError}</Text>
                </View>
              ) : null}

              {lookupResult ? (
                <View style={[s.resultBox, lookupResult.isExpired ? { borderColor: Colors.danger + '40' } : lookupResult.isExpiringSoon ? { borderColor: Colors.warning + '40' } : { borderColor: Colors.success + '40' }]}>
                  <View style={s.topContainer}>
                    <View style={s.headerRow}>
                      <View style={[s.ic, { backgroundColor: lookupResult.isExpired ? Colors.danger + '20' : lookupResult.isExpiringSoon ? Colors.warning + '20' : Colors.success + '20' }]}>
                        {lookupResult.isExpired ? <ShieldAlert color={Colors.danger} size={22} /> : lookupResult.isExpiringSoon ? <ShieldAlert color={Colors.warning} size={22} /> : <ShieldCheck color={Colors.success} size={22} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.id}>#{lookupResult._id?.slice(-6)}</Text>
                          <View style={[s.badge, { backgroundColor: lookupResult.isExpired ? Colors.danger + '20' : lookupResult.isExpiringSoon ? Colors.warning + '20' : Colors.success + '20' }]}>
                            <Text style={[s.badgeT, { color: lookupResult.isExpired ? Colors.danger : lookupResult.isExpiringSoon ? Colors.warning : Colors.success }]}>{lookupResult.warrantyStatusLabel}</Text>
                          </View>
                        </View>
                        <Text style={s.cust}>{lookupResult.customerName || lookupResult.customer?.name || 'Customer'}</Text>
                      </View>
                    </View>
                    <View style={s.coverageBox}>
                      <Text style={[s.serviceTag, { color: lookupResult.isExpired ? Colors.danger : Colors.success }]}>
                        {lookupResult.serviceCoverage}
                      </Text>
                      <Text style={s.remainTxt}>{lookupResult.daysRemaining} Days Left</Text>
                    </View>
                  </View>

                  <View style={s.datesContainer}>
                    <View style={s.dateBox}>
                      <Calendar color={Colors.fgMuted} size={14} />
                      <Text style={s.dateLabel}>Start: {lookupResult.calculatedWarrantyStart.toLocaleDateString()}</Text>
                    </View>
                    <View style={s.dateBox}>
                      <Clock color={Colors.fgMuted} size={14} />
                      <Text style={s.dateLabel}>End: {lookupResult.calculatedWarrantyEnd.toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <Text style={s.prodTitle}>{lookupResult.serviceType || lookupResult.category || 'CCTV Installation / Product Service'}</Text>

                  {lookupResult.products && lookupResult.products.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      {lookupResult.products.map((p: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: Colors.background, padding: 8, borderRadius: 10 }}>
                          {p.product?.images?.[0] ? (
                            <Image source={{ uri: p.product.images[0].startsWith('http') ? p.product.images[0] : `https://sk-tech-cctv.onrender.com${p.product.images[0]}` }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: Colors.borderLight }} />
                          ) : (
                            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              <ShieldCheck color={Colors.fgDim} size={20} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.fgPrimary }} numberOfLines={2}>{p.product?.name || 'Product'}</Text>
                            <Text style={{ fontSize: 11, color: Colors.fgMuted }}>Qty: {p.quantity || 1}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {user?.role === 'customer' ? (
                    <View style={s.actionsRow}>
                      <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => navigation.navigate('Help & Support')}>
                        <HelpCircle color={Colors.primary} size={14} />
                        <Text style={[s.aBtnT, { color: Colors.primary }]}>{lookupResult.isExpired ? 'Book Paid Service' : 'Claim Free Service'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={s.actionsRow}>
                      <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => callCustomer(lookupResult.contactNumber || lookupResult.customer?.phone)}>
                        <Phone color={Colors.primary} size={14} />
                        <Text style={[s.aBtnT, { color: Colors.primary }]}>Call Customer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.aBtn, { backgroundColor: '#25D366' + '20', borderColor: '#25D366' }]} onPress={() => shareViaWhatsApp(lookupResult)}>
                        <Text style={[s.aBtnT, { color: '#128C7E' }]}>WhatsApp Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.bgSurface }]} onPress={() => notifyUserPush(lookupResult)}>
                        <Text style={s.aBtnT}>Notify Customer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
            
            <Text style={[s.lookupTitle, { marginTop: 8, marginBottom: 4 }]}>{user?.role === 'customer' ? 'My Warranties' : 'All Warranties'}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[s.card, item.isExpired ? { borderColor: Colors.danger + '40' } : item.isExpiringSoon ? { borderColor: Colors.warning + '40' } : { borderColor: Colors.success + '40' }]}>
            <View style={s.topContainer}>
              <View style={s.headerRow}>
                <View style={[s.ic, { backgroundColor: item.isExpired ? Colors.danger + '20' : item.isExpiringSoon ? Colors.warning + '20' : Colors.success + '20' }]}>
                  {item.isExpired ? <ShieldAlert color={Colors.danger} size={22} /> : item.isExpiringSoon ? <ShieldAlert color={Colors.warning} size={22} /> : <ShieldCheck color={Colors.success} size={22} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.id}>#{item._id?.slice(-6)}</Text>
                    <View style={[s.badge, { backgroundColor: item.isExpired ? Colors.danger + '20' : item.isExpiringSoon ? Colors.warning + '20' : Colors.success + '20' }]}>
                      <Text style={[s.badgeT, { color: item.isExpired ? Colors.danger : item.isExpiringSoon ? Colors.warning : Colors.success }]}>{item.warrantyStatusLabel}</Text>
                    </View>
                  </View>
                  <Text style={s.cust}>{item.customerName || item.customer?.name || 'Customer'}</Text>
                </View>
              </View>
              <View style={s.coverageBox}>
                <Text style={[s.serviceTag, { color: item.isExpired ? Colors.danger : Colors.success }]}>
                  {item.serviceCoverage}
                </Text>
                <Text style={s.remainTxt}>{item.daysRemaining} Days Left</Text>
              </View>
            </View>

            <View style={s.datesContainer}>
              <View style={s.dateBox}>
                <Calendar color={Colors.fgMuted} size={14} />
                <Text style={s.dateLabel}>Start: {item.calculatedWarrantyStart.toLocaleDateString()}</Text>
              </View>
              <View style={s.dateBox}>
                <Clock color={Colors.fgMuted} size={14} />
                <Text style={s.dateLabel}>End: {item.calculatedWarrantyEnd.toLocaleDateString()}</Text>
              </View>
            </View>

            <Text style={s.prodTitle}>{item.serviceType || item.category || 'CCTV Installation / Product Service'}</Text>

            {item.products && item.products.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {item.products.map((p: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: Colors.background, padding: 8, borderRadius: 10 }}>
                    {p.product?.images?.[0] ? (
                      <Image source={{ uri: p.product.images[0].startsWith('http') ? p.product.images[0] : `https://sk-tech-cctv.onrender.com${p.product.images[0]}` }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10, backgroundColor: Colors.borderLight }} />
                    ) : (
                      <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <ShieldCheck color={Colors.fgDim} size={20} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.fgPrimary }} numberOfLines={2}>{p.product?.name || 'Product'}</Text>
                      <Text style={{ fontSize: 11, color: Colors.fgMuted }}>Qty: {p.quantity || 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={s.actionsRow}>
              {(user?.role === 'admin' || user?.role === 'technician') && (
                <>
                  <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => callCustomer(item.contactNumber || item.customer?.phone)}>
                    <Phone color={Colors.primary} size={14} />
                    <Text style={[s.aBtnT, { color: Colors.primary }]}>Call Customer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.aBtn, { backgroundColor: '#25D366' + '20', borderColor: '#25D366' }]} onPress={() => shareViaWhatsApp(item)}>
                    <Text style={[s.aBtnT, { color: '#128C7E' }]}>WhatsApp Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.bgSurface }]} onPress={() => notifyUserPush(item)}>
                    <Text style={s.aBtnT}>Notify Customer</Text>
                  </TouchableOpacity>
                </>
              )}
              {user?.role === 'customer' && (
                <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.primaryFaint, borderColor: Colors.primary + '30' }]} onPress={() => navigation.navigate('Help & Support')}>
                  <HelpCircle color={Colors.primary} size={14} />
                  <Text style={[s.aBtnT, { color: Colors.primary }]}>{item.isExpired ? 'Book Paid Service' : 'Claim Free Service'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No warranty records found</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 16, height: 50, marginTop: 16, marginBottom: 12 },
  searchInput: { flex: 1, color: Colors.fgPrimary, fontSize: 15 },
  tabRow: { flexDirection: 'row', gap: 10 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tabBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnT: { fontSize: 13, fontWeight: '800', color: Colors.fgMuted },
  tabBtnTAct: { color: '#fff' },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 },
  topContainer: { flexDirection: 'column', gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  coverageBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgSurface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  ic: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  id: { fontSize: 15, fontWeight: '900', color: Colors.fgPrimary },
  cust: { fontSize: 13, color: Colors.fgMuted, fontWeight: '700', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeT: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceTag: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  remainTxt: { fontSize: 11, color: Colors.fgMuted, fontWeight: '700', marginTop: 2 },
  datesContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateLabel: { fontSize: 12, fontWeight: '700', color: Colors.fgPrimary },
  prodTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  aBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  aBtnT: { fontSize: 12, fontWeight: '800', color: Colors.fgPrimary },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  lookupCard: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  lookupTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  lookupDesc: { fontSize: 13, color: Colors.fgMuted, marginBottom: 16, lineHeight: 20 },
  lookupInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lookupInput: { flex: 1, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: Colors.fgPrimary, fontSize: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.danger + '15', borderWidth: 1, borderColor: Colors.danger + '40', borderRadius: 12, padding: 12, marginTop: 14 },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '700', flex: 1 },
  resultBox: { backgroundColor: Colors.bgSurface, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginTop: 16 },
});
