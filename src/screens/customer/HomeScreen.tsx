import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl, StatusBar, Dimensions, Modal, Linking, Animated, Easing } from 'react-native';
import { ShieldCheck, Zap, Hammer, ArrowRight, Star, Search, Bell, Activity, ShoppingCart, X, MessageCircle, PhoneCall, CheckCircle, Video, BookOpen, Clock, Settings, Wrench, Shield } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import CustomerChatbot from '../../components/customer/CustomerChatbot';

const { width } = Dimensions.get('window');

const HERO_SLIDES = [
  { id: '1', image: require('../../../assets/images/sk_home_1.png'), title: 'Premium Security Systems', subtitle: 'Protect what matters most with 4K clarity' },
  { id: '2', image: require('../../../assets/images/sk_home_2.png'), title: 'Smart Home Integration', subtitle: 'Control your environment from anywhere' },
  { id: '3', image: require('../../../assets/images/sk_home_3.png'), title: 'Expert Installation', subtitle: 'Professional setup by certified technicians' }
];

const BRANDS = [
  { name: 'Hikvision', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hikvision_logo.svg/512px-Hikvision_logo.svg.png' },
  { name: 'Dahua', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Dahua_Technology_logo.svg/512px-Dahua_Technology_logo.svg.png' },
  { name: 'CP Plus', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Cp_plus_logo.png' },
  { name: 'Godrej', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Godrej_Logo.svg/512px-Godrej_Logo.svg.png' },
  { name: 'UNV', url: 'https://www.uniview.com/res/201609/160927_LOGO_3.png' }
];

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        const next = prev === HERO_SLIDES.length - 1 ? 0 : prev + 1;
        slideRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        fetchWithAuth('/products?limit=8'),
        fetchWithAuth('/internal/categories'),
      ]);
      setProducts(prodData?.products || []);
      setCategories(catData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openWhatsApp = () => {
    Linking.openURL('https://api.whatsapp.com/send/?phone=919600975483&text=Hello SK Tech!&type=phone_number&app_absent=0').catch(e => console.error(e));
  };

  const renderHeader = () => (
    <View style={s.header}>
      <View>
        <Text style={s.greeting}>{isAuthenticated ? `Hello, ${user?.name?.split(' ')[0]}` : 'Welcome to'}</Text>
        <Text style={s.brandTitle}>SK Technology</Text>
      </View>
      <View style={s.headerActions}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Products')}>
          <Search color={Colors.fgPrimary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart color={Colors.fgPrimary} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
          <Bell color={Colors.fgPrimary} size={20} />
          <View style={s.badgeDot} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}
      
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        
        {/* Auto-slider Hero Banner */}
        <View style={s.heroContainer}>
          <FlatList 
            ref={slideRef}
            data={HERO_SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(e) => {
              setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({item}) => (
              <View style={s.heroSlide}>
                <Image source={item.image} style={s.heroImg} />
                <View style={s.heroOverlay}>
                  <Text style={s.heroTitle}>{item.title}</Text>
                  <Text style={s.heroSub}>{item.subtitle}</Text>
                  <TouchableOpacity style={s.heroBtn} onPress={() => navigation.navigate('Products')}>
                    <Text style={s.heroBtnTxt}>Explore Now</Text>
                    <ArrowRight color="#fff" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={s.pagination}>
            {HERO_SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, currentSlide === i && s.dotActive]} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.quickActions}>
          {[
            { icon: Shield, label: 'Warranty', route: 'Warranty', color: '#8b5cf6' },
            { icon: Clock, label: 'My Orders', route: 'Orders', color: '#06b6d4' },
            { icon: Wrench, label: 'Support', route: 'Help & Support', color: '#f59e0b' },
            { icon: Activity, label: 'Track', route: 'Orders', color: '#10b981' }
          ].map((action, i) => (
            <TouchableOpacity key={i} style={s.qaCard} onPress={() => navigation.navigate(action.route)}>
              <View style={[s.qaIconWrap, { backgroundColor: action.color + '15' }]}>
                <action.icon color={action.color} size={24} />
              </View>
              <Text style={s.qaLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Track Existing Service */}
        {isAuthenticated && (
          <View style={s.section}>
            <View style={s.trackCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.trackTitle}>Active Service Request</Text>
                <Text style={s.trackDesc}>Ticket #TKT-8291 • CCTV Maintenance</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={[s.statusDot, { backgroundColor: Colors.warning }]} />
                  <Text style={s.trackStatus}>Technician Assigned</Text>
                </View>
              </View>
              <TouchableOpacity style={s.trackBtn} onPress={() => navigation.navigate('Help & Support')}>
                <Text style={s.trackBtnTxt}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Book Technician Banner */}
        <View style={s.section}>
          <TouchableOpacity style={s.bookBanner} onPress={() => navigation.navigate('BookService')}>
            <View style={s.bookBannerContent}>
              <Text style={s.bookBannerTitle}>Need a Professional?</Text>
              <Text style={s.bookBannerSub}>Book a certified technician for installation or repair.</Text>
              <View style={s.bookBannerBtn}>
                <Text style={s.bookBannerBtnTxt}>Book Now</Text>
              </View>
            </View>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1995/1995574.png' }} style={s.bookBannerImg} />
          </TouchableOpacity>
        </View>

        {/* Popular Services */}
        <View style={s.section}>
          <Text style={s.secTitle}>Popular Services</Text>
          <View style={s.serviceGrid}>
            {[
              { title: 'CCTV Install', icon: Video, color: Colors.primary },
              { title: 'Network Setup', icon: Zap, color: '#06b6d4' },
              { title: 'AMC Renewal', icon: ShieldCheck, color: '#10b981' },
              { title: 'Repair', icon: Hammer, color: '#f59e0b' }
            ].map((sItem, i) => (
              <TouchableOpacity key={i} style={s.svcCard} onPress={() => navigation.navigate('BookService', { initialService: sItem.title })}>
                <sItem.icon color={sItem.color} size={28} />
                <Text style={s.svcTitle}>{sItem.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <Text style={s.secTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}><Text style={s.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={products}
            keyExtractor={p => p._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.prodCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <Image source={{ uri: getImageUrl(item.images?.[0] || item.image) }} style={s.prodImg} />
                <View style={s.prodInfo}>
                  <Text style={s.prodName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.prodPrice}>₹{item.price?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Shop By Brand */}
        <View style={s.section}>
          <Text style={s.secTitle}>Our Trusted Brands</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, marginTop: 12 }}>
            {BRANDS.map((brand, i) => (
              <View key={i} style={s.brandLogoWrap}>
                <Image source={{ uri: brand.url }} style={s.brandLogo} resizeMode="contain" />
                <Text style={s.brandText}>{brand.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        
        {/* Why Choose Us */}
        <View style={s.section}>
          <View style={s.whyCard}>
            <Text style={s.whyTitle}>Why Choose SK Tech?</Text>
            {[
              '10+ Years of Experience', 'Certified Professionals', '24/7 Customer Support', '1 Year Free Warranty'
            ].map((feat, i) => (
              <View key={i} style={s.whyRow}>
                <CheckCircle color={Colors.success} size={18} />
                <Text style={s.whyText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={s.fabContainer}>
        <TouchableOpacity style={s.chatbotFab} onPress={() => setShowChatbot(true)} activeOpacity={0.9}>
          <MessageCircle color="#fff" size={26} />
        </TouchableOpacity>
        <TouchableOpacity style={s.waFab} onPress={openWhatsApp} activeOpacity={0.9}>
          <PhoneCall color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <CustomerChatbot visible={showChatbot} onClose={() => setShowChatbot(false)} navigation={navigation} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border, zIndex: 10 },
  greeting: { fontSize: 13, color: Colors.fgMuted, fontWeight: '600' },
  brandTitle: { fontSize: 20, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgMuted, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 1, borderColor: '#fff' },
  
  heroContainer: { width, height: 220, marginBottom: 24 },
  heroSlide: { width, height: 220 },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 24, justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', width: '80%', marginBottom: 8 },
  heroSub: { color: '#e2e8f0', fontSize: 13, width: '80%', marginBottom: 16 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8 },
  heroBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 16, alignSelf: 'center', gap: 6 },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 16, backgroundColor: '#fff' },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 28 },
  qaCard: { alignItems: 'center', gap: 8, width: '22%' },
  qaIconWrap: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '700', color: Colors.fgPrimary, textAlign: 'center' },
  
  section: { paddingHorizontal: 16, marginBottom: 28 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  secTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  
  trackCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  trackTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  trackDesc: { fontSize: 12, color: Colors.fgMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  trackStatus: { fontSize: 12, fontWeight: '700', color: Colors.fgPrimary },
  trackBtn: { backgroundColor: Colors.primaryFaint, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  trackBtnTxt: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
  
  bookBanner: { backgroundColor: Colors.primary, borderRadius: 24, padding: 20, flexDirection: 'row', overflow: 'hidden', alignItems: 'center' },
  bookBannerContent: { flex: 1, zIndex: 2 },
  bookBannerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  bookBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 },
  bookBannerBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  bookBannerBtnTxt: { color: Colors.primary, fontWeight: '900', fontSize: 12 },
  bookBannerImg: { width: 100, height: 100, position: 'absolute', right: -10, bottom: -10, opacity: 0.8 },
  
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  svcCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border },
  svcTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  
  prodCard: { width: 140, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  prodImg: { width: '100%', height: 120, backgroundColor: Colors.bgMuted },
  prodInfo: { padding: 12 },
  prodName: { fontSize: 13, fontWeight: '700', color: Colors.fgPrimary },
  prodPrice: { fontSize: 14, fontWeight: '900', color: Colors.primary, marginTop: 4 },
  
  brandLogoWrap: { width: 110, height: 80, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, padding: 8 },
  brandLogo: { width: 70, height: 36, marginBottom: 6 },
  brandText: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  whyCard: { backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },
  whyTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  whyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  whyText: { fontSize: 14, fontWeight: '600', color: Colors.fgSecondary },
  
  fabContainer: { position: 'absolute', bottom: 20, left: 20, gap: 12 },
  chatbotFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  waFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 }
});
