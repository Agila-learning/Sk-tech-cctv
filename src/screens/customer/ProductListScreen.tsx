import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, StatusBar, Dimensions } from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, getImageUrl } from '../../api/client';

export default function ProductListScreen({ navigation, route }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState(route?.params?.category || 'All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pData, cData] = await Promise.all([fetchWithAuth('/products'), fetchWithAuth('/internal/categories')]);
        setProducts(pData?.products || []);
        setCategories([{ _id: 'all', name: 'All' }, ...(cData || [])]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'All' || p.category === selectedCat;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
      <Image source={{ uri: getImageUrl(item.images?.[0] || item.image) }} style={s.img} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.cat}>{item.category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          {item.initialPrice ? <Text style={s.initialPrice}>₹{item.initialPrice.toLocaleString()}</Text> : null}
          <Text style={s.price}>₹{item.price?.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.catPill, selectedCat === item.name && s.catActive]} onPress={() => setSelectedCat(item.name)}>
              <Text style={[s.catText, selectedCat === item.name && s.catTextActive]}>{item.name}</Text>
            </TouchableOpacity>
          )} />
      </View>
      <FlatList key="grid-2-cols" data={filtered} numColumns={2} keyExtractor={p => p._id} renderItem={renderProduct}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No products found</Text></View>} />
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
  card: { width: (Dimensions.get('window').width - 44) / 2, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  img: { width: '100%', height: 140, backgroundColor: Colors.bgMuted, resizeMode: 'cover' },
  info: { padding: 14, gap: 4 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cat: { fontSize: 10, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  initialPrice: { fontSize: 13, textDecorationLine: 'line-through', color: Colors.fgMuted, fontWeight: '600' },
  price: { fontSize: 17, fontWeight: '900', color: Colors.primaryLight },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
});
