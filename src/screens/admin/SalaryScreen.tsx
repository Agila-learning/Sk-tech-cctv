import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { Plus, X } from 'lucide-react-native';
import { handleExport } from '../../utils/exportHelper';

export default function SalaryScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [techs, setTechs] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedTech, setSelectedTech] = useState('');
  const [cycle, setCycle] = useState('monthly');

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/salary/admin/all'); setData(d || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openModal = async () => {
    try {
      const t = await fetchWithAuth('/admin/technicians');
      setTechs(t || []);
      setModalVisible(true);
    } catch (e) { console.error(e); }
  };

  const handleRunPayroll = async () => {
    if (!selectedTech) return alert('Select a technician');
    try {
      setLoading(true);
      await fetchWithAuth('/salary/calculate', { method: 'POST', body: JSON.stringify({ technicianId: selectedTech, month, cycle }) });
      setModalVisible(false);
      load();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ type: 'bonus', amount: '', description: '' });
  const [configForm, setConfigForm] = useState({ uanNumber: '', panNumber: '' });

  const openDetails = async (item: any) => {
    try {
      setLoading(true);
      const detailed = await fetchWithAuth(`/salary/admin/technician/${item.technician._id}?month=${item.month}`);
      setConfigForm({ 
        uanNumber: detailed.technician?.uanNumber || '', 
        panNumber: detailed.technician?.panNumber || '' 
      });
      setDetailsModal(detailed);
    } catch(e) {
      setDetailsModal(item);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      await fetchWithAuth(`/salary/admin/config/${detailsModal.technician._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ uanNumber: configForm.uanNumber, panNumber: configForm.panNumber })
      });
      alert('Config updated successfully!');
    } catch(e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleUpdateComponent = async () => {
    if (!payoutForm.amount) return;
    try {
      setLoading(true);
      const fieldMap: any = {
        bonus: 'bonus',
        incentive: 'incentive',
        deduction: 'deductions',
        advance: 'advanceTaken',
        fixed: 'fixedSalary'
      };
      const field = fieldMap[payoutForm.type];
      
      await fetchWithAuth(`/salary/admin/salary/${detailsModal._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: Number(payoutForm.amount) })
      });
      setPayoutForm({ type: 'bonus', amount: '', description: '' });
      load();
      // refresh details
      const updated = await fetchWithAuth(`/salary/admin/technician/${detailsModal.technician._id}?month=${detailsModal.month}`);
      setDetailsModal(updated);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleExportPayslip = async (salary: any) => {
    try {
      setLoading(true);
      await handleExport(`/salary/admin/export?month=${salary.month}&format=pdf`, `Payslip_${salary.technician?.name || 'Staff'}_${salary.month}.pdf`);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Salary & Payroll</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => openDetails(item)}>
            <View style={s.ic}><CreditCard color={Colors.warning} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.technician?.name || 'Unknown Technician'}</Text>
              <Text style={s.cSub}>{item.month || 'Current Month'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.amt}>₹{item.totalPayable?.toLocaleString() || 0}</Text>
              <Badge label={item.status || 'pending'} color={item.status === 'processed' ? 'green' : 'amber'} />
            </View>
          </TouchableOpacity>
        )} ListEmptyComponent={<Text style={s.empty}>No payroll records found</Text>} />

      <TouchableOpacity style={s.fab} onPress={openModal}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {/* Details Modal */}
      {detailsModal && (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.modalBg} />
          <View style={[s.modalContent, { height: '95%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={s.modalTitle}>Salary Details</Text>
              <TouchableOpacity onPress={() => setDetailsModal(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <View>
                <Text style={{ color: Colors.fgMuted, fontSize: 12 }}>Technician</Text>
                <Text style={{ color: Colors.fgPrimary, fontWeight: 'bold', fontSize: 16 }}>{detailsModal.technician?.name || 'Unknown Technician'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: Colors.fgMuted, fontSize: 12 }}>Net Payable</Text>
                <Text style={{ color: Colors.success, fontWeight: 'bold', fontSize: 22 }}>₹{detailsModal.payout?.toLocaleString() || detailsModal.totalPayable?.toLocaleString() || 0}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ backgroundColor: Colors.primaryFaint, padding: 12, borderRadius: 12, flex: 1, marginRight: 8 }}>
                <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: 'bold' }}>Tasks Completed</Text>
                <Text style={{ color: Colors.fgPrimary, fontSize: 18, fontWeight: '900' }}>{detailsModal.tasksCompleted || 0}</Text>
              </View>
              <View style={{ backgroundColor: Colors.successFaint, padding: 12, borderRadius: 12, flex: 1, marginLeft: 8 }}>
                <Text style={{ color: Colors.success, fontSize: 12, fontWeight: 'bold' }}>Days Worked</Text>
                <Text style={{ color: Colors.fgPrimary, fontSize: 18, fontWeight: '900' }}>{detailsModal.workingDays || 0}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: Colors.bgCard, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 }}>
              <Text style={{ fontWeight: '800', color: Colors.fgPrimary, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}>Earnings</Text>
              <View style={s.tRow}><Text style={s.tL}>Basic Salary</Text><Text style={s.tV}>₹{detailsModal.fixedSalary || 0}</Text></View>
              <View style={s.tRow}><Text style={s.tL}>Incentives</Text><Text style={s.tV}>₹{detailsModal.incentive || 0}</Text></View>
              <View style={s.tRow}><Text style={s.tL}>Bonus</Text><Text style={s.tV}>₹{detailsModal.bonus || 0}</Text></View>
              
              <Text style={{ fontWeight: '800', color: Colors.fgPrimary, marginTop: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}>Deductions</Text>
              <View style={s.tRow}><Text style={s.tL}>Advances</Text><Text style={[s.tV, {color: Colors.danger}]}>- ₹{detailsModal.advanceTaken || 0}</Text></View>
              <View style={s.tRow}><Text style={s.tL}>Other Deductions</Text><Text style={[s.tV, {color: Colors.danger}]}>- ₹{detailsModal.deductions || 0}</Text></View>
            </View>

            <Text style={{ fontWeight: '800', color: Colors.fgPrimary, marginBottom: 12 }}>Edit Component</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['bonus', 'incentive', 'deduction', 'advance', 'fixed'].map(t => (
                <TouchableOpacity key={t} style={[s.cycleBtn, payoutForm.type === t && s.cycleBtnActive]} onPress={() => setPayoutForm({...payoutForm, type: t})}>
                  <Text style={[s.cycleBtnT, payoutForm.type === t && {color: '#fff'}]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.input} placeholder="Amount (₹)" keyboardType="numeric" value={payoutForm.amount} onChangeText={t => setPayoutForm({...payoutForm, amount: t})} />
            <TextInput style={s.input} placeholder="Description (Optional)" value={payoutForm.description} onChangeText={t => setPayoutForm({...payoutForm, description: t})} />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <Button title="Update Salary" onPress={handleUpdateComponent} style={{ flex: 1 }} loading={loading} />
              <Button title="Payslip" onPress={() => handleExportPayslip(detailsModal)} variant="secondary" style={{ flex: 1 }} />
            </View>

            <Text style={{ fontWeight: '800', color: Colors.fgPrimary, marginTop: 20, marginBottom: 12 }}>Compliance Info</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="UAN Number" value={configForm.uanNumber} onChangeText={t => setConfigForm({...configForm, uanNumber: t})} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="PAN Number" value={configForm.panNumber} onChangeText={t => setConfigForm({...configForm, panNumber: t})} />
            </View>
            <Button title="Save UAN/PAN" onPress={handleUpdateConfig} variant="secondary" style={{ marginTop: 8 }} loading={loading} />

          </ScrollView>
          </View>
        </View>
      )}

      {modalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <View style={s.modalBg} />
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Run Payroll</Text>
            
            <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Payment Cycle:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['hourly', 'weekly', 'monthly'].map(c => (
                <TouchableOpacity key={c} style={[s.cycleBtn, cycle === c && s.cycleBtnActive]} onPress={() => setCycle(c)}>
                  <Text style={[s.cycleBtnT, cycle === c && {color: '#fff'}]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Month (YYYY-MM):</Text>
            <TextInput style={s.input} placeholder="YYYY-MM" value={month} onChangeText={setMonth} />
            <Text style={{color: Colors.fgMuted, marginBottom: 8}}>Select Technician:</Text>
            <View style={{maxHeight: 150}}>
              <FlatList data={techs} keyExtractor={t => t._id} renderItem={({item: t}) => (
                <TouchableOpacity style={[s.techBtn, selectedTech === t._id && s.techBtnActive]} onPress={() => setSelectedTech(t._id)}>
                  <Text style={[s.techBtnT, selectedTech === t._id && {color: '#fff'}]}>{t.name}</Text>
                </TouchableOpacity>
              )} />
            </View>
            <View style={s.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Calculate" onPress={handleRunPayroll} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgSurface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 16, fontWeight: '900', color: Colors.warning, marginBottom: 4 },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalBg: { ...(StyleSheet.absoluteFill as any), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgSurface, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 16 },
  input: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.fgPrimary, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  techBtn: { padding: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginBottom: 8 },
  techBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  techBtnT: { color: Colors.fgPrimary, fontWeight: '600' },
  cycleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, alignItems: 'center' },
  cycleBtnActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  cycleBtnT: { color: Colors.fgPrimary, fontWeight: '700', fontSize: 12 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tL: { fontSize: 13, color: Colors.fgMuted, fontWeight: '600' },
  tV: { fontSize: 14, color: Colors.fgPrimary, fontWeight: '800' }
});
