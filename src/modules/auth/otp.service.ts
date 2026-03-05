const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export function generateOtp(): { code: string; expiresAt: Date } {
  const code = Math.floor(
    Math.pow(10, OTP_LENGTH - 1) + Math.random() * 9 * Math.pow(10, OTP_LENGTH - 1)
  ).toString();
  return {
    code,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  };
}

export function isOtpValid(
  code: string,
  storedCode: string | undefined,
  expiresAt: Date | undefined
): boolean {
  if (!storedCode || !expiresAt) return false;
  if (expiresAt < new Date()) return false;
  return storedCode === code;
}
