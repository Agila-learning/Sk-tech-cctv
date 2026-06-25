import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Modal, TextInput } from 'react-native';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Shield, Bell, Moon } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editModal, setEditModal] = React.useState(false);
  const [form, setForm] = React.useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [loading, setLoading] = React.useState(false);

  const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }]);

  const saveProfile = async () => {
    try {
      setLoading(true);
      const updatedUser = await fetchWithAuth('/profile/update', { method: 'PATCH', body: JSON.stringify(form) });
      updateUser(updatedUser); // Sync state
      Alert.alert('Success', 'Profile updated successfully!');
      setEditModal(false);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const infoRows = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
    { icon: MapPin, label: 'Address', value: user?.address || 'Not set' },
  ];

  const menuItems = [
    { icon: Bell, label: 'Notifications', onPress: () => Alert.alert('Notifications', 'Manage your notification preferences') },
    { icon: Moon, label: 'Dark Mode', onPress: () => Alert.alert('Theme', 'Dark Mode is locked for optimal experience'), trailing: 'Always On' },
    { icon: Shield, label: 'Privacy & Security', onPress: () => Alert.alert('Privacy & Security', 'Your data is fully encrypted and securely stored.') },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.header}>
          <View style={s.avatar}><User color={Colors.primaryLight} size={32} /></View>
          <Text style={s.name}>{user?.name}</Text>
          <Badge label={user?.role || 'Customer'} color="blue" size="md" />
          <TouchableOpacity style={s.editBtn} onPress={() => setEditModal(true)}><Text style={s.editBtnT}>Edit Profile</Text></TouchableOpacity>
        </View>
        <View style={s.card}>
          {infoRows.map((r, i) => (
            <View key={i} style={[s.row, i < infoRows.length - 1 && s.rowBorder]}>
              <View style={s.rowIcon}><r.icon color={Colors.fgMuted} size={16} /></View>
              <View style={{ flex: 1 }}><Text style={s.rowLabel}>{r.label}</Text><Text style={s.rowValue}>{r.value}</Text></View>
            </View>
          ))}
        </View>
        <View style={s.card}>
          {menuItems.map((m, i) => (
            <TouchableOpacity key={i} style={[s.menuRow, i < menuItems.length - 1 && s.rowBorder]} onPress={m.onPress}>
              <m.icon color={Colors.fgMuted} size={18} />
              <Text style={s.menuLabel}>{m.label}</Text>
              {m.trailing ? <Text style={s.menuTrail}>{m.trailing}</Text> : <ChevronRight color={Colors.fgDim} size={16} />}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOut color={Colors.danger} size={18} /><Text style={s.logoutT}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <Text style={s.label}>Full Name</Text>
            <TextInput style={s.input} value={form.name} onChangeText={t => setForm({ ...form, name: t })} placeholderTextColor={Colors.fgDim} />
            <Text style={s.label}>Phone Number</Text>
            <TextInput style={s.input} value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} keyboardType="phone-pad" placeholderTextColor={Colors.fgDim} />
            <Text style={s.label}>Address</Text>
            <TextInput style={s.input} value={form.address} onChangeText={t => setForm({ ...form, address: t })} placeholderTextColor={Colors.fgDim} />
            
            <View style={s.modalActions}>
              <Button title="Cancel" onPress={() => setEditModal(false)} variant="secondary" style={{ flex: 1 }} />
              <Button title="Save" onPress={saveProfile} style={{ flex: 1 }} loading={loading} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 28, gap: 12 },
  avatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.borderBlue },
  name: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary },
  card: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgMuted, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 10, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  rowValue: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  menuTrail: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 8, padding: 18, borderRadius: 20, backgroundColor: Colors.dangerFaint, borderWidth: 1, borderColor: Colors.dangerBorder, gap: 10 },
  logoutT: { fontSize: 13, fontWeight: '800', color: Colors.danger, textTransform: 'uppercase', letterSpacing: 1 },
  editBtn: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border },
  editBtnT: { fontSize: 12, fontWeight: '800', color: Colors.fgPrimary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 14, color: Colors.fgPrimary, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
