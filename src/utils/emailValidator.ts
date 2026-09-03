/**
 * Re-exporting from unified OTP & Contact verification service for backward compatibility
 */
export * from './otpService';
export type { OtpSession as VerificationSession } from './otpService';
export { generateOtpSession as generateEmailOtp } from './otpService';
export { verifyOtpCode as verifyEmailOtp } from './otpService';
