import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, StatusBar } from 'react-native';
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
        <Text style={s.price}>₹{item.price?.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}><Text style={s.title}>Products</Text></View>
      <View style={s.searchRow}>
        <View style={s.searchBox}><Search color={Colors.fgDim} size={16} />
          <TextInput style={s.searchInp} placeholder="Search..." placeholderTextColor={Colors.fgDim} value={search} onChangeText={setSearch} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X color={Colors.fgMuted} size={16} /></TouchableOpacity> : null}
        </View>
      </View>
      <FlatList horizontal data={categories} keyExtractor={c => c._id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16, height: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.catPill, selectedCat === item.name && s.catActive]} onPress={() => setSelectedCat(item.name)}>
            <Text style={[s.catText, selectedCat === item.name && s.catTextActive]}>{item.name}</Text>
          </TouchableOpacity>
        )} />
      <FlatList data={filtered} numColumns={2} keyExtractor={p => p._id} renderItem={renderProduct}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No products found</Text></View>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  searchRow: { paddingHorizontal: 20, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 14, gap: 10 },
  searchInp: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.fgPrimary, fontWeight: '600' },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 11, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  catTextActive: { color: '#fff' },
  card: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  img: { width: '100%', height: 120, backgroundColor: Colors.bgMuted },
  info: { padding: 12, gap: 3 },
  name: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  cat: { fontSize: 9, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  price: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
});
