import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, StatusBar, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import { ChevronLeft, Upload, CheckCircle2, Package, MapPin, AlertTriangle, Calendar } from 'lucide-react-native';
import { Button } from '../../components/ui';
import * as ImagePicker from 'expo-image-picker';
import { fetchWithAuth, uploadFile } from '../../api/client';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateServiceRequestScreen({ navigation }: any) {
  const [serviceType, setServiceType] = useState('Warranty');
  const [product, setProduct] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [serial, setSerial] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState('Morning (9 AM - 1 PM)');

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      if (images.length >= 3) return Alert.alert('Limit Reached', 'You can only upload up to 3 photos.');
      setImages([...images, res.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImgs = [...images];
    newImgs.splice(index, 1);
    setImages(newImgs);
  };

  const submit = async () => {
    if (!product || !category || !description || !address) {
      return Alert.alert('Error', 'Please fill all mandatory fields.');
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('serviceType', serviceType);
      formData.append('installedProduct', product);
      formData.append('issueCategory', category);
      formData.append('issueDescription', description);
      formData.append('installationAddress', address);
      formData.append('preferredDate', date.toISOString());
      formData.append('preferredTime', time);
      if (serial) formData.append('serialNumber', serial);

      for (let i = 0; i < images.length; i++) {
        formData.append('media', {
          uri: images[i],
          name: `issue_${Date.now()}_${i}.jpg`,
          type: 'image/jpeg'
        } as any);
      }

      await fetchWithAuth('/service-requests', {
        method: 'POST',
        body: formData,
      });

      Alert.alert('Success', 'Service Request Submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.fgPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Raise Service Request</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.secT}>Service Type</Text>
          <View style={s.typeRow}>
            {['Warranty', 'AMC', 'Paid'].map(t => (
              <TouchableOpacity key={t} style={[s.typeCard, serviceType === t && s.typeCardActive]} onPress={() => setServiceType(t)}>
                <CheckCircle2 color={serviceType === t ? Colors.primary : Colors.border} size={20} />
                <Text style={[s.typeText, serviceType === t && { color: Colors.primary }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.secT}>Product Details</Text>
          <View style={s.inputContainer}>
            <Package color={Colors.fgMuted} size={20} />
            <TextInput style={s.input} placeholder="Installed Product (e.g. 4CH NVR, Bullet Camera)" placeholderTextColor={Colors.fgDim} value={product} onChangeText={setProduct} />
          </View>
          <View style={[s.inputContainer, { marginTop: 12 }]}>
            <MapPin color={Colors.fgMuted} size={20} />
            <TextInput style={s.input} placeholder="Installation Address" placeholderTextColor={Colors.fgDim} value={address} onChangeText={setAddress} />
          </View>
          <View style={[s.inputContainer, { marginTop: 12 }]}>
            <Package color={Colors.fgMuted} size={20} />
            <TextInput style={s.input} placeholder="Serial Number (Optional)" placeholderTextColor={Colors.fgDim} value={serial} onChangeText={setSerial} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.secT}>Issue Details</Text>
          <View style={s.inputContainer}>
            <AlertTriangle color={Colors.fgMuted} size={20} />
            <TextInput style={s.input} placeholder="Category (e.g. DVR Beeping, No Display)" placeholderTextColor={Colors.fgDim} value={category} onChangeText={setCategory} />
          </View>
          <View style={[s.inputContainer, { marginTop: 12, height: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
            <TextInput style={[s.input, { height: '100%', textAlignVertical: 'top' }]} placeholder="Describe the issue in detail..." placeholderTextColor={Colors.fgDim} multiline value={description} onChangeText={setDescription} />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.secT}>Preferred Visit Slot</Text>
          <TouchableOpacity style={s.inputContainer} onPress={() => setShowDatePicker(true)}>
            <Calendar color={Colors.fgMuted} size={20} />
            <Text style={{ marginLeft: 10, color: Colors.fgPrimary, fontSize: 15 }}>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker 
              value={date} 
              mode="date" 
              minimumDate={new Date()} 
              onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setDate(d); }} 
            />
          )}
          
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {['Morning (9 AM - 1 PM)', 'Afternoon (1 PM - 6 PM)'].map(t => (
              <TouchableOpacity key={t} style={[s.slotBtn, time === t && s.slotBtnActive]} onPress={() => setTime(t)}>
                <Text style={[s.slotText, time === t && { color: '#fff' }]}>{t.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.secT}>Upload Photos (Max 3)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {images.map((uri, idx) => (
              <View key={idx} style={s.imgContainer}>
                <Image source={{ uri }} style={s.img} />
                <TouchableOpacity style={s.imgRemove} onPress={() => removeImage(idx)}>
                  <ChevronLeft color="#fff" size={14} style={{ transform: [{rotate: '45deg'}] }} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
                <Upload color={Colors.fgMuted} size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button title="Submit Request" onPress={submit} loading={loading} style={{ marginTop: 20 }} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.fgPrimary },
  
  section: { backgroundColor: Colors.bgCard, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  secT: { fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaint },
  typeText: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, height: 54 },
  input: { flex: 1, marginLeft: 10, color: Colors.fgPrimary, fontSize: 15, fontWeight: '500' },
  
  slotBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  slotBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted },
  
  imgContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  imgRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  imgPicker: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center' }
});
