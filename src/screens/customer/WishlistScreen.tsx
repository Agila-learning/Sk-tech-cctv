import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Image } from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth, getImageUrl } from '../../api/client';
import { useCart } from '../../context/CartContext';

export default function WishlistScreen({ navigation }: any) {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/wishlist');
      setWishlist(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadWishlist(); }, []);

  const toggleWishlist = async (productId: string) => {
    try {
      const data = await fetchWithAuth('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId }) });
      loadWishlist();
    } catch (e) { console.error(e); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}><Text style={s.title}>My Wishlist</Text></View>

      <FlatList 
        data={wishlist} 
        keyExtractor={p => p._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWishlist} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <Image source={{ uri: getImageUrl(item.image || item.images?.[0]) }} style={s.img} />
            <View style={s.info}>
              <Text style={s.pName} numberOfLines={2}>{item.name}</Text>
              <Text style={s.pPrice}>₹{item.price?.toLocaleString()}</Text>
              <View style={s.actions}>
                <TouchableOpacity style={s.cartBtn} onPress={() => { addToCart(item, 1); navigation.navigate('Cart'); }}>
                  <ShoppingCart color="#fff" size={14} /><Text style={s.cartBtnT}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={s.heartBtn} onPress={() => toggleWishlist(item._id)}>
              <Heart color={Colors.danger} fill={Colors.danger} size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Heart color={Colors.fgDim} size={48} /><Text style={s.emptyT}>Your wishlist is empty</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  img: { width: 90, height: 90, borderRadius: 14, backgroundColor: Colors.bgMuted, marginRight: 16 },
  info: { flex: 1, gap: 4 },
  pName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  pPrice: { fontSize: 16, fontWeight: '900', color: Colors.primaryLight },
  actions: { flexDirection: 'row', marginTop: 8 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  cartBtnT: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  heartBtn: { padding: 12, position: 'absolute', top: 4, right: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyT: { fontSize: 16, color: Colors.fgMuted, fontWeight: '700' },
});
