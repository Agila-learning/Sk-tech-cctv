import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Image, ActivityIndicator } from 'react-native';
import { ChevronLeft, Upload, Check, ImageIcon } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { createQRCode, updateQRCode, QRCodeData } from '../../api/qrcodes';
import { uploadFile } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['Payment', 'Social Media', 'Website', 'WiFi', 'Customer Support', 'Business', 'Marketing', 'Documents', 'Other', 'Custom'];
const TARGET_TYPES = ['UPI', 'URL', 'Image', 'Text'];

export default function QRCodeFormScreen({ navigation, route }: any) {
  const qrData: QRCodeData | undefined = route.params?.qrData;
  const isEditing = !!qrData;

  const [form, setForm] = useState<QRCodeData>({
    qrName: qrData?.qrName || '',
    category: qrData?.category || 'Payment',
    customCategory: qrData?.customCategory || '',
    description: qrData?.description || '',
    displayOrder: qrData?.displayOrder || 0,
    status: qrData?.status !== false,
    isDefault: qrData?.isDefault || false,
    color: qrData?.color || Colors.primary,
    targetType: qrData?.targetType || 'Image',
    targetValue: qrData?.targetValue || '',
    qrImage: qrData?.qrImage || ''
  });

  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadSelectedImage = async () => {
    if (!imageUri) return form.qrImage;
    setUploading(true);
    try {
      const res = await uploadFile('/upload', imageUri, 'file');
      return res.fileUrl; // assuming API returns { fileUrl: string }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
      return form.qrImage;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.qrName) return Alert.alert('Error', 'QR Name is required');
    if (!form.category) return Alert.alert('Error', 'Category is required');
    if (form.category === 'Custom' && !form.customCategory) return Alert.alert('Error', 'Custom Category Name is required');

    setSaving(true);
    try {
      const uploadedImageUrl = await uploadSelectedImage();
      const finalData = { ...form, qrImage: uploadedImageUrl };

      if (isEditing && qrData?._id) {
        await updateQRCode(qrData._id, finalData);
      } else {
        await createQRCode(finalData);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save QR Code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft color={Colors.fgPrimary} size={28} />
        </TouchableOpacity>
        <Text style={s.title}>{isEditing ? 'Edit QR Code' : 'Add New QR Code'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || uploading} style={s.saveBtn}>
          {saving || uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnT}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>QR Name *</Text>
        <TextInput 
          style={s.input} 
          value={form.qrName} 
          onChangeText={t => setForm({ ...form, qrName: t })}
          placeholder="e.g. Main Google Pay" 
          placeholderTextColor={Colors.border}
        />

        <Text style={s.label}>Category *</Text>
        <View style={s.chipsRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity 
              key={c} 
              style={[s.chip, form.category === c && s.chipActive]} 
              onPress={() => setForm({ ...form, category: c })}
            >
              <Text style={[s.chipT, form.category === c && s.chipTActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.category === 'Custom' && (
          <>
            <Text style={s.label}>Custom Category Name *</Text>
            <TextInput 
              style={s.input} 
              value={form.customCategory} 
              onChangeText={t => setForm({ ...form, customCategory: t })}
              placeholder="e.g. Special Events" 
              placeholderTextColor={Colors.border}
            />
          </>
        )}

        <Text style={s.label}>QR Image</Text>
        <TouchableOpacity style={s.imgUploadBox} onPress={pickImage}>
          {imageUri || form.qrImage ? (
            <Image source={{ uri: imageUri || form.qrImage }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="contain" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Upload color={Colors.fgMuted} size={32} style={{ marginBottom: 12 }} />
              <Text style={{ color: Colors.fgMuted }}>Tap to upload QR image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.label}>Target Type</Text>
        <View style={s.chipsRow}>
          {TARGET_TYPES.map(t => (
            <TouchableOpacity 
              key={t} 
              style={[s.chip, form.targetType === t && s.chipActive]} 
              onPress={() => setForm({ ...form, targetType: t })}
            >
              <Text style={[s.chipT, form.targetType === t && s.chipTActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.targetType !== 'Image' && (
          <>
            <Text style={s.label}>Target Value</Text>
            <TextInput 
              style={s.input} 
              value={form.targetValue} 
              onChangeText={t => setForm({ ...form, targetValue: t })}
              placeholder={form.targetType === 'UPI' ? 'e.g. name@okhdfcbank' : 'e.g. https://website.com'} 
              placeholderTextColor={Colors.border}
            />
          </>
        )}

        <Text style={s.label}>Description</Text>
        <TextInput 
          style={[s.input, { height: 100, textAlignVertical: 'top' }]} 
          value={form.description} 
          onChangeText={t => setForm({ ...form, description: t })}
          placeholder="Optional notes" 
          placeholderTextColor={Colors.border}
          multiline
        />

        <Text style={s.label}>Display Order (Lowest first)</Text>
        <TextInput 
          style={s.input} 
          value={String(form.displayOrder)} 
          onChangeText={t => setForm({ ...form, displayOrder: parseInt(t) || 0 })}
          keyboardType="numeric"
        />

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Active Status</Text>
          <Switch 
            value={form.status} 
            onValueChange={v => setForm({ ...form, status: v })} 
            trackColor={{ false: Colors.border, true: Colors.primary }} 
          />
        </View>

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Mark as Default QR</Text>
          <Switch 
            value={form.isDefault} 
            onValueChange={v => setForm({ ...form, isDefault: v })} 
            trackColor={{ false: Colors.border, true: Colors.primary }} 
          />
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '700', color: Colors.fgPrimary, flex: 1, marginLeft: 8 },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  saveBtnT: { color: '#fff', fontWeight: '600' },
  content: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.fgPrimary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, color: Colors.fgPrimary, fontSize: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipT: { color: Colors.fgMuted, fontWeight: '500' },
  chipTActive: { color: '#fff' },
  imgUploadBox: { height: 200, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: Colors.border },
  switchLabel: { fontSize: 16, fontWeight: '500', color: Colors.fgPrimary }
});
