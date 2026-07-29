import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { ArrowLeft, Check, Package, Layers, FileText, Cpu, Eye, Info } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { getImageUrl } from '../../api/client';
import { Button } from '../../components/ui';

const { width } = Dimensions.get('window');

export default function CompareScreen({ navigation, route }: any) {
  const { products = [] } = route.params || {};

  if (products.length !== 2) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft color={Colors.fgPrimary} size={20} />
          </TouchableOpacity>
          <Text style={s.title}>Compare</Text>
        </View>
        <View style={s.empty}>
          <Text style={s.emptyT}>Select exactly 2 products to compare.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const [p1, p2] = products;

  const specs = [
    { label: 'Category', k: 'category', icon: Package },
    { label: 'Brand', k: 'brand', icon: Layers },
    { label: 'Price', k: 'price', icon: FileText, format: (v: any) => `₹${v?.toLocaleString()}` },
    { label: 'Rating', k: 'rating', icon: Eye, format: (v: any) => `${v || 4.8} / 5.0` },
  ];

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft color={Colors.fgPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Compare Products</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Product Images and Names */}
        <View style={s.topRow}>
          <View style={s.col}>
            <View style={s.imgBox}>
              <Image source={{ uri: getImageUrl(p1.images?.[0] || p1.image) }} style={s.img} />
            </View>
            <Text style={s.pName} numberOfLines={2}>{p1.name}</Text>
            <Text style={s.pPrice}>₹{p1.price?.toLocaleString()}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.col}>
            <View style={s.imgBox}>
              <Image source={{ uri: getImageUrl(p2.images?.[0] || p2.image) }} style={s.img} />
            </View>
            <Text style={s.pName} numberOfLines={2}>{p2.name}</Text>
            <Text style={s.pPrice}>₹{p2.price?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Specifications */}
        <View style={s.specSection}>
          <Text style={s.secTitle}>General Specs</Text>
          {specs.map((spec, i) => (
            <View key={i} style={s.specRow}>
              <View style={s.specLabelCol}>
                <spec.icon size={14} color={Colors.fgMuted} />
                <Text style={s.specLabel}>{spec.label}</Text>
              </View>
              <View style={s.specValCol}>
                <Text style={s.specVal}>{spec.format ? spec.format(p1[spec.k]) : (p1[spec.k] || '-')}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.specValCol}>
                <Text style={s.specVal}>{spec.format ? spec.format(p2[spec.k]) : (p2[spec.k] || '-')}</Text>
              </View>
            </View>
          ))}

          {/* Details */}
          <Text style={[s.secTitle, { marginTop: 20 }]}>Description</Text>
          <View style={[s.specRow, { alignItems: 'flex-start', paddingVertical: 16 }]}>
            <View style={s.specValCol}>
              <Text style={s.descText}>{p1.description || 'No description available.'}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.specValCol}>
              <Text style={s.descText}>{p2.description || 'No description available.'}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
           <View style={{ flex: 1, paddingRight: 10 }}>
             <Button title="View Left" variant="secondary" onPress={() => navigation.navigate('ProductDetail', { product: p1 })} />
           </View>
           <View style={{ flex: 1, paddingLeft: 10 }}>
             <Button title="View Right" variant="secondary" onPress={() => navigation.navigate('ProductDetail', { product: p2 })} />
           </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: Colors.bgSurface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { padding: 4, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.fgPrimary, letterSpacing: 0.5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyT: { fontSize: 16, color: Colors.fgMuted, marginBottom: 20, textAlign: 'center' },
  
  topRow: { flexDirection: 'row', backgroundColor: Colors.bgSurface, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  col: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  divider: { width: 1, backgroundColor: Colors.border },
  imgBox: { width: 100, height: 100, backgroundColor: Colors.bgMuted, borderRadius: 16, marginBottom: 12 },
  img: { width: '100%', height: '100%', resizeMode: 'contain' },
  pName: { fontSize: 13, fontWeight: '700', color: Colors.fgPrimary, textAlign: 'center', marginBottom: 6 },
  pPrice: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  specSection: { padding: 16, backgroundColor: Colors.bgSurface, marginTop: 12 },
  secTitle: { fontSize: 12, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  specRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 12, alignItems: 'center' },
  specLabelCol: { width: 80, flexDirection: 'row', alignItems: 'center', gap: 6 },
  specLabel: { fontSize: 10, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase' },
  specValCol: { flex: 1, paddingHorizontal: 12, alignItems: 'center' },
  specVal: { fontSize: 12, fontWeight: '600', color: Colors.fgPrimary, textAlign: 'center' },
  descText: { fontSize: 11, color: Colors.fgMuted, lineHeight: 18, textAlign: 'center' },

  actions: { flexDirection: 'row', padding: 20, marginTop: 12, backgroundColor: Colors.bgSurface }
});
