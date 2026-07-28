import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Dimensions, Alert, FlatList } from 'react-native';
import { ShoppingCart, Star, Shield, ArrowLeft, Check, Heart, Camera } from 'lucide-react-native';
import { Colors, Radius } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { getImageUrl, fetchWithAuth } from '../../api/client';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const DUMMY_REVIEWS = [
  { id: '1', author: 'Nandha', rating: 5, date: '2026-07-21', text: 'Excellent camera quality. The 4K resolution is very crisp.', type: 'product' },
  { id: '2', author: 'Arun', rating: 4, date: '2026-07-20', text: 'Installation was done perfectly. Very professional technician.', type: 'tech' },
  { id: '3', author: 'Priya', rating: 5, date: '2026-07-15', text: 'Great after-sales support from SK Technology.', type: 'company' },
  { id: '4', author: 'Rahul', rating: 4, date: '2026-07-10', text: 'Good product but delivery was delayed by a day.', type: 'product' },
];

export default function ProductDetailScreen({ navigation, route }: any) {
  const { addToCart } = useCart();
  const product = route?.params?.product;
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [reviewFilter, setReviewFilter] = React.useState('all');
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

          <TouchableOpacity style={s.btn360} onPress={() => Alert.alert('360° View', 'Opening 360 degree product viewer...')}>
            <Camera color="#fff" size={16} />
            <Text style={s.btn360Txt}>360° View</Text>
          </TouchableOpacity>
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
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            {product.initialPrice ? <Text style={s.initialPrice}>₹{product.initialPrice.toLocaleString()}</Text> : null}
            <Text style={s.price}>₹{product.price?.toLocaleString()}</Text>
          </View>
          <Text style={s.desc}>{product.description || 'High-quality security equipment designed for professional surveillance applications.'}</Text>
          <View style={s.features}>
            {['Premium Quality', 'Warranty Included', 'Professional Setup'].map((f, i) => (
              <View key={i} style={s.featureRow}><Check color={Colors.success} size={14} /><Text style={s.featureT}>{f}</Text></View>
            ))}
          </View>
          <View style={s.actions}>
            <Button title="Add to Cart" onPress={handleAddToCart} size="lg" fullWidth icon={<ShoppingCart color="#fff" size={18} />} />
          </View>

          {/* Reviews Section */}
          <View style={s.reviewsSec}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={s.revTitle}>Public Reviews</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {['all', 'product', 'tech', 'company'].map(f => (
                <TouchableOpacity key={f} onPress={() => setReviewFilter(f)} style={[s.revFilter, reviewFilter === f && s.revFilterAct]}>
                  <Text style={[s.revFilterTxt, reviewFilter === f && s.revFilterTxtAct]}>
                    {f === 'all' ? 'All Reviews' : f === 'product' ? 'Product Review' : f === 'tech' ? 'Tech Review' : 'Company Review'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.revList}>
              {DUMMY_REVIEWS.filter(r => reviewFilter === 'all' || r.type === reviewFilter).map(review => (
                <View key={review.id} style={s.revCard}>
                  <View style={s.revHdr}>
                    <Text style={s.revAuthor}>{review.author}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Star color={Colors.warning} size={12} fill={Colors.warning} />
                      <Text style={s.revRating}>{review.rating}.0</Text>
                    </View>
                  </View>
                  <Text style={s.revText}>{review.text}</Text>
                  <View style={s.revFtr}>
                    <Text style={s.revDate}>{review.date}</Text>
                    <Badge label={review.type} color={review.type === 'product' ? 'blue' : review.type === 'tech' ? 'amber' : 'purple'} />
                  </View>
                </View>
              ))}
            </View>
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
  initialPrice: { fontSize: 22, textDecorationLine: 'line-through', color: Colors.fgMuted, fontWeight: '700' },
  desc: { fontSize: 14, color: Colors.fgMuted, fontWeight: '500', lineHeight: 22, marginTop: 8 },
  features: { marginTop: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureT: { fontSize: 13, fontWeight: '700', color: Colors.fgSecondary },
  actions: { marginTop: 24, paddingBottom: 40 },
  viewLabelsList: { marginTop: 12, marginBottom: 4 },
  viewChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  viewChipAct: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  viewChipT: { fontSize: 12, fontWeight: '800', color: Colors.fgSecondary },
  viewChipActT: { color: '#fff' },
  btn360: { position: 'absolute', bottom: 32, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 4, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  btn360Txt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  reviewsSec: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingBottom: 40 },
  revTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  revFilter: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  revFilterAct: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  revFilterTxt: { fontSize: 12, fontWeight: '700', color: Colors.fgSecondary },
  revFilterTxtAct: { color: '#fff' },
  revList: { gap: 12 },
  revCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  revHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  revAuthor: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  revRating: { fontSize: 13, fontWeight: '700', color: Colors.fgSecondary, marginLeft: 4 },
  revText: { fontSize: 14, color: Colors.fgSecondary, lineHeight: 20, marginBottom: 12 },
  revFtr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revDate: { fontSize: 12, color: Colors.fgMuted }
});
