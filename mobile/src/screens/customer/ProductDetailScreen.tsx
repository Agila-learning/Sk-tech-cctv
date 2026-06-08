import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Dimensions, Alert, FlatList } from 'react-native';
import { ShoppingCart, Star, Shield, ArrowLeft, Check, Heart } from 'lucide-react-native';
import { Colors, Radius } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { getImageUrl, fetchWithAuth } from '../../api/client';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }: any) {
  const { addToCart } = useCart();
  const product = route?.params?.product;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [loadingAction, setLoadingAction] = React.useState(false);
  if (!product) return <View style={s.root}><Text style={s.errT}>Product not found</Text></View>;
  
  const images = product.images?.length ? product.images : [product.image || ''];
  const viewLabels = ['Front View', 'Top View', 'Back View', '360° View', 'Details'];

  const handleAddToCart = () => {
    addToCart(product, 1);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'Go to Cart', onPress: () => navigation.navigate('Main', { screen: 'Cart' }) }
    ]);
  };

  const toggleWishlist = async () => {
    try {
      setLoadingAction(true);
      await fetchWithAuth('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ productId: product._id }) });
      setIsWishlisted(!isWishlisted);
    } catch (e) { console.log(e); } finally { setLoadingAction(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.imgWrap}>
          <FlatList 
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: getImageUrl(item) }} style={s.img} resizeMode="cover" />
            )}
          />
          {images.length > 1 && (
            <View style={s.dotWrap}>
              {images.map((_: any, i: number) => <View key={i} style={[s.dot, activeIndex === i && s.dotActive]} />)}
            </View>
          )}
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft color={Colors.fgPrimary} size={20} />
          </TouchableOpacity>
          <View style={s.topRightBtns}>
            <TouchableOpacity style={s.actionBtn} onPress={toggleWishlist} disabled={loadingAction}>
              <Heart color={isWishlisted ? Colors.danger : Colors.fgPrimary} fill={isWishlisted ? Colors.danger : 'transparent'} size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Main', { screen: 'Cart' })}>
              <ShoppingCart color={Colors.fgPrimary} size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.content}>
          <Badge label={product.category || 'Camera'} color="blue" />
          
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.viewLabelsList} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
              {images.map((_: any, i: number) => (
                <TouchableOpacity key={i} onPress={() => {
                  setActiveIndex(i);
                  flatListRef.current?.scrollToIndex({ index: i, animated: true });
                }} style={[s.viewChip, activeIndex === i && s.viewChipAct]}>
                  <Text style={[s.viewChipT, activeIndex === i && s.viewChipActT]}>{viewLabels[i] || `View ${i + 1}`}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <Text style={s.name}>{product.name}</Text>
          <View style={s.ratingRow}>
            {[1, 2, 3, 4, 5].map(i => <Star key={i} color={Colors.warning} size={14} fill={Colors.warning} />)}
            <Text style={s.ratingT}>(4.8)</Text>
          </View>
          <Text style={s.price}>₹{product.price?.toLocaleString()}</Text>
          <Text style={s.desc}>{product.description || 'High-quality security equipment designed for professional surveillance applications.'}</Text>
          <View style={s.features}>
            {['Premium Quality', 'Warranty Included', 'Professional Setup'].map((f, i) => (
              <View key={i} style={s.featureRow}><Check color={Colors.success} size={14} /><Text style={s.featureT}>{f}</Text></View>
            ))}
          </View>
          <View style={s.actions}>
            <Button title="Add to Cart" onPress={handleAddToCart} size="lg" fullWidth icon={<ShoppingCart color="#fff" size={18} />} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  errT: { color: Colors.fgMuted, textAlign: 'center', marginTop: 100 },
  imgWrap: { width, height: width * 0.8, backgroundColor: Colors.bgCard },
  img: { width, height: '100%' },
  dotWrap: { position: 'absolute', bottom: 32, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 16, backgroundColor: '#fff' },
  backBtn: { position: 'absolute', top: 52, left: 20, width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface + 'cc', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  topRightBtns: { position: 'absolute', top: 52, right: 20, flexDirection: 'row', gap: 12 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface + 'cc', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, gap: 12, marginTop: -24, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  name: { fontSize: 26, fontWeight: '900', color: Colors.fgPrimary, marginTop: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingT: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700', marginLeft: 6 },
  price: { fontSize: 32, fontWeight: '900', color: Colors.primaryLight },
  desc: { fontSize: 14, color: Colors.fgMuted, fontWeight: '500', lineHeight: 22, marginTop: 8 },
  features: { marginTop: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureT: { fontSize: 13, fontWeight: '700', color: Colors.fgSecondary },
  actions: { marginTop: 24, paddingBottom: 40 },
  viewLabelsList: { marginTop: 12, marginBottom: 4 },
  viewChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  viewChipAct: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  viewChipT: { fontSize: 12, fontWeight: '800', color: Colors.fgSecondary },
  viewChipActT: { color: '#fff' }
});
