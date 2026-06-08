import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, RefreshControl, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Package, Plus, Trash2, Edit2, X, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/products'); setProducts(d?.products || d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName(''); setPrice(''); setStock(''); setCategory(''); setDescription(''); setImageUri(null); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };
  
  const openEdit = (p: any) => {
    setEditingId(p._id); setName(p.name); setPrice(p.price.toString()); setStock(p.stock.toString()); 
    setCategory(p.category); setDescription(p.description); setImageUri(getImageUrl(p.image || p.images?.[0]));
    setModalVisible(true);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const saveProduct = async () => {
    try {
      setLoading(true);
      let finalImageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        const fd = new FormData();
        fd.append('images', { uri: imageUri, type: 'image/jpeg', name: 'product.jpg' } as any);
        const ur = await fetch('https://sk-tech-cctv.onrender.com/api/upload', { method: 'POST', body: fd, headers: { 'Content-Type': 'multipart/form-data' } });
        const { imageUrl } = await ur.json();
        finalImageUrl = imageUrl;
      }

      const payload = { name, price: Number(price), stock: Number(stock), category, description, image: finalImageUrl, images: [finalImageUrl] };
      
      if (editingId) {
        await fetchWithAuth(`/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchWithAuth('/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalVisible(false); load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const deleteProduct = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await fetchWithAuth(`/products/${id}`, { method: 'DELETE' }); load(); }
          catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Products</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}><Plus color="#fff" size={20} /></TouchableOpacity>
      </View>
      <FlatList data={products} keyExtractor={p => p._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Image source={{ uri: getImageUrl(item.image || item.images?.[0]) }} style={s.img} />
            <View style={s.info}>
              <Text style={s.pName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.pPrice}>₹{item.price?.toLocaleString()} • {item.stock} in stock</Text>
              <Text style={s.pCat}>{item.category}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.aBtn} onPress={() => openEdit(item)}><Edit2 color={Colors.primary} size={16} /></TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => deleteProduct(item._id)}><Trash2 color={Colors.danger} size={16} /></TouchableOpacity>
            </View>
          </View>
        )} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}><Text style={s.mT}>{editingId ? 'Edit Product' : 'Add Product'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity></View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
                {imageUri ? <Image source={{ uri: imageUri }} style={s.pImg} /> : <View style={s.iPh}><Upload color={Colors.fgMuted} size={24} /><Text style={s.iPhT}>Upload Image</Text></View>}
              </TouchableOpacity>
              <TextInput style={s.input} placeholder="Product Name" placeholderTextColor={Colors.fgDim} value={name} onChangeText={setName} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Price" placeholderTextColor={Colors.fgDim} value={price} onChangeText={setPrice} keyboardType="numeric" />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Stock" placeholderTextColor={Colors.fgDim} value={stock} onChangeText={setStock} keyboardType="numeric" />
              </View>
              <TextInput style={s.input} placeholder="Category" placeholderTextColor={Colors.fgDim} value={category} onChangeText={setCategory} />
              <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor={Colors.fgDim} value={description} onChangeText={setDescription} multiline />
              <Button title={editingId ? 'Update Product' : 'Save Product'} onPress={saveProduct} loading={loading} style={{ marginTop: 10 }} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  img: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.bgMuted, marginRight: 12 },
  info: { flex: 1, gap: 4 },
  pName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  pPrice: { fontSize: 13, fontWeight: '700', color: Colors.primaryLight },
  pCat: { fontSize: 10, color: Colors.fgMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: 8 },
  aBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  imgPicker: { width: '100%', height: 200, borderRadius: 16, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', overflow: 'hidden' },
  pImg: { width: '100%', height: '100%' },
  iPh: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iPhT: { fontSize: 14, fontWeight: '800', color: Colors.fgMuted },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, height: 54, color: Colors.fgPrimary, fontSize: 15, fontWeight: '600' }
});
