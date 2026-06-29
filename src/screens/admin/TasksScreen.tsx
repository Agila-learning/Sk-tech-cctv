import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, ScrollView, Image, Linking } from 'react-native';
import { ClipboardList, Plus, Trash2, Edit2, X, Phone, MessageCircle, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Button, Badge } from '../../components/ui';
import { useSocket } from '../../context/SocketContext';

export default function AdminTasksScreen({ navigation }: any) {
  const [data, setData] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'internal' | 'service'>('internal');
  const [serviceTasks, setServiceTasks] = useState<any[]>([]);
  const [infoModal, setInfoModal] = useState<any>(null);
  const { socket } = useSocket();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [assignee, setAssignee] = useState<string | null>(null);
  
  // Warranty & Customer tracking for Internal Tasks
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('12 Months');

  const load = async () => {
    try { 
      setLoading(true); 
      const [d, t, o] = await Promise.all([
        fetchWithAuth('/internal/tasks'), 
        fetchWithAuth('/admin/technicians'),
        fetchWithAuth('/orders/all')
      ]); 
      
      const orders = o || [];
      const internalOrders = orders.filter((x: any) => x.serviceType?.startsWith('Internal Task:'));
      const standardOrders = orders.filter((x: any) => !x.serviceType?.startsWith('Internal Task:'));

      const legacyTasks = d || [];
      setData([...legacyTasks, ...internalOrders]); 
      
      setTechs(t || []);
      
      const service = standardOrders.filter((x: any) => ['in_progress', 'pending_approval', 'completed'].includes(x.status));
      setServiceTasks(service);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (socket) {
      socket.on('order_updated', load);
      return () => { socket.off('order_updated', load); };
    }
  }, [socket]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setPriority('medium'); setStatus('pending'); setAssignee(null); setEditingId(null);
    setCustomerName(''); setCustomerPhone(''); setWarrantyPeriod('12 Months');
  };

  const openAdd = () => { resetForm(); setModalVisible(true); };

  const openEdit = (task: any) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setAssignee(task.assignee?._id || null);
    setCustomerName(task.customerName || '');
    setCustomerPhone(task.customerPhone || '');
    setWarrantyPeriod(task.warrantyPeriod || '12 Months');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!title) return Alert.alert('Error', 'Title is required');
    try {
      setLoading(true);

      if (editingId && !editingId.startsWith('new_')) {
        // Editing Legacy Internal Task
        const payload = { title, description, priority, status, assignee, customerName, customerPhone, warrantyPeriod };
        await fetchWithAuth(`/internal/tasks/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        // Create new Internal Task AS AN OFFLINE ORDER (enables Order ID & Photo Workflow)
        const payload = {
          customerName: customerName || 'Internal Admin',
          contactNumber: customerPhone || '0000000000',
          deliveryAddress: 'Internal Site / HQ',
          serviceType: `Internal Task: ${title}`,
          cameraDetails: `Priority: ${priority}`,
          technicianId: assignee,
          expectedDays: 1,
          warrantyPeriod: warrantyPeriod || '12 Months',
          notes: description,
          gstPercentage: 0,
          totalAmount: 0,
          subtotal: 0,
          gstAmount: 0,
          products: []
        };
        await fetchWithAuth('/orders/admin/offline', { method: 'POST', body: JSON.stringify(payload) });
      }

      if (socket) {
        const notifMsg = customerName 
          ? `New Customer Task: ${title} for ${customerName}. Warranty: ${warrantyPeriod}.` 
          : `New internal task added: ${title} with Full Tracking Workflow.`;
          
        socket.emit('new_notification', {
          title: `📋 New Task Added: ${title}`,
          message: notifMsg,
          role: 'technician',
          type: 'new_task',
          broadcastAll: true
        });
        socket.emit('new_notification', {
          title: `📋 New Task Added: ${title}`,
          message: notifMsg,
          role: 'admin',
          type: 'new_task',
          broadcastAll: true
        });
        socket.emit('new_order', { broadcastAll: true, role: 'technician' });
        socket.emit('task_assigned', { broadcastAll: true, role: 'technician' });
      }
      setModalVisible(false);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try { await fetchWithAuth(`/internal/tasks/${id}`, { method: 'DELETE' }); load(); }
          catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const openServiceDetails = async (order: any) => {
    try {
      setLoading(true);
      const wf = await fetchWithAuth(`/orders/workflow/${order._id}`);
      setInfoModal({ order, workflow: wf });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleApproval = async (action: 'approve' | 'rework', notes?: string) => {
    try {
      await fetchWithAuth(`/admin/orders/${infoModal.order._id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes })
      });
      setInfoModal(null);
      Alert.alert('Success', `Task ${action}d successfully`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <Text style={s.title}>Tasks</Text>
        {tab === 'internal' && <TouchableOpacity style={s.addBtn} onPress={openAdd}><Plus color="#fff" size={20} /></TouchableOpacity>}
      </View>
      
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 12 }}>
        <TouchableOpacity style={[s.tabBtn, tab === 'internal' && s.tabBtnAct]} onPress={() => setTab('internal')}>
          <Text style={[s.tabBtnT, tab === 'internal' && s.tabBtnTAct]}>Internal Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab === 'service' && s.tabBtnAct]} onPress={() => setTab('service')}>
          <Text style={[s.tabBtnT, tab === 'service' && s.tabBtnTAct]}>Technician Service</Text>
        </TouchableOpacity>
      </View>

      {tab === 'internal' ? (
        <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isOrderBacked = !!item.serviceType;
            const itemTitle = isOrderBacked ? item.serviceType.replace('Internal Task: ', '') : (item.title || 'Task');
            const itemPriority = isOrderBacked ? (item.cameraDetails?.replace('Priority: ', '') || 'medium') : (item.priority || 'medium');
            const cName = isOrderBacked ? item.customerName : item.customerName;
            const cPhone = isOrderBacked ? item.contactNumber : item.customerPhone;
            const assignedTech = isOrderBacked ? item.technician : item.assignee;
            
            return (
              <View style={s.card}>
                <View style={s.row}>
                  <View style={[s.ic, isOrderBacked && { backgroundColor: Colors.purple + '20' }]}><ClipboardList color={isOrderBacked ? Colors.purple : Colors.primary} size={20} /></View>
                  <View style={s.info}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.cName} numberOfLines={1}>{itemTitle}</Text>
                      {isOrderBacked && (
                        <View style={[s.badge, { backgroundColor: Colors.purple + '20' }]}>
                          <Text style={[s.badgeT, { color: Colors.purple }]}>ID: #{item._id.slice(-6).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.cSub}>Priority: {itemPriority}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: item.status === 'completed' ? Colors.success + '20' : Colors.warning + '20' }]}>
                    <Text style={[s.badgeT, { color: item.status === 'completed' ? Colors.success : Colors.warning }]}>{item.status}</Text>
                  </View>
                </View>

                {assignedTech && (
                  <Text style={s.assigneeTxt}>Assigned to: {assignedTech.name}</Text>
                )}

                {cName && cName !== 'Internal Admin' && (
                  <View style={{ marginTop: 8, padding: 10, backgroundColor: Colors.bgSurface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.fgPrimary }}>Customer: {cName}</Text>
                    {cPhone && cPhone !== '0000000000' ? <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 2 }}>Phone: {cPhone}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success + '15', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.success + '30' }}>
                      <ShieldCheck color={Colors.success} size={14} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.success, marginLeft: 6 }}>Warranty: {item.warrantyPeriod || '12 Months'} (Active)</Text>
                    </View>
                  </View>
                )}

                {isOrderBacked ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Button title="View Full Details & Photos" onPress={() => openServiceDetails(item)} size="sm" variant="secondary" />
                  </View>
                ) : (
                  <View style={s.actions}>
                    <TouchableOpacity style={s.aBtn} onPress={() => openEdit(item)}><Edit2 color={Colors.primary} size={16} /></TouchableOpacity>
                    <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.danger + '15' }]} onPress={() => handleDelete(item._id)}><Trash2 color={Colors.danger} size={16} /></TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }} ListEmptyComponent={<Text style={s.empty}>No internal tasks found</Text>} />
      ) : (
        <FlatList data={serviceTasks} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => openServiceDetails(item)}>
              <View style={s.row}>
                <View style={[s.ic, {backgroundColor: Colors.infoFaint}]}><ClipboardList color={Colors.info} size={20} /></View>
                <View style={s.info}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.cName} numberOfLines={1}>Order #{item._id?.slice(-6)}</Text>
                    <View style={[s.badge, { paddingVertical: 2, paddingHorizontal: 6, backgroundColor: item.orderType === 'offline' ? Colors.purple + '20' : Colors.info + '20' }]}>
                      <Text style={[s.badgeT, { fontSize: 8, color: item.orderType === 'offline' ? Colors.purple : Colors.info }]}>{item.orderType || 'online'}</Text>
                    </View>
                  </View>
                  <Text style={s.cSub}>{item.category || 'Service'}</Text>
                </View>
                {item.followUp?.required && item.followUp?.status === 'pending' && (
                  <Badge label="Follow-Up" color="amber" size="sm" />
                )}
                <Badge label={item.status === 'pending_approval' ? 'Pending Review' : item.status} color={item.status === 'pending_approval' ? 'amber' : 'green'} size="sm" />
              </View>
              {item.technician && <Text style={s.assigneeTxt}>Technician: {item.technician.name}</Text>}
              
              {(() => {
                const startDate = new Date(item.warrantyStartDate || item.updatedAt || item.createdAt || Date.now());
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 12);
                const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isExpired ? Colors.danger + '15' : Colors.success + '15', padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: isExpired ? Colors.danger + '30' : Colors.success + '30' }}>
                    {isExpired ? <ShieldAlert color={Colors.danger} size={16} /> : <ShieldCheck color={Colors.success} size={16} />}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isExpired ? Colors.danger : Colors.success, marginLeft: 8 }}>
                      {isExpired ? 'Warranty Expired (Paid Service)' : `Warranty Active (${diffDays} days left)`}
                    </Text>
                  </View>
                );
              })()}

              {item.followUp?.required && item.followUp?.status === 'pending' && item.followUp?.note && (
                <View style={{ backgroundColor: Colors.warning + '15', padding: 10, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: Colors.warning + '40' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.warning }}>Follow-up Note: {item.followUp.note}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryFaint, borderWidth: 1, borderColor: Colors.primary + '40', paddingVertical: 10, borderRadius: 10, gap: 6 }} onPress={() => Linking.openURL(`tel:${item.contactNumber || item.customer?.phone}`).catch(() => Alert.alert('Error', 'Could not open phone'))}>
                  <Phone color={Colors.primary} size={14} />
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '800' }}>Call Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, gap: 6 }} onPress={() => navigation.navigate('OrderChat', { orderId: item._id, orderStatus: item.status, customerName: item.customerName || item.customer?.name })}>
                  <MessageCircle color="#fff" size={14} />
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '800' }}>Chat w/ Customer</Text>
                </TouchableOpacity>
              </View>

              <Button title="View Photos & Details" onPress={() => openServiceDetails(item)} style={{ marginTop: 12 }} size="sm" variant="secondary" />
            </TouchableOpacity>
          )} ListEmptyComponent={<Text style={s.empty}>No technician tasks pending</Text>} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.mHdr}><Text style={s.mT}>{editingId ? 'Edit Task' : 'Add Task'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity></View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              
              <TextInput style={s.input} placeholder="Task Title" placeholderTextColor={Colors.fgDim} value={title} onChangeText={setTitle} />
              <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor={Colors.fgDim} value={description} onChangeText={setDescription} multiline />
              
              <Text style={s.label}>Customer Details & Warranty (Optional)</Text>
              <TextInput style={s.input} placeholder="Customer Name" placeholderTextColor={Colors.fgDim} value={customerName} onChangeText={setCustomerName} />
              <TextInput style={s.input} placeholder="Customer Phone" placeholderTextColor={Colors.fgDim} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
              <TextInput style={s.input} placeholder="Warranty Period (e.g. 12 Months)" placeholderTextColor={Colors.fgDim} value={warrantyPeriod} onChangeText={setWarrantyPeriod} />

              
              <Text style={s.label}>Priority</Text>
              <View style={s.pickerRow}>
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <TouchableOpacity key={p} style={[s.pBtn, priority === p && s.pBtnAct]} onPress={() => setPriority(p)}>
                    <Text style={[s.pBtnT, priority === p && s.pBtnTAct]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Status</Text>
              <View style={s.pickerRow}>
                {['pending', 'in_progress', 'completed', 'blocked'].map(st => (
                  <TouchableOpacity key={st} style={[s.pBtn, status === st && s.pBtnAct]} onPress={() => setStatus(st)}>
                    <Text style={[s.pBtnT, status === st && s.pBtnTAct]}>{st.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Assign Technician</Text>
              <View style={s.techGrid}>
                {techs.map(t => (
                  <TouchableOpacity key={t._id} style={[s.tBtn, assignee === t._id && s.pBtnAct]} onPress={() => setAssignee(assignee === t._id ? null : t._id)}>
                    <Text style={[s.tBtnT, assignee === t._id && s.pBtnTAct]} numberOfLines={1}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title={editingId ? 'Update Task' : 'Save Task'} onPress={handleSave} loading={loading} style={{ marginTop: 20 }} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!infoModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { height: '85%' }]}>
            <View style={s.mHdr}>
              <View style={{ flex: 1 }}>
                <Text style={s.mT}>
                  {infoModal?.order?.serviceType?.startsWith('Internal Task:')
                    ? infoModal.order.serviceType.replace('Internal Task: ', '')
                    : 'Task Details & Media'}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.purple, fontWeight: '800', marginTop: 2 }}>
                  Order ID: #{infoModal?.order?._id?.slice(-6).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInfoModal(null)}><X color={Colors.fgPrimary} size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>

              {/* Order ID & Customer Overview Card */}
              <View style={{ backgroundColor: Colors.bgSurface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.purple + '40', marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ backgroundColor: Colors.purple + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: Colors.purple }}>#{infoModal?.order?._id?.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View style={{ backgroundColor: infoModal?.order?.status === 'completed' ? Colors.success + '20' : Colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: infoModal?.order?.status === 'completed' ? Colors.success : Colors.warning }}>{(infoModal?.order?.status || 'pending').toUpperCase()}</Text>
                  </View>
                </View>

                {infoModal?.order?.customerName && infoModal.order.customerName !== 'Internal Admin' && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.fgPrimary }}>{infoModal.order.customerName}</Text>
                    {infoModal?.order?.contactNumber && infoModal.order.contactNumber !== '0000000000' && (
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryFaint, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.primary + '30' }}
                        onPress={() => Linking.openURL(`tel:${infoModal.order.contactNumber}`).catch(() => Alert.alert('Error', 'Could not open phone'))}
                      >
                        <Phone color={Colors.primary} size={14} />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.primary }}>Call: {infoModal.order.contactNumber}</Text>
                      </TouchableOpacity>
                    )}
                    {infoModal?.order?.warrantyPeriod && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '15', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.success + '30', marginTop: 4 }}>
                        <ShieldCheck color={Colors.success} size={13} />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.success }}>Warranty: {infoModal.order.warrantyPeriod}</Text>
                      </View>
                    )}
                  </View>
                )}

                {infoModal?.order?.notes && (
                  <View style={{ marginTop: 10, backgroundColor: Colors.bgMuted, padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.fgMuted, textTransform: 'uppercase', marginBottom: 4 }}>Task Notes</Text>
                    <Text style={{ fontSize: 13, color: Colors.fgPrimary }}>{infoModal.order.notes}</Text>
                  </View>
                )}
              </View>

            {infoModal?.workflow ? (
              <View style={{ flex: 1 }}>
                <Text style={[s.cName, {marginBottom: 8}]}>Technician: {infoModal.workflow.technician?.name || 'Not yet assigned'}</Text>
                
                {infoModal.workflow.stages?.started?.photo?.url && (
                  <View style={{ marginBottom: 20, backgroundColor: Colors.bgCard, padding: 12, borderRadius: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.info, marginBottom: 8 }}>Task Started Verification</Text>
                    <Image source={{ uri: infoModal.workflow.stages.started.photo.url?.startsWith('http') ? infoModal.workflow.stages.started.photo.url : `https://sk-tech-cctv.onrender.com${infoModal.workflow.stages.started.photo.url}` }} style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                    {infoModal.workflow.stages?.started?.photo?.coordinates && (
                      <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 8 }}>Loc: {infoModal.workflow.stages.started.photo.coordinates.lat.toFixed(4)}, {infoModal.workflow.stages.started.photo.coordinates.lng.toFixed(4)}</Text>
                    )}
                  </View>
                )}

                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 8 }}>In-Progress Media</Text>
                <FlatList
                  data={infoModal.workflow.stages?.inProgress?.photos || []}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, marginBottom: 20 }}
                  renderItem={({ item: p }) => (
                      <View>
                        <Image source={{ uri: p.url?.startsWith('http') ? p.url : `https://sk-tech-cctv.onrender.com${p.url}` }} style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                        <Text style={{ fontSize: 10, color: Colors.fgMuted, marginTop: 4 }}>{new Date(p.timestamp).toLocaleTimeString()}</Text>
                      </View>
                  )}
                  ListEmptyComponent={<Text style={s.empty}>No progress photos.</Text>}
                />

                {infoModal.workflow.stages?.completed?.photo?.url && (
                  <View style={{ marginTop: 20, backgroundColor: Colors.bgCard, padding: 12, borderRadius: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.success, marginBottom: 8 }}>Completion Evidence</Text>
                    <Image source={{ uri: infoModal.workflow.stages.completed.photo.url?.startsWith('http') ? infoModal.workflow.stages.completed.photo.url : `https://sk-tech-cctv.onrender.com${infoModal.workflow.stages.completed.photo.url}` }} style={{ width: '100%', height: 150, borderRadius: 12, backgroundColor: Colors.bgSurface }} />
                    {infoModal.workflow.stages?.completed?.photo?.coordinates && (
                      <Text style={{ fontSize: 12, color: Colors.fgMuted, marginTop: 8 }}>Loc: {infoModal.workflow.stages.completed.photo.coordinates.lat.toFixed(4)}, {infoModal.workflow.stages.completed.photo.coordinates.lng.toFixed(4)}</Text>
                    )}
                  </View>
                )}

                {infoModal.order?.status === 'pending_approval' && (
                  <View style={{ marginTop: 24, gap: 12 }}>
                    <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.success, height: 44 }]} onPress={() => handleApproval('approve')}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Approve Task & Release Technician</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.aBtn, { backgroundColor: Colors.danger, height: 44 }]} onPress={() => {
                      Alert.prompt('Rework Required', 'Enter reason for rework:', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Send for Rework', onPress: (notes: any) => handleApproval('rework', notes) }
                      ]);
                    }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reject & Send for Rework</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : <Text style={s.empty}>No media submitted yet.</Text>}
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
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 16, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 12, color: Colors.fgMuted, fontWeight: '800', textTransform: 'uppercase' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeT: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  assigneeTxt: { fontSize: 12, color: Colors.primaryLight, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  aBtn: { flex: 1, height: 36, borderRadius: 10, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mT: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, height: 54, color: Colors.fgPrimary, fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  label: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary, marginTop: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border },
  pBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pBtnT: { fontSize: 13, fontWeight: '700', color: Colors.fgMuted, textTransform: 'capitalize' },
  pBtnTAct: { color: '#fff' },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tBtn: { width: '48%', paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tBtnT: { fontSize: 13, fontWeight: '700', color: Colors.fgPrimary },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  tabBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnT: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary },
  tabBtnTAct: { color: '#fff' }
});
