import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, StatusBar, Dimensions, Modal, Linking } from 'react-native';
import { ShieldCheck, Zap, Hammer, ArrowRight, Star, Search, Bell, Activity, ShoppingCart, X, MessageCircle } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, Radius } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMarketing, setShowMarketing] = useState(false);
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        fetchWithAuth('/products?limit=6'),
        fetchWithAuth('/internal/categories'),
      ]);
      setProducts(prodData?.products || []);
      setCategories(catData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowMarketing(true), 120000); // 2 minutes
    return () => clearTimeout(timer);
  }, []);

  const services = [
    { title: 'Consultation', desc: 'Expert site analysis', icon: ShieldCheck, color: Colors.primary },
    { title: 'Installation', desc: 'Professional setup', icon: Hammer, color: Colors.warning },
    { title: 'Maintenance', desc: 'AMC & support', icon: Zap, color: Colors.success },
  ];

  const openWhatsApp = () => {
    Linking.openURL('https://api.whatsapp.com/send/?phone=919600975483&text&type=phone_number&app_absent=0').catch(e => console.error(e));
  };

  const chartConfig = {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View><Text style={s.greeting}>Welcome back,</Text><Text style={s.userName}>{user?.name || 'User'}</Text></View>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Cart')}>
              <ShoppingCart color={Colors.fgMuted} size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell color={Colors.fgMuted} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Products')}>
          <Search color={Colors.fgDim} size={18} /><Text style={s.searchText}>Search products...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={s.section}>
          <View style={s.secHead}><Text style={s.secTitle}>Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}><Text style={s.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {categories.map(cat => (
              <TouchableOpacity key={cat._id} style={s.catCard} onPress={() => navigation.navigate('Products', { category: cat.name })}>
                <Image source={{ uri: getImageUrl(cat.image) }} style={s.catImg} />
                <Text style={s.catName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={s.section}>
          <View style={s.secHead}><Text style={s.secTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}><ArrowRight color={Colors.primaryLight} size={18} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
            {products.map(p => (
              <TouchableOpacity key={p._id} style={s.prodCard} onPress={() => navigation.navigate('ProductDetail', { product: p })}>
                <Image source={{ uri: getImageUrl(p.images?.[0] || p.image) }} style={s.prodImg} />
                <View style={s.prodInfo}>
                  <Text style={s.prodName} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.prodCat}>{p.category}</Text>
                  <Text style={s.prodPrice}>₹{p.price?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services */}
        <View style={s.section}>
          <Text style={[s.secTitle, { paddingHorizontal: 20, marginBottom: 16 }]}>Our Services</Text>
          <View style={s.serviceGrid}>
            {services.map((svc, i) => (
              <TouchableOpacity key={i} style={s.svcCard}>
                <View style={[s.svcIcon, { backgroundColor: svc.color + '15' }]}><svc.icon color={svc.color} size={22} /></View>
                <Text style={s.svcTitle}>{svc.title}</Text>
                <Text style={s.svcDesc}>{svc.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Analytics Section */}
        <View style={s.section}>
          <Text style={[s.secTitle, { paddingHorizontal: 20, marginBottom: 16 }]}>My Activity</Text>
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={s.chartTitle}>Spending Overview</Text>
            <LineChart data={{ labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ data: [5000, 12000, 3000, 8500, 15000] }] }} width={width - 40} height={200} chartConfig={chartConfig} bezier style={s.chart} />
            
            <Text style={[s.chartTitle, { marginTop: 16 }]}>Services Booked</Text>
            <BarChart data={{ labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ data: [1, 3, 0, 2, 4] }] }} width={width - 40} height={200} chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})` }} style={s.chart} yAxisLabel="" yAxisSuffix="" />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Marketing Modal */}
      <Modal visible={showMarketing} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.marketingCard}>
            <TouchableOpacity style={s.mCloseBtn} onPress={() => setShowMarketing(false)}>
              <X color={Colors.fgMuted} size={20} />
            </TouchableOpacity>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=600&auto=format&fit=crop&q=60' }} style={s.mImg} />
            <Text style={s.mTitle}>Exclusive Offer!</Text>
            <Text style={s.mDesc}>Upgrade your security with our premium 4K CCTV bundle. Limited time only!</Text>
            <Button title="Claim Offer" onPress={() => { setShowMarketing(false); navigation.navigate('Products'); }} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={s.fab} onPress={openWhatsApp} activeOpacity={0.8}>
        <MessageCircle color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: 13, color: Colors.fgMuted, fontWeight: '600' },
  userName: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  bellBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, marginHorizontal: 20, paddingHorizontal: 18, paddingVertical: 16, gap: 12, marginBottom: 24 },
  searchText: { fontSize: 14, color: Colors.fgDim, fontWeight: '600' },
  section: { marginBottom: 28 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  secTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, textTransform: 'uppercase', letterSpacing: -0.5 },
  seeAll: { fontSize: 11, fontWeight: '800', color: Colors.primaryLight, textTransform: 'uppercase', letterSpacing: 1 },
  catCard: { width: 100, alignItems: 'center', gap: 8 },
  catImg: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  catName: { fontSize: 11, fontWeight: '800', color: Colors.fgSecondary, textAlign: 'center' },
  prodCard: { width: width * 0.42, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  prodImg: { width: '100%', height: 140, backgroundColor: Colors.bgMuted },
  prodInfo: { padding: 14, gap: 4 },
  prodName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  prodCat: { fontSize: 10, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  prodPrice: { fontSize: 18, fontWeight: '900', color: Colors.primaryLight, marginTop: 4 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  svcCard: { flex: 1, minWidth: 140, backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center', gap: 8 },
  svcIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  svcTitle: { fontSize: 12, fontWeight: '900', color: Colors.fgPrimary, textTransform: 'uppercase' },
  svcDesc: { fontSize: 10, color: Colors.fgMuted, fontWeight: '600', textAlign: 'center' },
  chartTitle: { fontSize: 13, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  chart: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  marketingCard: { width: '85%', backgroundColor: Colors.bgSurface, borderRadius: 24, padding: 24, alignItems: 'center' },
  mCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 32, height: 32, backgroundColor: Colors.bgMuted, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mImg: { width: '100%', height: 160, borderRadius: 16, marginBottom: 16, backgroundColor: Colors.bgMuted },
  mTitle: { fontSize: 24, fontWeight: '900', color: Colors.primaryLight, marginBottom: 8 },
  mDesc: { fontSize: 14, color: Colors.fgMuted, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, zIndex: 100 },
});
