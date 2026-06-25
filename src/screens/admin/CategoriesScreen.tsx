import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, RefreshControl, Modal, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { Folder, Plus, Trash2, Edit2, X, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from '../../utils/storage';
import { Colors } from '../../theme/colors';
import { Button } from '../../components/ui';
import { fetchWithAuth, getImageUrl } from '../../api/client';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [order, setOrder] = useState('0');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/internal/categories'); setCategories(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName(''); setOrder('0'); setImageUri(null); setIsActive(true); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };
  
  const openEdit = (c: any) => {
    setEditingId(c._id); setName(c.name); setOrder(c.order?.toString() || '0'); setIsActive(c.isActive); setImageUri(getImageUrl(c.image));
    setModalVisible(true);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const saveCategory = async () => {
    try {
      setLoading(true);
      let finalImageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        if (Platform.OS === 'web') {
          const fd = new FormData();
          const fetchedUrl = await fetch(imageUri);
          const blob = await fetchedUrl.blob();
          // Provide a proper File object to ensure the backend Multer parses it
          const file = new File([blob], 'category.jpg', { type: blob.type || 'image/jpeg' });
          fd.append('images', file);
          const ur = await fetchWithAuth('/upload', { method: 'POST', body: fd as any });
          finalImageUrl = ur.imageUrl;
        } else {
          const fd = new FormData();
          fd.append('images', { uri: imageUri, type: 'image/jpeg', name: 'category.jpg' } as any);
          const ur = await fetchWithAuth('/upload', { method: 'POST', body: fd as any });
          finalImageUrl = ur.imageUrl;
        }
      }

      const payload = { name, order: Number(order), isActive, image: finalImageUrl };
      
      if (editingId) {
        await fetchWithAuth(`/internal/categories/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchWithAuth('/internal/categories', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalVisible(false); load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const deleteCategory = async (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this category?')) {
        try { await fetchWithAuth(`/internal/categories/${id}`, { method: 'DELETE' }); load(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }
    } else {
      Alert.alert('Confirm Delete', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try { await fetchWithAuth(`/internal/categories/${id}`, { method: 'DELETE' }); load(); }
            catch (e: any) { Alert.alert('Error', e.message); }
        }}
      ]);
    }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <View>
          <Text style={s.title}>Categories</Text>
          <Text style={s.count}>{categories.length} total</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}><Plus color="#fff" size={20} /></TouchableOpacity>
      </View>
      <FlatList data={categories} keyExtractor={c => c._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image ? <Image source={{ uri: getImageUrl(item.image) }} style={s.img} /> : <View style={s.imgPlaceholder}><Folder color={Colors.primary} size={24} /></View>}
            <View style={s.info}>
              <Text style={s.cName} numberOfLines={1}>{item.name}</Text>
              <Text style={s.cStatus}>{item.isActive ? 'Active' : 'Inactive'} • Order: {item.order}</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.aBtn} onPress={() => openEdit(item)}><Edit2 color={Colors.primary} size={16} /></TouchableOpacity>
              <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => deleteCategory(item._id)}><Trash2 color={Colors.danger} size={16} /></TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No categories</Text>} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}><Text style={s.mT}>{editingId ? 'Edit Category' : 'Add Category'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity></View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
                {imageUri ? <Image source={{ uri: imageUri }} style={s.cImg} /> : <View style={s.iPh}><Upload color={Colors.fgMuted} size={24} /><Text style={s.iPhT}>Upload Image</Text></View>}
              </TouchableOpacity>
              <TextInput style={s.input} placeholder="Category Name" placeholderTextColor={Colors.fgDim} value={name} onChangeText={setName} />
              <TextInput style={s.input} placeholder="Display Order (e.g. 1)" placeholderTextColor={Colors.fgDim} value={order} onChangeText={setOrder} keyboardType="numeric" />
              <TouchableOpacity style={[s.input, { justifyContent: 'center' }]} onPress={() => setIsActive(!isActive)}>
                <Text style={{ color: isActive ? Colors.success : Colors.danger, fontWeight: '700' }}>Status: {isActive ? 'Active' : 'Inactive'}</Text>
              </TouchableOpacity>
              <Button title={editingId ? 'Update Category' : 'Save Category'} onPress={saveCategory} loading={loading} style={{ marginTop: 10 }} />
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
  count: { fontSize: 12, color: Colors.fgMuted, fontWeight: '700' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  img: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.bgMuted, marginRight: 12 },
  imgPlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cStatus: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  aBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  imgPicker: { width: '100%', height: 200, borderRadius: 16, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', overflow: 'hidden' },
  cImg: { width: '100%', height: '100%' },
  iPh: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iPhT: { fontSize: 14, fontWeight: '800', color: Colors.fgMuted },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, height: 54, color: Colors.fgPrimary, fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
});
