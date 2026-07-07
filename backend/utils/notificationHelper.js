const Notification = require('../models/Notification');
const User = require('../models/User');
const axios = require('axios');
const path = require('path');
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@sktech.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ─── Firebase Admin SDK Init ────────────────────────────────────────────────
let firebaseAdmin = null;
let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return firebaseAdmin;
  try {
    const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        // If it's a base64 encoded string from Render environment variables
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
      }
    } else {
      try {
        serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
      } catch (e) {
        console.warn('[Firebase Admin] Warning: No FIREBASE_SERVICE_ACCOUNT env var found and local JSON file is missing. FCM pushes will not work.');
      }
    }
    
    if (serviceAccount && getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    
    if (getApps().length > 0) {
      firebaseAdmin = getApp();
      firebaseInitialized = true;
      console.log('[Firebase Admin] Initialized successfully.');
    }
  } catch (err) {
    console.error('[Firebase Admin] Init failed:', err.message);
  }
  return firebaseAdmin;
};

// ─── Send via Firebase Admin (FCM) ──────────────────────────────────────────
const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return;

  // Filter to valid Expo push tokens (ExponentPushToken[...]) or FCM tokens
  const validTokens = tokens.filter(t => t && typeof t === 'string' && t.trim() !== '');
  if (validTokens.length === 0) return;

  // Separate Expo tokens from native FCM tokens
  const expoTokens = validTokens.filter(t => t.startsWith('ExponentPushToken'));
  const fcmTokens  = validTokens.filter(t => !t.startsWith('ExponentPushToken'));

  // ── Send to Expo Push API for ExponentPushTokens ──
  if (expoTokens.length > 0) {
    try {
      const messages = expoTokens.map(token => ({
        to: token,
        sound: 'default',
        priority: 'high',
        channelId: 'high_priority_alerts',
        title,
        body,
        data: { ...data }
      }));

      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        messages,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      // Log Expo push errors per token
      const results = Array.isArray(response.data?.data) ? response.data.data : [];
      results.forEach((result, idx) => {
        if (result.status === 'error') {
          console.error(`[Expo Push] Token ${expoTokens[idx]} error: ${result.message} (${result.details?.error})`);
        }
      });

      console.log(`[Expo Push] Sent to ${expoTokens.length} device(s) via Expo Push API.`);
    } catch (expoErr) {
      console.error('[Expo Push Error]', expoErr?.response?.data || expoErr.message);
    }
  }

  // ── Send native FCM tokens via Firebase Admin ──
  if (fcmTokens.length > 0) {
    const admin = initFirebase();
    if (!admin) {
      console.warn('[Firebase Admin] Cannot send native FCM tokens because initialization failed.');
      return;
    }
    try {
      const multicastMessage = {
        tokens: fcmTokens,
        notification: { title, body },
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_priority_alerts',
            // Omitted explicit sound/icon overrides so FCM uses app manifest defaults natively
          }
        },
        data: Object.fromEntries(
          Object.entries({ ...data }).map(([k, v]) => [k, String(v ?? '')])
        )
      };

      const { getMessaging } = require('firebase-admin/messaging');
      const fcmResponse = await getMessaging(admin).sendEachForMulticast(multicastMessage);
      console.log('\n======================================================');
      console.log(`o. [GLOBAL NOTIFICATION VERIFIED] FCM Native Push Triggered!`);
      console.log(`   Success: ${fcmResponse.successCount}, Failures: ${fcmResponse.failureCount}`);
      console.log('======================================================\n');
      
      fcmResponse.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`[FCM] Token ${fcmTokens[idx]} error:`, res.error?.message);
        }
      });
    } catch (fcmErr) {
      console.error('[FCM Error]', fcmErr.message);
    }
  }
};

// ─── Main createNotification ─────────────────────────────────────────────────
/**
 * Creates a notification in the database, emits via Socket.io, 
 * and sends a physical push notification (via Expo or FCM).
 *
 * @param {Object} app - Express app instance
 * @param {Object} data - Notification data
 * @param {String} [data.userId] - Optional target user ID
 * @param {String} data.role - Target role ('admin', 'technician', 'customer', 'all')
 * @param {String} data.type - Notification type (e.g., 'new_order', 'workflow_update')
 * @param {String} data.title - Optional title (falls back to 'SK Tech CCTV')
 * @param {String} data.message - Notification message body
 * @param {String} [data.orderId] - Optional associated order ID
 */
const createNotification = async (app, data) => {
  try {
    const notification = new Notification({
      userId:  data.userId,
      role:    data.role,
      type:    data.type,
      message: data.message,
      orderId: data.orderId
    });

    await notification.save();

    // ── Socket.io real-time emit ──
    const io = app.get('socketio');
    if (io) {
      if (data.userId) {
        io.to(data.userId.toString()).emit('new_notification', notification);
      }
      io.to(`role:${data.role}`).emit('new_notification', notification);
      console.log(`[Notification] Socket emitted → role:${data.role}${data.userId ? ` & user ${data.userId}` : ''}`);
    }

    // ── Gather push tokens ──
    let pushTokens = [];
    let webPushSubs = [];
    try {
      if (data.userId) {
        const user = await User.findById(data.userId).select('pushToken webPushSubscription');
        if (user?.pushToken) pushTokens.push(user.pushToken);
        if (user?.webPushSubscription) webPushSubs.push(user.webPushSubscription);
      } else if (data.role) {
        const query = data.role === 'all' ? {} : { role: data.role };
        const users = await User.find(query).select('pushToken webPushSubscription');
        pushTokens = users.map(u => u.pushToken).filter(Boolean);
        webPushSubs = users.map(u => u.webPushSubscription).filter(Boolean);
      }

      if (pushTokens.length > 0) {
        const title = data.title || 'SK Tech CCTV';
        await sendFCMNotification(
          pushTokens,
          title,
          data.message,
          { orderId: data.orderId || '', type: data.type || '' }
        );
      } else {
        console.log('[Push Notification] No mobile push tokens found for this notification.');
      }

      // ── Dispatch Web Push ──
      if (webPushSubs.length > 0 && process.env.VAPID_PUBLIC_KEY) {
        const payload = JSON.stringify({
          title: data.title || 'SK Tech CCTV',
          body: data.message,
          data: {
            url: data.orderId ? `/admin/orders` : `/admin/dashboard`,
            orderId: data.orderId || '',
            type: data.type || ''
          }
        });

        await Promise.allSettled(
          webPushSubs.map(sub => 
            webpush.sendNotification(sub, payload).catch(err => {
              if (err.statusCode === 410) {
                // Subscription has expired or is no longer valid, we should ideally remove it from the DB
                console.log('[Web Push] Subscription expired for a user.');
              } else {
                console.error('[Web Push Error]', err);
              }
            })
          )
        );
        console.log(`[Web Push] Sent to ${webPushSubs.length} browser(s).`);
      }
    } catch (pushError) {
      console.error('[Push Notification Error]', pushError.message);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Helper Error]', error);
    return null;
  }
};

module.exports = { createNotification };
