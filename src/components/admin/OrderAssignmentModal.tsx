import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Search, User, X, Zap } from 'lucide-react-native';

export default function OrderAssignmentModal({ visible, order, techs, onClose, onAssignSuccess }: any) {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [autoRequiredTechs, setAutoRequiredTechs] = useState('1');
  const [loading, setLoading] = useState(false);
  
  // Manual Assignment State
  const [primary, setPrimary] = useState<any>(null);
  const [secondaries, setSecondaries] = useState<any[]>([]);
  const [helpers, setHelpers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  if (!visible || !order) return null;

  const handleAssign = async () => {
    if (mode === 'manual' && !primary) {
      Alert.alert('Error', 'Primary Technician is required for manual assignment.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = mode === 'auto' ? {
        orderId: order._id,
        assignmentMode: 'auto',
        requiredTechnicians: parseInt(autoRequiredTechs) || 1
      } : {
        orderId: order._id,
        assignmentMode: 'manual',
        primaryTechnicianId: primary._id,
        secondaryTechnicianIds: secondaries.map(t => t._id),
        helperIds: helpers.map(t => t._id)
      };

      await fetchWithAuth('/orders/assign', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      Alert.alert('Success', 'Order assigned successfully.');
      onAssignSuccess();
      onClose();
    } catch (e: any) {
      // Temporary fallback for legacy backend while it is being updated
      if (e.message.includes('400') || e.message.includes('404')) {
         try {
           const legacyTechId = mode === 'auto' ? techs[0]?._id : primary._id;
           await fetchWithAuth('/orders/assign', {
             method: 'POST',
             body: JSON.stringify({ orderId: order._id, technicianId: legacyTechId }),
           });
           Alert.alert('Success', '(Legacy fallback) Order assigned successfully.');
           onAssignSuccess();
           onClose();
         } catch (e2: any) {
           Alert.alert('Error', e2.message);
         }
      } else {
        Alert.alert('Error', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSecondary = (t: any) => {
    if (secondaries.find(x => x._id === t._id)) setSecondaries(secondaries.filter(x => x._id !== t._id));
    else setSecondaries([...secondaries, t]);
  };

  const toggleHelper = (t: any) => {
    if (helpers.find(x => x._id === t._id)) setHelpers(helpers.filter(x => x._id !== t._id));
    else setHelpers([...helpers, t]);
  };

  const filteredTechs = techs.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.hdr}>
            <Text style={s.title}>Work Assignment</Text>
            <TouchableOpacity onPress={onClose}><X color={Colors.fgMuted} size={24} /></TouchableOpacity>
          </View>
          
          <Text style={s.subtitle}>Order #{order._id?.slice(-6)} • {order.customer?.name || order.customerName}</Text>
          
          {/* Mode Toggle */}
          <View style={s.modeToggle}>
            <TouchableOpacity style={[s.modeBtn, mode === 'auto' && s.modeActive]} onPress={() => setMode('auto')}>
              <Zap color={mode === 'auto' ? Colors.bgSurface : Colors.fgMuted} size={16} />
              <Text style={[s.modeText, mode === 'auto' && s.modeActiveText]}>Auto Assign Engine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, mode === 'manual' && s.modeActive]} onPress={() => setMode('manual')}>
              <User color={mode === 'manual' ? Colors.bgSurface : Colors.fgMuted} size={16} />
              <Text style={[s.modeText, mode === 'manual' && s.modeActiveText]}>Manual Assignment</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
            {mode === 'auto' ? (
              <View style={s.autoBox}>
                <View style={s.iconBg}><Zap color={Colors.warning} size={32} /></View>
                <Text style={s.autoTitle}>Intelligent Allocation</Text>
                <Text style={s.autoDesc}>The system will automatically scan all available technicians and allocate based on workload, distance, availability, and skills.</Text>
                
                <Text style={s.label}>Technicians Required:</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {['1', '2', '3', '4'].map(num => (
                    <TouchableOpacity key={num} style={[s.numBtn, autoRequiredTechs === num && s.numBtnActive]} onPress={() => setAutoRequiredTechs(num)}>
                      <Text style={[s.numBtnT, autoRequiredTechs === num && { color: Colors.bgSurface }]}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                <View style={s.searchBox}>
                  <Search color={Colors.fgMuted} size={18} />
                  <TextInput style={s.searchInput} placeholder="Search Technicians..." placeholderTextColor={Colors.fgDim} value={search} onChangeText={setSearch} />
                </View>

                {filteredTechs.map((t: any) => {
                  const isPrimary = primary?._id === t._id;
                  const isSec = secondaries.some(x => x._id === t._id);
                  const isHelper = helpers.some(x => x._id === t._id);
                  return (
                    <View key={t._id} style={s.techRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.techName}>{t.name}</Text>
                        <Text style={[s.techStatus, { color: t.status === 'available' ? Colors.success : Colors.warning }]}>
                          {t.status === 'available' ? 'Available' : 'Busy / Leave'}
                        </Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={[s.roleBtn, isPrimary && s.roleBtnActive]} onPress={() => { setPrimary(t); setSecondaries(secondaries.filter(x=>x._id!==t._id)); setHelpers(helpers.filter(x=>x._id!==t._id)); }}>
                          <Text style={[s.roleT, isPrimary && s.roleTActive]}>PRI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.roleBtn, isSec && s.roleBtnActive]} onPress={() => { toggleSecondary(t); if(isPrimary) setPrimary(null); setHelpers(helpers.filter(x=>x._id!==t._id)); }}>
                          <Text style={[s.roleT, isSec && s.roleTActive]}>SEC</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.roleBtn, isHelper && s.roleBtnActive]} onPress={() => { toggleHelper(t); if(isPrimary) setPrimary(null); setSecondaries(secondaries.filter(x=>x._id!==t._id)); }}>
                          <Text style={[s.roleT, isHelper && s.roleTActive]}>HLP</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}><Text style={s.cancelT}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.assignBtn} onPress={handleAssign} disabled={loading}>
              <Text style={s.assignT}>{loading ? 'Assigning...' : (mode === 'auto' ? 'Execute Auto Assign' : 'Confirm Assignment')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '85%' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  subtitle: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted, marginTop: 4 },
  modeToggle: { flexDirection: 'row', backgroundColor: Colors.bgHover, borderRadius: 12, padding: 4, marginTop: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10 },
  modeActive: { backgroundColor: Colors.primary },
  modeText: { fontSize: 13, fontWeight: '800', color: Colors.fgMuted },
  modeActiveText: { color: Colors.bgSurface },
  autoBox: { alignItems: 'center', padding: 20, backgroundColor: Colors.warning + '10', borderRadius: 16, borderWidth: 1, borderColor: Colors.warning + '30', marginTop: 10 },
  iconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.warning + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  autoTitle: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 8 },
  autoDesc: { fontSize: 13, color: Colors.fgMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.fgSecondary, alignSelf: 'flex-start', marginBottom: 12 },
  numBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  numBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  numBtnT: { fontSize: 18, fontWeight: '900', color: Colors.fgPrimary },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, color: Colors.fgPrimary, fontSize: 14 },
  techRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techName: { fontSize: 15, fontWeight: '800', color: Colors.fgPrimary },
  techStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  roleBtn: { width: 40, height: 32, borderRadius: 8, backgroundColor: Colors.bgHover, alignItems: 'center', justifyContent: 'center' },
  roleBtnActive: { backgroundColor: Colors.primary },
  roleT: { fontSize: 10, fontWeight: '800', color: Colors.fgMuted },
  roleTActive: { color: Colors.bgSurface },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: Colors.bgHover, alignItems: 'center', justifyContent: 'center' },
  cancelT: { fontSize: 14, fontWeight: '800', color: Colors.fgSecondary },
  assignBtn: { flex: 2, height: 50, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  assignT: { fontSize: 14, fontWeight: '900', color: Colors.bgSurface },
});
