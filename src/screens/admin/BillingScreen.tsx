import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl, Modal, TextInput } from 'react-native';
import { IndianRupee, Trash2 } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image, Alert, TouchableOpacity, Platform } from 'react-native';

export default function BillingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [customGst, setCustomGst] = useState('18');
  const [base64Logo, setBase64Logo] = useState('https://ui-avatars.com/api/?name=SK+Tech&background=0D8ABC&color=fff&size=128');

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/orders/all'); setData((d || []).filter((o: any) => o.status === 'completed' || o.status === 'delivered' || o.orderType === 'offline')); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  
  useEffect(() => { 
    load();
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

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  const generateInvoiceHtml = (order: any, gstRateStr: string) => {
    const invId = `INV-${order._id?.slice(-6).toUpperCase()}`;
    const date = formatDate(order.createdAt);
    const gstRate = parseFloat(gstRateStr) || 0;
    const subtotal = order.totalAmount / (1 + gstRate / 100);
    const gst = order.totalAmount - subtotal;
    const logoUri = base64Logo;

    const itemsHtml = order.products?.map((p: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.product?.name || 'Product'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity || 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(p.price || 0).toLocaleString()}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" style="padding: 12px; text-align: center;">Service/Product Details</td></tr>`;

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', sans-serif; color: #333; padding: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f8fafc; padding: 12px; text-align: left; font-weight: bold; color: #334155; border-bottom: 2px solid #cbd5e1; }
            .totals { width: 50%; float: right; border-top: 2px solid #cbd5e1; padding-top: 12px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #1e3a8a; margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px; }
            .footer { clear: both; margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="width: 25%; display: flex; justify-content: center; align-items: center; border-right: 2px solid #000; padding-right: 20px;">
              <img src="https://ui-avatars.com/api/?name=SK+Tech&background=0D8ABC&color=fff&size=128" style="width: 80px; height: 80px; border-radius: 40px;" />
            </div>
            <div style="width: 70%; text-align: center;">
              <h1 style="color: #1e3a8a; font-size: 34px; font-weight: 900; margin: 0; text-transform: uppercase;">SK TECHNOLOGY</h1>
              <p style="font-size: 10px; color: #333; margin: 4px 0;">2/222 A, Down Street, Berigai Road, Shoolagiri, Krishnagiri, Tamil Nadu - 635117</p>
              <p style="font-size: 10px; color: #333; margin: 4px 0;">Mobile: 9600975483 | GSTIN: 33BWOPN1889F1Z4 | PAN: BWOPN1889F</p>
            </div>
          </div>
          <div style="background-color: #1e3a8a; color: white; text-align: center; font-weight: bold; font-size: 16px; padding: 12px; margin-bottom: 20px; border: 1px solid #000;">
            TAX INVOICE
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border: 1px solid #000; padding: 16px;">
            <div>
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">BILLED TO:</p>
              <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${order.customer?.name || order.customerName || 'Guest'}</p>
              <p style="margin: 4px 0;"><strong>Delivery Address:</strong><br/>${order.deliveryAddress || 'Store Pickup'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">INVOICE DETAILS:</p>
              <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invId}</p>
              <p style="margin: 4px 0;"><strong>Invoice Date:</strong> ${date}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> Cash on Delivery</p>
              <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${order.paymentStatus === 'paid' ? 'PAID' : (order.paymentStatus || 'PENDING').toUpperCase()}</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Amount</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="width: 50%;"></div>
            <div class="totals">
              <div class="totals-row"><span>Subtotal:</span><span>₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
              <div class="totals-row"><span>GST (${gstRate}%):</span><span>₹${gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
              <div class="totals-row grand-total"><span>Grand Total:</span><span>₹${(order.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
            </div>
          </div>
          <div class="footer">Thank you for choosing SK Technology! For any support, please contact sales@sktechnology.services.</div>
        </body>
      </html>
    `;
  };

  const generateAndSharePdf = async (order: any, gstRateStr: string) => {
    try {
      setLoading(true);
      const html = generateInvoiceHtml(order, gstRateStr);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert('Error', 'Please allow popups to print the invoice');
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Download / Share Invoice' });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Billing & Invoices</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><IndianRupee color={Colors.primary} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.customer?.name || item.customerName || 'Customer'}</Text>
              <Text style={s.cSub}>INV-{item._id?.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.amt}>₹{item.totalAmount?.toLocaleString()}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => { setPreviewInvoice(item); setCustomGst((item.gstPercentage !== undefined ? item.gstPercentage : 18).toString()); }} style={s.dlBtn}>
                  <Text style={s.dlBtnT}>View Invoice</Text>
                </TouchableOpacity>
                {item.orderType === 'offline' && (
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert('Delete Bill', 'Are you sure you want to delete this manual bill?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                          try {
                            await fetchWithAuth(`/orders/${item._id}`, { method: 'DELETE' });
                            load();
                          } catch (e: any) { Alert.alert('Error', e.message); }
                        }}
                      ]);
                    }} 
                    style={[s.dlBtn, { borderColor: Colors.danger + '40', backgroundColor: Colors.danger + '10' }]}
                  >
                    <Trash2 color={Colors.danger} size={12} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No billing records found</Text>} />

      <Modal visible={!!previewInvoice} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={[s.modalContent, { maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={s.modalTitle}>Tax Invoice</Text>
              <TouchableOpacity onPress={() => setPreviewInvoice(null)}><Text style={{ color: Colors.danger, fontWeight: '800' }}>Close</Text></TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: '800', color: Colors.fgPrimary, fontSize: 18 }}>SK TECHNOLOGY</Text>
              <Text style={{ fontSize: 12, color: Colors.fgMuted }}>GSTIN: 33BWOPN1889F1Z4</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: Colors.bgSurface, padding: 12, borderRadius: 12 }}>
              <View>
                <Text style={{ fontSize: 11, color: Colors.fgMuted, textTransform: 'uppercase', fontWeight: '800' }}>Billed To</Text>
                <Text style={{ fontWeight: '700', color: Colors.fgPrimary, marginTop: 4 }}>{previewInvoice?.customer?.name || 'Guest'}</Text>
                <Text style={{ fontSize: 12, color: Colors.fgMuted }}>{previewInvoice?.deliveryAddress || 'Store Pickup'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: Colors.fgMuted, textTransform: 'uppercase', fontWeight: '800' }}>Invoice Details</Text>
                <Text style={{ fontWeight: '700', color: Colors.fgPrimary, marginTop: 4 }}>INV-{previewInvoice?._id?.slice(-6).toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: Colors.fgMuted }}>{formatDate(previewInvoice?.createdAt)}</Text>
              </View>
            </View>

            <FlatList
              data={previewInvoice?.products || []}
              keyExtractor={(item, idx) => idx.toString()}
              style={{ marginBottom: 16 }}
              renderItem={({ item: p }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.fgPrimary }}>{p.product?.name || 'Service Item'}</Text>
                    <Text style={{ fontSize: 12, color: Colors.fgMuted }}>Qty: {p.quantity || 1} × ₹{(p.price || 0).toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primaryLight }}>₹{((p.price || 0) * (p.quantity || 1)).toLocaleString()}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20, color: Colors.fgMuted }}>Service/Product Details Only</Text>}
            />

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.fgMuted, marginBottom: 6 }}>CUSTOMIZE GST PERCENTAGE (%)</Text>
              <TextInput 
                style={{ backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 44, color: Colors.fgPrimary, fontSize: 14 }}
                value={customGst}
                onChangeText={setCustomGst}
                keyboardType="number-pad"
                placeholder="e.g. 18, 12, 5, 0"
                placeholderTextColor={Colors.fgMuted}
              />
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: Colors.fgMuted }}>Subtotal</Text>
                <Text style={{ fontSize: 13, color: Colors.fgPrimary }}>₹{Math.round((previewInvoice?.totalAmount || 0) / (1 + (parseFloat(customGst) || 0) / 100)).toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: Colors.fgMuted }}>GST ({parseFloat(customGst) || 0}%)</Text>
                <Text style={{ fontSize: 13, color: Colors.fgPrimary }}>₹{Math.round((previewInvoice?.totalAmount || 0) - ((previewInvoice?.totalAmount || 0) / (1 + (parseFloat(customGst) || 0) / 100))).toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.fgPrimary }}>Grand Total</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primaryLight }}>₹{(previewInvoice?.totalAmount || 0).toLocaleString()}</Text>
              </View>
            </View>

            <Button title="Print / Download PDF" onPress={() => generateAndSharePdf(previewInvoice, customGst)} style={{ marginTop: 24 }} size="lg" loading={loading} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 16, fontWeight: '900', color: Colors.success, marginBottom: 8 },
  dlBtn: { backgroundColor: Colors.primaryFaint, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '30' },
  dlBtnT: { fontSize: 10, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
});
