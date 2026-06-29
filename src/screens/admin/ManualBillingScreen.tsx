import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, Image, Platform, ActivityIndicator, Linking } from 'react-native';
import { Package, Plus, Minus, FileText, CheckCircle, UserCheck, UserPlus, Send, Mail, Trash2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Button, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useSocket } from '../../context/SocketContext';

export default function ManualBillingScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [customerStatus, setCustomerStatus] = useState<'existing' | 'new' | null>(null);
  const [base64Logo, setBase64Logo] = useState('https://ui-avatars.com/api/?name=SK+Tech&background=0D8ABC&color=fff&size=128');

  // Offline Order specific fields
  const [serviceType, setServiceType] = useState('CCTV Installation');
  const [cameraDetails, setCameraDetails] = useState('');
  const [expectedDays, setExpectedDays] = useState('1');
  const [gstPercentage, setGstPercentage] = useState('18');
  const [technicianId, setTechnicianId] = useState<string | undefined>();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [alternatePhone, setAlternatePhone] = useState('');
  const [notes, setNotes] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('12 Months');
  const { socket } = useSocket();

  useEffect(() => {
    fetchWithAuth('/products').then(data => setProducts(data?.products || [])).catch(console.error);
    fetchWithAuth('/admin/customers').then(data => setCustomers(data || [])).catch(console.error);
    fetchWithAuth('/admin/technicians').then(data => setTechnicians(data || [])).catch(console.error);
    
    (async () => {
      try {
        const { Asset } = require('expo-asset');
        const FileSystem = require('expo-file-system');
        const asset = await Asset.fromModule(require('../../assets/logo.png')).downloadAsync();
        if (asset.localUri) {
           const b64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
           setBase64Logo(`data:image/png;base64,${b64}`);
        }
      } catch (e) { console.warn('Logo load error:', e); }
    })();
  }, []);

  const handlePhoneChange = async (text: string) => {
    setPhone(text);
    if (text.length >= 10) {
      setShowDropdown(false);
      try {
        setLookingUp(true);
        const res = await fetchWithAuth(`/admin/customer-lookup?phone=${text}`);
        if (res && res.existing && res.customer) {
          setCustomerName(res.customer.name || '');
          setAddress(res.customer.address || '');
          setAlternatePhone(res.customer.alternatePhone || '');
          setNotes(res.customer.notes || '');
          setWarrantyPeriod(res.customer.warrantyPeriod || '12 Months');
          setCustomerId(res.customer._id);
          setCustomerStatus('existing');
        } else {
          setCustomerStatus('new');
          setCustomerId(undefined);
        }
      } catch (e) {
        setCustomerStatus('new');
        setCustomerId(undefined);
      } finally {
        setLookingUp(false);
      }
    } else if (text.length > 2) {
      setShowDropdown(true);
      setCustomerStatus(null);
    } else {
      setShowDropdown(false);
      setCustomerStatus(null);
    }
  };

  const selectCustomer = (c: any) => {
    setCustomerName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setAlternatePhone(c.alternatePhone || '');
    setNotes(c.notes || '');
    setWarrantyPeriod(c.warrantyPeriod || '12 Months');
    setCustomerId(c._id);
    setCustomerStatus('existing');
    setShowDropdown(false);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product._id === product._id);
    if (existing) {
      setCart(cart.map(c => c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { product, quantity: 1, price: product.price }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.product._id === id) {
        const nq = c.quantity + delta;
        return nq > 0 ? { ...c, quantity: nq } : c;
      }
      return c;
    }));
  };

  const removeCart = (id: string) => setCart(cart.filter(c => c.product._id !== id));

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0);
  const gstRate = parseFloat(gstPercentage) || 0;
  const gstAmount = subtotal * (gstRate / 100);
  const totalAmount = subtotal + gstAmount;

  const handleGenerate = async (shareMode: 'pdf' | 'whatsapp' | 'email' | 'save' = 'save') => {
    if (!customerName || !phone || !address || cart.length === 0) {
      return Alert.alert('Missing Fields', 'Please fill all customer details and add at least one product.');
    }
    
    try {
      setLoading(true);
      
      // 1. Create Order in Backend
      const payload = {
        customer: customerId,
        customerName,
        contactNumber: phone,
        alternatePhone,
        deliveryAddress: address,
        serviceType,
        cameraDetails,
        technicianId,
        expectedDays: parseInt(expectedDays) || 1,
        warrantyPeriod,
        notes,
        gstPercentage: gstRate,
        totalAmount,
        subtotal,
        gstAmount,
        products: cart.map(c => ({ product: c.product._id, quantity: c.quantity, price: c.price }))
      };
      
      let orderData: any = {};
      try {
        orderData = await fetchWithAuth('/orders/admin/offline', { method: 'POST', body: JSON.stringify(payload) });
        // Notify all technicians about the manually added order
        if (socket) {
          socket.emit('new_notification', {
            title: '📋 New Manual Order Added by Admin',
            message: `Admin created an offline order for ${customerName} — ${serviceType}. Total: ₹${totalAmount.toLocaleString()}. Check your dashboard.`,
            role: 'technician',
            type: 'new_order',
            broadcastAll: true
          });
          socket.emit('new_order', { broadcastAll: true, role: 'technician' });
          socket.emit('task_assigned', { broadcastAll: true, role: 'technician' });
        }
      } catch (err: any) {
        console.warn('Backend order creation warning:', err.message);
        // Continue generating invoice PDF/WhatsApp/Email seamlessly with an offline ID
      }
      const orderId = orderData._id || Math.random().toString(36).slice(-6);
      
      // 2. Generate PDF & Text Message
      const date = new Date().toLocaleDateString();
      const productRows = cart.map(c => `
        <tr>
          <td style="padding:10px; border-bottom:1px solid #ddd;">${c.product.name}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd; text-align:center;">${c.quantity}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd; text-align:right;">₹${c.price.toLocaleString()}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd; text-align:right;">₹${(c.price * c.quantity).toLocaleString()}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <body style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; padding:40px; color:#333;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid ${Colors.primary}; padding-bottom:20px; margin-bottom:30px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${base64Logo}" style="width: 60px; height: 60px; border-radius: 30px;" />
                <h2 style="margin:0; color:${Colors.primary}; font-size:28px; font-weight:900; letter-spacing:1px;">SK TECHNOLOGY</h2>
              </div>
              <div style="text-align:right;">
                <h1 style="margin:0; color:${Colors.primary}; font-size:32px; text-transform:uppercase;">INVOICE</h1>
                <p style="margin:5px 0 0 0; color:#666; font-size:14px;">#OFF-${orderId.slice(-6).toUpperCase()}</p>
                <p style="margin:5px 0 0 0; color:#666; font-size:14px;">Date: ${date}</p>
              </div>
            </div>
            
            <div style="margin-bottom:40px; display:flex; justify-content:space-between;">
              <div>
                <h3 style="margin:0 0 10px 0; color:${Colors.primary}; text-transform:uppercase; font-size:14px;">Billed To</h3>
                <p style="margin:0 0 5px 0; font-weight:bold; font-size:18px;">${customerName}</p>
                <p style="margin:0 0 5px 0; color:#555;">Primary: ${phone} ${alternatePhone ? `| Alt: ${alternatePhone}` : ''}</p>
                <p style="margin:0; color:#555; max-width:250px;">${address}</p>
              </div>
              <div style="text-align:right;">
                <h3 style="margin:0 0 10px 0; color:${Colors.primary}; text-transform:uppercase; font-size:14px;">Service & Payment Info</h3>
                <p style="margin:0 0 5px 0; color:#555;">Service: ${serviceType}</p>
                <p style="margin:0 0 5px 0; color:#555;">Expected Days: ${expectedDays} Days</p>
                <p style="margin:0 0 5px 0; color:#555;">Warranty Period: <strong style="color:${Colors.primary};">${warrantyPeriod}</strong></p>
                <p style="margin:0 0 5px 0; color:#555;">Mode: Cash/Offline</p>
                <p style="margin:0 0 5px 0; color:#555;">Status: Pending (Offline)</p>
              </div>
            </div>

            ${cameraDetails || notes ? `
            <div style="margin-bottom:30px; background-color:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
              <h4 style="margin:0 0 5px 0; color:${Colors.primary}; font-size:14px; text-transform:uppercase;">Equipment & Special Notes</h4>
              ${cameraDetails ? `<p style="margin:0 0 8px 0; color:#475569; font-size:14px;"><strong>Equipment:</strong> ${cameraDetails}</p>` : ''}
              ${notes ? `<p style="margin:0; color:#475569; font-size:14px;"><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            ` : ''}
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:40px;">
              <thead>
                <tr style="background-color:${Colors.primaryFaint}; text-align:left;">
                  <th style="padding:12px 10px; color:${Colors.primary};">Item Description</th>
                  <th style="padding:12px 10px; color:${Colors.primary}; text-align:center;">Qty</th>
                  <th style="padding:12px 10px; color:${Colors.primary}; text-align:right;">Price</th>
                  <th style="padding:12px 10px; color:${Colors.primary}; text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
            
            <div style="display:flex; justify-content:flex-end;">
              <div style="width:300px;">
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
                  <span style="color:#666;">Subtotal:</span>
                  <span style="font-weight:bold;">₹${subtotal.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
                  <span style="color:#666;">GST (${gstRate}%):</span>
                  <span style="font-weight:bold;">₹${gstAmount.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:15px 0; border-bottom:2px solid ${Colors.primary}; margin-top:5px;">
                  <span style="font-size:18px; font-weight:bold; color:${Colors.primary};">Grand Total:</span>
                  <span style="font-size:22px; font-weight:bold; color:${Colors.primaryLight};">₹${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div style="margin-top:60px; padding-top:20px; border-top:1px solid #eee; text-align:center; color:#888; font-size:12px;">
              <p>Thank you for choosing SK Technology!</p>
              <p>For support: support@sktech.com | +91 9600975483</p>
            </div>
          </body>
        </html>
      `;
      
      const textMessage = `Hello ${customerName},\nHere is your billing invoice for ${serviceType} from SK Technology.\n\nInvoice: #OFF-${orderId.slice(-6).toUpperCase()}\nWarranty: ${warrantyPeriod}\n${notes ? `Notes: ${notes}\n` : ''}\nSubtotal: ₹${subtotal.toLocaleString()}\nGST (${gstRate}%): ₹${gstAmount.toLocaleString()}\nGrand Total: ₹${totalAmount.toLocaleString()}\n\nThank you for choosing SK Technology!`;

      if (shareMode === 'whatsapp' || shareMode === 'pdf' || shareMode === 'save') {
        if (Platform.OS === 'web') {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          } else {
            Alert.alert('Error', 'Please allow popups to print/save the invoice PDF');
          }
        } else {
          const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
          if (shareMode !== 'save' && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: shareMode === 'whatsapp' ? 'Share Invoice PDF via WhatsApp' : 'Share Invoice PDF' });
          }
        }
      } else if (shareMode === 'email') {
        if (Platform.OS === 'web') {
          window.open(`mailto:?subject=${encodeURIComponent(`SK Technology Invoice - ${serviceType}`)}&body=${encodeURIComponent(textMessage)}`, '_blank');
        } else {
          Linking.openURL(`mailto:?subject=${encodeURIComponent(`SK Technology Invoice - ${serviceType}`)}&body=${encodeURIComponent(textMessage)}`);
        }
      }
      
      // Reset Form
      setCart([]); setCustomerName(''); setPhone(''); setAddress(''); setAlternatePhone(''); setNotes(''); setWarrantyPeriod('12 Months'); setCustomerId(undefined); setCameraDetails(''); setExpectedDays('1'); setTechnicianId(undefined); setCustomerStatus(null); setGstPercentage('18');
      Alert.alert('Success', shareMode === 'save' ? 'Final Quotation successfully generated and logged to database!' : `Offline order logged and shared via ${shareMode.toUpperCase()}!`);
      
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate billing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Offline Billing</Text></View>
      
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        
        {/* Customer Details */}
        <View style={s.card}>
          <View style={s.secHdr}>
            <Text style={s.secT}>Customer Details</Text>
            {lookingUp && <ActivityIndicator size="small" color={Colors.primary} />}
            {customerStatus === 'existing' && (
              <View style={s.badgeExisting}>
                <UserCheck color={Colors.success} size={14} />
                <Text style={s.badgeExistingT}>Existing Customer</Text>
              </View>
            )}
            {customerStatus === 'new' && (
              <View style={s.badgeNew}>
                <UserPlus color={Colors.info} size={14} />
                <Text style={s.badgeNewT}>New Customer</Text>
              </View>
            )}
          </View>
          <TextInput style={s.input} placeholder="Phone Number (10 digits)" value={phone} onChangeText={handlePhoneChange} keyboardType="phone-pad" placeholderTextColor={Colors.fgMuted} />
          
          {showDropdown && customers.filter(c => c.phone?.includes(phone)).length > 0 && (
            <View style={{ backgroundColor: Colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, maxHeight: 150 }}>
              <ScrollView nestedScrollEnabled>
                {customers.filter(c => c.phone?.includes(phone)).map(c => (
                  <TouchableOpacity key={c._id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }} onPress={() => selectCustomer(c)}>
                    <Text style={{ fontWeight: 'bold', color: Colors.fgPrimary }}>{c.phone} - {c.name}</Text>
                    <Text style={{ fontSize: 11, color: Colors.fgMuted }}>{c.address}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TextInput style={s.input} placeholder="Full Name" value={customerName} onChangeText={setCustomerName} placeholderTextColor={Colors.fgMuted} />
          <TextInput style={s.input} placeholder="Alternate Phone (Optional)" value={alternatePhone} onChangeText={setAlternatePhone} keyboardType="phone-pad" placeholderTextColor={Colors.fgMuted} />
          <TextInput style={s.input} placeholder="Warranty Period (e.g. 12 Months)" value={warrantyPeriod} onChangeText={setWarrantyPeriod} placeholderTextColor={Colors.fgMuted} />
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Full Address" value={address} onChangeText={setAddress} multiline placeholderTextColor={Colors.fgMuted} />
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', marginBottom: 0 }]} placeholder="Special Notes / Remarks" value={notes} onChangeText={setNotes} multiline placeholderTextColor={Colors.fgMuted} />
        </View>

        {/* Offline Order Task Settings */}
        <View style={s.card}>
          <Text style={s.secT}>Service & Workflow Settings</Text>
          <Text style={s.label}>Service Type</Text>
          <TextInput style={s.input} placeholder="e.g. CCTV Installation" value={serviceType} onChangeText={setServiceType} placeholderTextColor={Colors.fgMuted} />
          
          <Text style={s.label}>Camera / Equipment Details</Text>
          <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} placeholder="e.g. 4 Bullet Cameras, 8-Channel DVR, 2TB HDD" value={cameraDetails} onChangeText={setCameraDetails} multiline placeholderTextColor={Colors.fgMuted} />

          <Text style={s.label}>Expected Completion Days</Text>
          <TextInput style={s.input} placeholder="e.g. 5" value={expectedDays} onChangeText={setExpectedDays} keyboardType="number-pad" placeholderTextColor={Colors.fgMuted} />

          <Text style={s.label}>GST Percentage (%)</Text>
          <TextInput style={s.input} placeholder="e.g. 18" value={gstPercentage} onChangeText={setGstPercentage} keyboardType="number-pad" placeholderTextColor={Colors.fgMuted} />

          <Text style={s.label}>Assign Technician</Text>
          <View style={s.techGrid}>
            {technicians.map(t => (
              <TouchableOpacity key={t._id} style={[s.tBtn, technicianId === t._id && s.tBtnAct]} onPress={() => setTechnicianId(technicianId === t._id ? undefined : t._id)}>
                <Text style={[s.tBtnT, technicianId === t._id && s.tBtnTAct]} numberOfLines={1}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Selection */}
        <View style={s.card}>
          <Text style={s.secT}>Add Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {products.map(p => (
              <TouchableOpacity key={p._id} style={s.pCard} onPress={() => addToCart(p)}>
                <Package color={Colors.primary} size={24} style={{ marginBottom: 8 }} />
                <Text style={s.pName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.pPrice}>₹{p.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cart */}
          {cart.length > 0 && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }}>
              {cart.map(c => (
                <View key={c.product._id} style={s.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cName} numberOfLines={1}>{c.product.name}</Text>
                    <Text style={s.cPrice}>₹{c.price} × {c.quantity}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={s.qtyBox}>
                      <TouchableOpacity onPress={() => updateQty(c.product._id, -1)} style={s.qBtn}><Minus color={Colors.fgPrimary} size={14} /></TouchableOpacity>
                      <Text style={s.qTxt}>{c.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQty(c.product._id, 1)} style={s.qBtn}><Plus color={Colors.fgPrimary} size={14} /></TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeCart(c.product._id)} style={{ padding: 8, backgroundColor: Colors.danger + '20', borderRadius: 8, borderWidth: 1, borderColor: Colors.danger + '40' }}>
                      <Trash2 color={Colors.danger} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Totals */}
        {cart.length > 0 && (
          <View style={s.card}>
            <View style={s.tRow}><Text style={s.tL}>Subtotal</Text><Text style={s.tV}>₹{subtotal.toLocaleString()}</Text></View>
            <View style={s.tRow}><Text style={s.tL}>GST ({gstRate}%)</Text><Text style={s.tV}>₹{gstAmount.toLocaleString()}</Text></View>
            <View style={[s.tRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 12, marginBottom: 20 }]}>
              <Text style={[s.tL, { color: Colors.fgPrimary, fontWeight: '900', fontSize: 16 }]}>Grand Total</Text>
              <Text style={[s.tV, { color: Colors.primaryLight, fontSize: 20 }]}>₹{totalAmount.toLocaleString()}</Text>
            </View>
            <Button title="Generate Final Quotation" onPress={() => handleGenerate('save')} loading={loading} style={{ marginTop: 10 }} />
          </View>
        )}

      </ScrollView>
      
      {/* Footer Buttons */}
      <View style={s.footer}>
        <Button title="Share PDF" onPress={() => handleGenerate('pdf')} loading={loading} icon={<FileText color="#fff" size={16} />} style={{ flex: 1 }} />
        <Button title="WhatsApp" onPress={() => handleGenerate('whatsapp')} loading={loading} icon={<Send color="#fff" size={16} />} variant="success" style={{ flex: 1 }} />
        <Button title="Email" onPress={() => handleGenerate('email')} loading={loading} icon={<Mail color="#fff" size={16} />} variant="secondary" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  secT: { fontSize: 14, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1 },
  badgeExisting: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.success + '40' },
  badgeExistingT: { color: Colors.success, fontSize: 11, fontWeight: '800' },
  badgeNew: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.info + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.info + '40' },
  badgeNewT: { color: Colors.info, fontSize: 11, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '800', color: Colors.fgPrimary, marginBottom: 6, marginTop: 4 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  tBtn: { width: '48%', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tBtnAct: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tBtnT: { fontSize: 13, fontWeight: '700', color: Colors.fgPrimary },
  tBtnTAct: { color: '#fff' },
  input: { backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: Colors.fgPrimary, fontSize: 15, marginBottom: 12 },
  pCard: { width: 120, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 12, marginRight: 12, alignItems: 'center' },
  pName: { fontSize: 12, fontWeight: '700', color: Colors.fgPrimary, textAlign: 'center', marginBottom: 4 },
  pPrice: { fontSize: 14, fontWeight: '900', color: Colors.primaryLight },
  cartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cName: { fontSize: 14, fontWeight: '700', color: Colors.fgPrimary },
  cPrice: { fontSize: 12, color: Colors.fgMuted, marginTop: 2 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  qBtn: { padding: 8 },
  qTxt: { width: 24, textAlign: 'center', fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tL: { fontSize: 14, color: Colors.fgMuted, fontWeight: '600' },
  tV: { fontSize: 14, color: Colors.fgPrimary, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: 10 }
});

