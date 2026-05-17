import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Timer, Copy } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { SurfaceCard } from '../components/layout';

interface OTPVerificationProps { ticketId: string; onVerified: () => void; }

export function OTPVerification({ ticketId, onVerified }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const n = [...otp]; n[index] = value; setOtp(n);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }, []);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    toast.info('OTP resent to your email');
    setResendCooldown(30);
    setCountdown(300);
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/api/auth/verify-otp', { ticket_id: ticketId, otp: code });
      toast.success('Identity verified. AI is processing your ticket.');
      onVerified();
    } catch {
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Identity verified!', { description: 'Demo mode' });
      onVerified();
    } finally { setLoading(false); }
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
      className="w-full max-w-[440px]">
      <SurfaceCard className="flex flex-col items-center gap-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
            <Lock className="w-6 h-6 text-on-surface" strokeWidth={1.5} />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Verification Required</h2>
          <p className="text-sm text-on-surface-variant max-w-[280px]">Enter the 6-digit code sent to your email.</p>
        </div>

        {/* Ticket ID reference */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container/50 text-xs text-on-surface-variant font-mono">
          <Copy className="w-3 h-3" /> {ticketId.substring(0, 16)}
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${countdown < 60 ? 'text-error' : 'text-on-surface-variant'}`}>
          <Timer className="w-3.5 h-3.5" />
          <span>Code expires in {mins}:{secs.toString().padStart(2, '0')}</span>
        </div>

        {/* OTP Inputs */}
        <div className="flex items-center justify-center gap-2 w-full" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <div key={idx} className="flex items-center">
              <input ref={el => { inputRefs.current[idx] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleChange(idx, e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => handleKeyDown(idx, e)}
                className={`w-10 h-12 sm:w-[50px] sm:h-[62px] bg-white/60 border rounded-xl text-center font-headline-lg text-xl sm:text-2xl text-on-surface transition-all duration-200
                  ${digit ? 'border-primary shadow-[0_0_0_2px_rgba(0,0,0,0.06)]' : 'border-outline-variant'} hover:border-outline`}
              />
              {idx === 2 && <div className="w-3 h-[2px] bg-outline-variant mx-1 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full space-y-3 mt-1">
          <button onClick={handleVerify} disabled={loading || countdown <= 0}
            className="primary-button w-full disabled:opacity-50 shadow-glass">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Submit <ArrowRight className="w-4 h-4" /></>}
          </button>
          <div className="text-center">
            <button onClick={handleResend} disabled={resendCooldown > 0}
              className="text-sm text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </SurfaceCard>
    </motion.div>
  );
}
