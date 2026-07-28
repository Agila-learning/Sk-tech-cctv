import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { Camera, MapPin, PenTool, Mic, Square, PlayCircle, Plus, UploadCloud, X, Send, CheckCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button } from '../ui';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { uploadFile } from '../../api/client';

export default function DailyReportForm({ orderId, currentDay, totalDays, onSubmit }: any) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [workDescription, setWorkDescription] = useState('');
  const [materialsRequested, setMaterialsRequested] = useState('');
  const [issuesRemarks, setIssuesRemarks] = useState('');
  const [progressPercent, setProgressPercent] = useState('40');
  const [signature, setSignature] = useState(false);
  
  // Upload and Voice state
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const capturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Camera permission required');
      const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (res.canceled) return;
      setUploading(true);
      const uploadData = await uploadFile('/upload?type=workflow', res.assets[0].uri, 'images');
      if (uploadData?.imageUrl) setPhotos(prev => [...prev, uploadData.imageUrl]);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setUploading(false); }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return Alert.alert('Error', 'Microphone permission required');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (e: any) { Alert.alert('Error', 'Failed to start recording'); }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();
      if (uri) {
        setUploading(true);
        const uploadData = await uploadFile('/upload?type=workflow', uri, 'audio');
        if (uploadData?.imageUrl) setVoiceNoteUrl(uploadData.imageUrl); // using imageUrl field for audio url
      }
    } catch (e: any) { Alert.alert('Error', 'Failed to stop recording'); } finally { setUploading(false); }
  };

  const submit = async (isFinal: boolean) => {
    if (!workDescription) {
      Alert.alert('Required', 'Please enter work description');
      return;
    }
    if (isFinal && !signature) {
      Alert.alert('Required', 'Customer signature is required for final completion');
      return;
    }
    
    // In a real implementation this would fetch location first
    let loc = { lat: 13.0827, lng: 80.2707, address: 'Current Site' }; 

    onSubmit({
      dayNumber: currentDay,
      workDescription,
      materialsRequested,
      issuesRemarks,
      progressPercent,
      photos,
      voiceNoteUrl,
      location: loc,
      isFinal
    });
  };

  return (
    <View style={s.card}>
      <View style={s.hdr}>
        <Text style={s.title}>Day {currentDay} Report</Text>
        <Text style={s.subtitle}>Total Days: {totalDays}</Text>
      </View>
      
      <Text style={s.lbl}>Overall Progress (%)</Text>
      <View style={s.progressBox}>
        {['20', '40', '60', '80', '100'].map(p => (
          <TouchableOpacity key={p} style={[s.pBtn, progressPercent === p && s.pBtnActive]} onPress={() => setProgressPercent(p)}>
            <Text style={[s.pBtnT, progressPercent === p && s.pBtnTActive]}>{p}%</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.lbl}>Work Completed Today *</Text>
      <TextInput
        style={s.input}
        placeholder="Describe the tasks you completed..."
        placeholderTextColor={Colors.fgMuted}
        multiline
        value={workDescription}
        onChangeText={setWorkDescription}
      />

      <Text style={s.lbl}>Voice Report (Optional)</Text>
      <View style={s.voiceBox}>
        {voiceNoteUrl ? (
          <View style={s.voiceRec}>
            <PlayCircle color={Colors.primary} size={24} />
            <Text style={s.voiceT}>Audio Recorded</Text>
            <TouchableOpacity onPress={() => setVoiceNoteUrl(null)}><X color={Colors.danger} size={20} /></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[s.voiceBtn, isRecording && s.voiceBtnRec]} onPress={isRecording ? stopRecording : startRecording}>
            {isRecording ? <Square color="#fff" size={20} /> : <Mic color={Colors.primary} size={20} />}
            <Text style={[s.voiceBtnT, isRecording && { color: '#fff' }]}>{isRecording ? 'Stop Recording' : 'Hold to Record Report'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.lbl}>Site Photos ({photos.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <TouchableOpacity style={s.photoAdd} onPress={capturePhoto} disabled={uploading}>
          {uploading ? <ActivityIndicator color={Colors.primary} /> : <Camera color={Colors.primary} size={24} />}
        </TouchableOpacity>
        {photos.map((uri, idx) => (
          <Image key={idx} source={{ uri: uri.startsWith('http') ? uri : `https://sk-tech-cctv.onrender.com${uri}` }} style={s.photo} />
        ))}
      </ScrollView>

      <Text style={s.lbl}>Material Request for Tomorrow</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. 10m Cat6 Cable, 2 Connectors"
        placeholderTextColor={Colors.fgMuted}
        value={materialsRequested}
        onChangeText={setMaterialsRequested}
      />

      <Text style={s.lbl}>Final Completion Approval</Text>
      <TouchableOpacity style={[s.sigBtn, signature && s.sigBtnActive]} onPress={() => setSignature(true)}>
        <PenTool color={signature ? Colors.success : Colors.primary} size={20} />
        <Text style={[s.sigT, signature && s.sigTActive]}>{signature ? 'Signature Collected ✅' : 'Collect Customer Signature'}</Text>
      </TouchableOpacity>

      <View style={s.actions}>
        <View style={{ flex: 1 }}>
          <Button title="Submit Report" onPress={() => submit(false)} loading={uploading} icon={<Send color="#fff" size={16} />} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Complete Work" onPress={() => submit(true)} variant="success" loading={uploading} icon={<CheckCircle color="#fff" size={16} />} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginTop: 16 },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  subtitle: { fontSize: 12, fontWeight: '700', color: Colors.fgMuted },
  lbl: { fontSize: 13, fontWeight: '800', color: Colors.fgSecondary, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, color: Colors.fgPrimary, minHeight: 80, textAlignVertical: 'top' },
  progressBox: { flexDirection: 'row', gap: 8 },
  pBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  pBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pBtnT: { fontSize: 14, fontWeight: '700', color: Colors.fgMuted },
  pBtnTActive: { color: Colors.bgSurface },
  voiceBox: { marginBottom: 16 },
  voiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryFaint, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + '40' },
  voiceBtnRec: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  voiceBtnT: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  voiceRec: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 12, justifyContent: 'space-between' },
  voiceT: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '700', color: Colors.primary },
  photoAdd: { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.primary + '40' },
  photo: { width: 80, height: 80, borderRadius: 12, marginRight: 12, backgroundColor: Colors.bgSurface },
  sigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: Colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  sigBtnActive: { backgroundColor: Colors.success + '10', borderColor: Colors.success },
  sigT: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  sigTActive: { color: Colors.success },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 }
});
