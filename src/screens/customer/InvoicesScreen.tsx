import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl, Alert, Image } from 'react-native';
import { FileText, Download, Package } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { Badge } from '../../components/ui';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';

export default function InvoicesScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const { isAuthenticated } = useAuth();

  const loadInvoices = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await fetchWithAuth('/orders/my-orders');
      setOrders(data || []);
      
      try {
        const assetSrc = Image.resolveAssetSource(require('../../../assets/logo.png'));
        setLogoBase64(assetSrc.uri);
      } catch(e) { console.log('Logo load error', e) }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) loadInvoices(); else setLoading(false); }, [isAuthenticated]);

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  const generateInvoiceHtml = (order: any) => {
    const invId = `INV-${order._id?.slice(-6).toUpperCase()}`;
    const date = formatDate(order.createdAt);
    const gstRate = order.gstPercentage !== undefined ? order.gstPercentage : 18;
    const subtotal = order.totalAmount / (1 + gstRate / 100);
    const gst = order.totalAmount - subtotal;
    const logoUri = 'https://sk-tech-cctv.onrender.com/assets/logo.png';

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
            
            .payment-section { display: flex; justify-content: space-between; margin-top: 40px; border-top: 2px solid #000; padding-top: 20px; }
            .bank-details { width: 45%; font-size: 12px; }
            .bank-details h3 { color: #1e3a8a; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; text-decoration: underline; }
            .bank-details p { margin: 4px 0; font-weight: bold; color: #333; }
            .qr-section { width: 25%; text-align: center; border-left: 1px solid #000; padding-left: 20px; }
            .qr-img { width: 120px; height: 120px; margin-bottom: 8px; border: 2px solid #000; padding: 4px; }
            .qr-text { font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; }
            .qr-apps { font-size: 10px; color: #fff; background-color: #1e3a8a; padding: 4px; border-radius: 8px; font-weight: bold; display: inline-block; }
            .qr-sub { font-size: 10px; color: #666; margin-top: 4px; font-weight: bold; }
            .signatory { width: 30%; text-align: right; display: flex; flex-direction: column; justify-content: flex-end; }
            .signatory p { border-top: 2px solid #000; padding-top: 8px; font-weight: bold; font-size: 14px; margin: 0; }
            .signatory span { font-size: 12px; color: #1e3a8a; font-weight: bold; margin-top: 4px; }

            .footer { clear: both; margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="width: 100%; text-align: center;">
              <img src="https://ui-avatars.com/api/?name=SK+Tech&background=0D8ABC&color=fff&size=128" style="width: 80px; height: 80px; border-radius: 40px; margin-bottom: 10px;" />
              <h1 style="color: #1e3a8a; font-size: 34px; font-weight: 900; margin: 0; text-transform: uppercase; font-family: sans-serif;">SK TECHNOLOGY</h1>
              <h3 style="color: #dc2626; font-style: italic; font-size: 16px; margin: 4px 0; font-weight: bold;">YOUR LIFE IS IN YOUR HANDS</h3>
              <p style="font-size: 12px; font-weight: bold; margin: 8px 0; color: #1e3a8a;">CCTV | BIOMETRIC | VIDEO DOOR PHONE | NETWORKING<br/>BURGLAR ALARM | UPS | DESKTOP & LAPTOP SERVICES</p>
              <p style="font-size: 10px; color: #333; margin: 4px 0; font-weight: 500;">2/222 A, Down Street, Berigai Road, Shoolagiri, Krishnagiri, Tamil Nadu - 635117</p>
              <p style="font-size: 10px; color: #333; margin: 4px 0; font-weight: 500;">Mobile: 9600975483 | GSTIN: 33BWOPN1889F1Z4 | PAN: BWOPN1889F</p>
              <p style="font-size: 10px; color: #333; margin: 4px 0; font-weight: 500;">Email: sktechnologycctv@gmail.com</p>
            </div>
          </div>
          
          <div style="background-color: #1e3a8a; color: white; text-align: center; font-weight: bold; font-size: 16px; padding: 12px; margin-bottom: 20px; text-transform: uppercase; border: 1px solid #000;">
            BILL OF SUPPLY
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border: 1px solid #000; padding: 16px;">
            <div>
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">BILLED TO:</p>
              <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${order.customer?.name || order.user?.name || 'Guest'}</p>
              <p style="margin: 4px 0;"><strong>Delivery Address:</strong><br/>${order.deliveryAddress || 'Store Pickup'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">INVOICE DETAILS:</p>
              <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invId}</p>
              <p style="margin: 4px 0;"><strong>Invoice Date:</strong> ${date}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> Cash on Delivery</p>
              <p style="margin: 4px 0;"><strong>Payment Status:</strong> ${order.paymentStatus?.toUpperCase() || 'PENDING'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="width: 50%;">
              <!-- Spacer for left side if needed -->
            </div>
            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="totals-row">
                <span>GST (${gstRate}%):</span>
                <span>₹${gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div class="totals-row grand-total">
                <span>Grand Total:</span>
                <span>₹${(order.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          <div class="payment-section" style="justify-content: flex-end;">
            <div class="signatory">
              <p>AUTHORISED SIGNATORY</p>
              <span>FOR SK TECHNOLOGY</span>
            </div>
          </div>

          <div class="footer">
            Thank you for choosing SK Technology! For any support, please contact support@sktechnology.com.
          </div>
        </body>
      </html>
    `;
  };

  const generateAndSharePdf = async (order: any) => {
    try {
      setLoading(true);
      const html = generateInvoiceHtml(order);
      const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download / Share Invoice' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (order: any) => {
    generateAndSharePdf(order);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.header}><Text style={s.title}>My Invoices</Text></View>
      <FlatList 
        data={orders} 
        keyExtractor={o => o._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInvoices} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}><FileText color={Colors.primaryLight} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.invId}>INV-{item._id?.slice(-6).toUpperCase()}</Text>
                <Text style={s.invDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Badge label={(item.status === 'delivered' || item.status === 'completed') ? 'PAID' : 'PENDING'} color={(item.status === 'delivered' || item.status === 'completed') ? 'green' : 'amber'} />
            </View>
            <View style={s.cardBottom}>
              <View>
                <Text style={s.subT}>Order Total</Text>
                <Text style={s.total}>₹{item.totalAmount?.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={s.dlBtn} onPress={() => handleDownload(item)}>
                <Download color="#fff" size={16} /><Text style={s.dlBtnT}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Text style={s.emptyT}>No invoices found</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  invId: { fontSize: 16, fontWeight: '900', color: Colors.fgPrimary },
  invDate: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  subT: { fontSize: 11, color: Colors.fgMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  total: { fontSize: 20, fontWeight: '900', color: Colors.primaryLight, marginTop: 4 },
  dlBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  dlBtnT: { fontSize: 12, fontWeight: '800', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyT: { fontSize: 14, color: Colors.fgMuted, fontWeight: '700' },
});
