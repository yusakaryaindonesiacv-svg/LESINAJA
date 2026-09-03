import React from 'react';
import { OtpVerificationModal } from './OtpVerificationModal';
import { VerificationSession } from '../../utils/emailValidator';
import { OtpChannel } from '../../utils/otpService';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  studentName?: string;
  phone?: string;
  channel?: OtpChannel;
  initialSession: VerificationSession | null;
  onSuccess: (verifiedEmail: string) => void;
  onCancel: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  studentName,
  phone,
  channel = 'email',
  initialSession,
  onSuccess,
  onCancel
}) => {
  return (
    <OtpVerificationModal
      isOpen={isOpen}
      channel={channel}
      identifier={channel === 'whatsapp' && phone ? phone : email}
      studentName={studentName}
      email={email}
      phone={phone}
      initialSession={initialSession}
      onSuccess={(verifiedIdentifier) => onSuccess(verifiedIdentifier)}
      onCancel={onCancel}
    />
  );
};
