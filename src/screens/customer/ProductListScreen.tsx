import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, StatusBar, Dimensions, Animated } from 'react-native';
import { Search, Filter, X, Heart, Maximize2, FileText } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ProductListScreen({ navigation, route }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState(route?.params?.category || 'All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();
  
  // Keep track of scale animations per product ID
  const scaleAnimValues = React.useRef<{ [key: string]: Animated.Value }>({}).current;

  const getScaleAnim = (id: string) => {
    if (!scaleAnimValues[id]) {
      scaleAnimValues[id] = new Animated.Value(1);
    }
    return scaleAnimValues[id];
  };

  useEffect(() => {
    (async () => {
      try {
        const [pData, cData, wData] = await Promise.all([
          fetchWithAuth('/products'), 
          fetchWithAuth('/internal/categories'),
          isAuthenticated ? fetchWithAuth('/wishlist') : Promise.resolve([])
        ]);
        setProducts(pData?.products || []);
        setCategories([{ _id: 'all', name: 'All' }, ...(cData || [])]);
        if (Array.isArray(wData)) setWishlist(wData.map((p: any) => p._id));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [isAuthenticated]);

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) return navigation.navigate('Login');
    
    // Trigger pop animation
    Animated.sequence([
      Animated.spring(getScaleAnim(productId), { toValue: 1.5, useNativeDriver: true, speed: 20 }),
      Animated.spring(getScaleAnim(productId), { toValue: 1, useNativeDriver: true, speed: 20 })
    ]).start();

    const isRemoving = wishlist.includes(productId);
    setWishlist(prev => isRemoving ? prev.filter(id => id !== productId) : [...prev, productId]);
    try {
      await fetchWithAuth('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) });
    } catch (e) {
      setWishlist(prev => isRemoving ? [...prev, productId] : prev.filter(id => id !== productId));
    }
  };

  const toggleCompare = (product: any) => {
    setCompareList(prev => {
      if (prev.find(p => p._id === product._id)) return prev.filter(p => p._id !== product._id);
      if (prev.length >= 2) {
        alert('You can only compare 2 products at a time');
        return prev;
      }
      return [...prev, product];
    });
  };

  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'All' || p.category === selectedCat;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const renderProduct = ({ item }: any) => (
    <View style={s.card}>
      <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item })} activeOpacity={0.9}>
        <View style={s.imgContainer}>
          <Image source={{ uri: getImageUrl(item.images?.[0] || item.image) }} style={s.img} />
          <TouchableOpacity style={s.favBtn} onPress={() => toggleWishlist(item._id)}>
            <Animated.View style={{ transform: [{ scale: getScaleAnim(item._id) }] }}>
              <Heart color={wishlist.includes(item._id) ? Colors.danger : Colors.fgMuted} size={18} fill={wishlist.includes(item._id) ? Colors.danger : 'transparent'} />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          <Text style={s.cat}>{item.category}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            {item.initialPrice ? <Text style={s.initialPrice}>₹{item.initialPrice.toLocaleString()}</Text> : null}
            <Text style={s.price}>₹{item.price?.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={s.cardActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
          <FileText color={Colors.primary} size={14} />
          <Text style={s.actionBtnTxt}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnCompare, compareList.find(p => p._id === item._id) && { backgroundColor: Colors.primaryFaint }]} onPress={() => toggleCompare(item)}>
          <Maximize2 color={compareList.find(p => p._id === item._id) ? Colors.primary : Colors.fgMuted} size={14} />
          <Text style={[s.actionBtnTxtComp, compareList.find(p => p._id === item._id) && { color: Colors.primary }]}>Compare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.searchRow}>
        <View style={s.searchBox}><Search color={Colors.fgDim} size={16} />
          <TextInput style={s.searchInp} placeholder="Search products..." placeholderTextColor={Colors.fgDim} value={search} onChangeText={setSearch} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X color={Colors.fgMuted} size={16} /></TouchableOpacity> : null}
        </View>
      </View>
      <View style={{ marginBottom: 16 }}>
        <FlatList horizontal data={categories} keyExtractor={c => c._id} showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.catPill, selectedCat === item.name && s.catActive]} onPress={() => setSelectedCat(item.name)}>
              <Text style={[s.catText, selectedCat === item.name && s.catTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )} />
      </View>
      <FlatList key="grid-2-cols" data={filtered} numColumns={2} keyExtractor={p => p._id} renderItem={renderProduct}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: compareList.length > 0 ? 160 : 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No products found</Text></View>} />
        
      {compareList.length > 0 && (
        <View style={s.compareBar}>
          <View>
            <Text style={s.compareTitle}>{compareList.length} Selected</Text>
            <Text style={s.compareSub}>Select {2 - compareList.length} more</Text>
          </View>
          <TouchableOpacity 
            style={[s.compareBtn, compareList.length < 2 && { opacity: 0.5 }]} 
            disabled={compareList.length < 2}
            onPress={() => navigation.navigate('Compare', { products: compareList })}
          >
            <Text style={s.compareBtnTxt}>Compare Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: 20, paddingTop: 16, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14, gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4 },
  searchInp: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.fgPrimary, fontWeight: '600' },
  catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight },
  catText: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  catTextActive: { color: '#fff' },
  card: { width: (Dimensions.get('window').width - 44) / 2, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, justifyContent: 'space-between' },
  imgContainer: { width: '100%', height: 140, backgroundColor: Colors.bgMuted },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  favBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 16 },
  info: { padding: 12, gap: 4 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cat: { fontSize: 10, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  initialPrice: { fontSize: 12, textDecorationLine: 'line-through', color: Colors.fgMuted, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bgSurface },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  actionBtnCompare: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  actionBtnTxt: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  actionBtnTxtComp: { fontSize: 11, fontWeight: '700', color: Colors.fgMuted },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
  compareBar: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: Colors.bgSurface, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, borderWidth: 1, borderColor: Colors.border },
  compareTitle: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  compareSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  compareBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  compareBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
});
