import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';

const ANALYTICS_COLLECTION = 'analytics_events';
const SESSIONS_COLLECTION = 'active_sessions';
const ADMIN_LOGS_COLLECTION = 'admin_logs';
const SEARCH_COLLECTION = 'search_events';

// ----------------------------------------------------
// Client System Environment Detectors
// ----------------------------------------------------
export const getSessionId = () => {
  let id = sessionStorage.getItem('lazrhub_session_id');
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('lazrhub_session_id', id);
  }
  return id;
};

export const getDeviceType = () => {
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
};

export const getOS = () => {
  const ua = navigator.userAgent || '';
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac') && !ua.includes('iPhone') && !ua.includes('iPad')) return 'macOS';
  if (ua.includes('CrOS')) return 'ChromeOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other';
};

export const getBrowser = () => {
  const ua = navigator.userAgent || '';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  return 'Other';
};

export const getReferrerCategory = () => {
  const ref = document.referrer || '';
  if (!ref) return 'Direct';
  const lower = ref.toLowerCase();
  if (lower.includes('google.')) return 'Google';
  if (lower.includes('bing.')) return 'Bing';
  if (lower.includes('duckduckgo.')) return 'DuckDuckGo';
  if (lower.includes('discord.')) return 'Discord';
  if (lower.includes('reddit.')) return 'Reddit';
  if (lower.includes('github.')) return 'GitHub';
  if (lower.includes('twitter.') || lower.includes('x.com') || lower.includes('instagram.') || lower.includes('facebook.')) return 'Social Media';
  return 'Other Websites';
};

export const getEstimatedCountry = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('America/New_York') || tz.includes('America/Chicago') || tz.includes('America/Los_Angeles') || tz.includes('America/Denver')) {
      return 'United States';
    }
    if (tz.includes('America/Toronto') || tz.includes('America/Vancouver') || tz.includes('America/Edmonton')) {
      return 'Canada';
    }
    if (tz.includes('Europe/London')) return 'United Kingdom';
    if (tz.includes('Europe/Berlin') || tz.includes('Europe/Busingen')) return 'Germany';
    if (tz.includes('Europe/Paris')) return 'France';
    if (tz.includes('Australia/')) return 'Australia';
    if (tz.includes('Asia/Tokyo')) return 'Japan';
    if (tz.includes('America/Sao_Paulo')) return 'Brazil';
    if (tz.includes('Asia/Kolkata')) return 'India';

    // Parse region prefix
    const parts = tz.split('/');
    if (parts.length > 1) {
      return parts[1].replace(/_/g, ' ');
    }
    return tz || 'Unknown Region';
  } catch {
    return 'Unknown Region';
  }
};

// ----------------------------------------------------
// Real-Time Event Tracking API
// ----------------------------------------------------

// 1. Initialize Active User Session Heartbeat & Track Page View
export const initAnalyticsSession = async () => {
  const sessionId = getSessionId();
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];

  const sessionData = {
    sessionId,
    lastActive: nowIso,
    deviceType: getDeviceType(),
    os: getOS(),
    browser: getBrowser(),
    country: getEstimatedCountry(),
    referrer: getReferrerCategory(),
  };

  // Ping active sessions in Firestore
  try {
    await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), sessionData, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', `${SESSIONS_COLLECTION}/${sessionId}`);
  }

  // Record initial page_view event for session if not already recorded in session
  if (!sessionStorage.getItem('lazrhub_pageview_recorded')) {
    sessionStorage.setItem('lazrhub_pageview_recorded', 'true');
    try {
      await addDoc(collection(db, ANALYTICS_COLLECTION), {
        type: 'page_view',
        timestamp: nowIso,
        date: dateStr,
        sessionId,
        deviceType: getDeviceType(),
        os: getOS(),
        browser: getBrowser(),
        country: getEstimatedCountry(),
        referrer: getReferrerCategory(),
      });
    } catch (err) {
      handleFirestoreError(err, 'write', ANALYTICS_COLLECTION);
    }
  }

  // Set up 30-second heartbeat to keep active session alive
  const heartbeat = setInterval(async () => {
    try {
      await setDoc(
        doc(db, SESSIONS_COLLECTION, sessionId),
        { lastActive: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, 'write', `${SESSIONS_COLLECTION}/${sessionId}`);
    }
  }, 30000);

  return () => clearInterval(heartbeat);
};

// 2. Track Game Launch Event
export const trackGameLaunch = async (game) => {
  if (!game || !game.id) return;
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];
  const sessionId = getSessionId();

  try {
    await addDoc(collection(db, ANALYTICS_COLLECTION), {
      type: 'game_launch',
      gameId: String(game.id),
      gameTitle: game.title || 'Untitled Game',
      category: game.category || 'Arcade',
      timestamp: nowIso,
      date: dateStr,
      sessionId,
      deviceType: getDeviceType(),
      os: getOS(),
      browser: getBrowser(),
      country: getEstimatedCountry(),
      referrer: getReferrerCategory(),
    });
  } catch (err) {
    handleFirestoreError(err, 'write', ANALYTICS_COLLECTION);
  }
};

// 3. Track Search Query Event
export const trackSearchQuery = async (queryText, resultCount = 0) => {
  if (!queryText || !queryText.trim()) return;
  const q = queryText.trim();
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];

  try {
    await addDoc(collection(db, SEARCH_COLLECTION), {
      query: q,
      resultCount,
      timestamp: nowIso,
      date: dateStr,
      sessionId: getSessionId(),
    });

    await addDoc(collection(db, ANALYTICS_COLLECTION), {
      type: 'search',
      query: q,
      resultCount,
      timestamp: nowIso,
      date: dateStr,
      sessionId: getSessionId(),
    });
  } catch (err) {
    handleFirestoreError(err, 'write', SEARCH_COLLECTION);
  }
};

// 4. Track Admin Action Log Event
export const trackAdminAction = async (action, target, adminEmail = 'Admin') => {
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];

  try {
    const logData = {
      action,
      target: target || 'System',
      adminEmail,
      timestamp: nowIso,
      date: dateStr,
    };

    await addDoc(collection(db, ADMIN_LOGS_COLLECTION), logData);
    await addDoc(collection(db, ANALYTICS_COLLECTION), {
      type: 'admin_action',
      ...logData,
    });
  } catch (err) {
    handleFirestoreError(err, 'write', ADMIN_LOGS_COLLECTION);
  }
};

// ----------------------------------------------------
// Real Analytics Subscription Listener for Dashboard
// ----------------------------------------------------
export const subscribeToRealAnalyticsData = (callback) => {
  const analyticsRef = collection(db, ANALYTICS_COLLECTION);
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const adminLogsRef = collection(db, ADMIN_LOGS_COLLECTION);
  const searchRef = collection(db, SEARCH_COLLECTION);

  let analyticsEvents = [];
  let activeSessions = [];
  let adminLogs = [];
  let searchEvents = [];

  const updateAndNotify = () => {
    callback({
      analyticsEvents,
      activeSessions,
      adminLogs,
      searchEvents,
    });
  };

  const unsubAnalytics = onSnapshot(analyticsRef, (snap) => {
    analyticsEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateAndNotify();
  }, (err) => handleFirestoreError(err, 'list', ANALYTICS_COLLECTION));

  const unsubSessions = onSnapshot(sessionsRef, (snap) => {
    activeSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateAndNotify();
  }, (err) => handleFirestoreError(err, 'list', SESSIONS_COLLECTION));

  const unsubAdminLogs = onSnapshot(adminLogsRef, (snap) => {
    adminLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateAndNotify();
  }, (err) => handleFirestoreError(err, 'list', ADMIN_LOGS_COLLECTION));

  const unsubSearch = onSnapshot(searchRef, (snap) => {
    searchEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    updateAndNotify();
  }, (err) => handleFirestoreError(err, 'list', SEARCH_COLLECTION));

  return () => {
    unsubAnalytics();
    unsubSessions();
    unsubAdminLogs();
    unsubSearch();
  };
};
