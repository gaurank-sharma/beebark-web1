// Lazy Firebase Admin initialization. Returns null when not configured, so the
// rest of the app runs fine without Firebase set up. Configure by setting
// FIREBASE_SERVICE_ACCOUNT to the service-account JSON (as a single-line string).
let cachedAdmin = null;

const getAdmin = () => {
  if (cachedAdmin) return cachedAdmin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null; // not configured

  // require lazily so a missing package never crashes the server at boot
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(raw);
    // env vars often escape the private key's newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  cachedAdmin = admin;
  return cachedAdmin;
};

module.exports = { getAdmin };
