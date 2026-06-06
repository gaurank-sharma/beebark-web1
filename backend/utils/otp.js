const crypto = require('crypto');

// How long an OTP stays valid, and how many wrong attempts before it's invalidated
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between resends

// Generate a cryptographically-random 6-digit numeric code (000000–999999)
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

// Store only a hash of the OTP, never the raw value
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

// Timing-safe comparison of a candidate OTP against the stored hash
const verifyOtp = (candidate, storedHash) => {
  if (!storedHash) return false;
  const candidateHash = hashOtp(candidate);
  const a = Buffer.from(candidateHash);
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  generateOtp,
  hashOtp,
  verifyOtp
};
