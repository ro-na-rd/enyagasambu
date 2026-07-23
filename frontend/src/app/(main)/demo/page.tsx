'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Smartphone, CreditCard, Lock, CheckCircle, XCircle, Clock, MessageSquare, Phone, ArrowRight, AlertTriangle, Coins, Store, Search, Unlock, ChevronRight } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const GREEN = '#22c55e';
const RED = '#ef4444';
const MTN_YELLOW = '#ffcc00';
const AIRTEL_RED = '#ed1c24';

type Scenario = 'success' | 'paymentFail' | 'paymentPending' | 'wrongOtp' | 'expiredOtp' | 'retry';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  phoneContent: React.ReactNode;
  delay: number;
}

const POST_SCENARIOS: { key: Scenario; label: string; color: string }[] = [
  { key: 'success', label: 'Success Flow', color: GREEN },
  { key: 'paymentFail', label: 'Payment Declined', color: RED },
  { key: 'paymentPending', label: 'Payment Pending', color: MTN_YELLOW },
  { key: 'wrongOtp', label: 'Wrong OTP', color: RED },
  { key: 'expiredOtp', label: 'Expired OTP', color: RED },
];

const CONTACT_SCENARIOS: { key: Scenario; label: string; color: string }[] = [
  { key: 'success', label: 'Success Flow', color: GREEN },
  { key: 'paymentFail', label: 'Payment Cancelled', color: RED },
  { key: 'wrongOtp', label: 'Incorrect OTP', color: RED },
  { key: 'expiredOtp', label: 'Expired OTP', color: RED },
  { key: 'retry', label: 'Retry Flow', color: ORG },
];

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 320, maxWidth: '100%' }}>
      <div className="rounded-[2.5rem] overflow-hidden border-[6px] border-[#1a1a2e] bg-white"
        style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.3)', minHeight: 640 }}>
        <div className="bg-[#1a1a2e] py-1.5 flex justify-center">
          <div className="w-24 h-4 rounded-full bg-black" />
        </div>
        <div className="bg-[#0f1e42] px-4 py-2 flex justify-between items-center text-white text-[10px] font-semibold">
          <span>9:41</span>
          <span className="flex gap-1 items-center">
            <span>5G</span>
            <span>📶</span>
            <span>🔋</span>
          </span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SMSNotification({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[340px] bg-white rounded-2xl p-4"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'smsSlide 0.4s ease' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white text-sm">💬</div>
        <div>
          <div className="text-xs font-bold">Messages</div>
          <div className="text-[10px] text-gray-400">MTN Mobile Money</div>
        </div>
        <div className="ml-auto text-[10px] text-gray-400">now</div>
      </div>
      <div className="text-xs leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
}

function PhoneSimPanel({ show, amount, onApprove }: { show: boolean; amount: string; onApprove: () => void }) {
  if (!show) return null;
  return (
    <div className="bg-[#ffcc00] rounded-2xl p-5 text-center text-black">
      <div className="text-sm font-bold mb-1">MTN Mobile Money</div>
      <div className="text-[10px] opacity-60">Payment Request</div>
      <div className="text-3xl font-extrabold my-2">{amount} RWF</div>
      <div className="text-xs mb-3">E-Nyagasambu - Marketplace Fee</div>
      <div className="text-[10px] mb-2">Enter your PIN to approve:</div>
      <div className="flex gap-2 justify-center mb-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="w-8 h-8 border-2 border-black/20 rounded-lg bg-white flex items-center justify-center text-lg">●</div>
        ))}
      </div>
      <button onClick={onApprove}
        className="px-6 py-2 bg-black text-[#ffcc00] rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
        ✓ Approve Payment
      </button>
    </div>
  );
}

function SuccessResult({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5"
        style={{ animation: 'popIn 0.5s ease' }}>
        {icon}
      </div>
      <div className="text-lg font-extrabold mb-2" style={{ color: GREEN }}>{title}</div>
      <div className="text-xs text-gray-500 max-w-[260px]">{subtitle}</div>
    </div>
  );
}

function ErrorResult({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5"
        style={{ animation: 'shake 0.5s ease' }}>
        {icon}
      </div>
      <div className="text-lg font-extrabold mb-2" style={{ color: RED }}>{title}</div>
      <div className="text-xs text-gray-500 max-w-[260px]">{subtitle}</div>
    </div>
  );
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#E85D04] rounded-full mb-5"
        style={{ animation: 'spin 1s linear infinite' }} />
      <div className="text-sm font-bold text-[#0f1e42] mb-2">{text}</div>
      <div className="text-[10px] text-gray-400">Connecting to MTN Mobile Money gateway</div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-48 mx-auto mt-4">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>Processing</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-[#E85D04] rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SellerContactCard() {
  return (
    <div className="bg-white rounded-2xl p-5 mx-4 my-4" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.1)', animation: 'popIn 0.5s ease' }}>
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0f1e42] to-[#1a2d5a] flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold"
        style={{ animation: 'glow 2s ease-in-out infinite' }}>JK</div>
      <div className="text-center text-base font-extrabold text-[#0f1e42]">Jean Kalisa</div>
      <div className="text-center text-[10px] text-gray-400 mb-2">Kicukiro, Kigali · ⭐ 4.8</div>
      <div className="text-center text-sm font-bold mb-4" style={{ color: ORG }}>+250 788 987 654</div>
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 bg-[#0f1e42] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
          📞 Call
        </button>
        <button className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
          💬 WhatsApp
        </button>
      </div>
      <button className="w-full py-2.5 mt-2 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
        style={{ background: ORG }}>✉ SMS</button>
    </div>
  );
}

function Confetti() {
  const colors = ['#E85D04', '#22c55e', '#ffcc00', '#0f1e42', '#ef4444', '#3b82f6'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: -10,
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            background: colors[Math.floor(Math.random() * colors.length)],
            animation: `confettiFall ${2 + Math.random() * 2}s ease-in forwards`,
            animationDelay: `${Math.random() * 2}s`,
          }} />
      ))}
    </div>
  );
}

/* ─── Post Item Flow Pages ─── */

function PostFormPage() {
  return (
    <div>
      <div className="bg-[#0f1e42] px-4 py-3 flex items-center gap-3">
        <span className="text-white text-lg">←</span>
        <span className="text-white text-sm font-bold">Create New Post</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-center gap-2 mb-2">
          <div className="h-1.5 w-6 rounded-full bg-[#E85D04]" />
          <div className="h-1.5 w-2 rounded-full bg-gray-200" />
          <div className="h-1.5 w-2 rounded-full bg-gray-200" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#0f1e42] mb-1 block">Item Title</label>
          <input readOnly value="Samsung Galaxy S24 Ultra 256GB"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#0f1e42] mb-1 block">Description</label>
          <textarea readOnly value="Brand new Samsung Galaxy S24 Ultra, 256GB storage, Titanium Black color."
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none h-16 resize-none" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-[#0f1e42] mb-1 block">Price (RWF)</label>
            <input readOnly value="850,000"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-[#0f1e42] mb-1 block">Location</label>
            <input readOnly value="Kicukiro, Kigali"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs outline-none" />
          </div>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-[10px]">
          📷 Tap to upload photos
        </div>
        <div className="flex gap-1.5">
          {['📱','📦','🔋'].map((e, i) => (
            <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{e}</div>
          ))}
        </div>
        <button className="w-full py-3 bg-[#E85D04] text-white rounded-xl text-sm font-bold">
          Continue →
        </button>
      </div>
    </div>
  );
}

function PostReviewPage() {
  return (
    <div>
      <div className="bg-[#0f1e42] px-4 py-3 flex items-center gap-3">
        <span className="text-white text-lg">←</span>
        <span className="text-white text-sm font-bold">Review & Submit</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-center gap-2 mb-2">
          <div className="h-1.5 w-2 rounded-full bg-green-500" />
          <div className="h-1.5 w-6 rounded-full bg-[#E85D04]" />
          <div className="h-1.5 w-2 rounded-full bg-gray-200" />
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 border-l-4" style={{ borderLeftColor: ORG }}>
          <div className="text-xs font-bold text-[#0f1e42]">📱 Samsung Galaxy S24 Ultra 256GB</div>
          <div className="text-[10px] text-gray-400">Electronics · Kicukiro, Kigali</div>
        </div>
        <div className="bg-[#0f1e42] text-white rounded-2xl p-5 text-center">
          <div className="text-[10px] opacity-60 mb-1">Posting Fee</div>
          <div className="text-4xl font-extrabold">400 <span className="text-sm opacity-60">RWF</span></div>
          <div className="text-[10px] opacity-40 mt-1">Via MTN Mobile Money</div>
        </div>
        <button className="w-full py-3 bg-[#E85D04] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          💳 Pay 400 RWF & Publish
        </button>
      </div>
    </div>
  );
}

function PaymentModal({ amount, onPay, provider = 'mtn' }: { amount: string; onPay: () => void; provider?: string }) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-end z-30">
      <div className="bg-white w-full rounded-t-3xl p-5" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="text-center text-base font-extrabold mb-1">Post Payment</div>
        <div className="text-center text-[10px] text-gray-400 mb-4">Pay to publish your listing</div>
        <div className="text-center mb-4">
          <div className="text-[10px] text-gray-400">Amount</div>
          <div className="text-4xl font-extrabold text-[#0f1e42]">{amount}</div>
          <div className="text-[10px] text-gray-400 font-semibold">RWF</div>
        </div>
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 py-2.5 border-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 ${provider === 'mtn' ? 'border-[#E85D04] bg-orange-50' : 'border-gray-200'}`}>
            <span style={{ color: MTN_YELLOW }}>●</span> MTN MoMo
          </div>
          <div className={`flex-1 py-2.5 border-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 ${provider === 'airtel' ? 'border-[#E85D04] bg-orange-50' : 'border-gray-200'}`}>
            <span style={{ color: AIRTEL_RED }}>●</span> Airtel Money
          </div>
        </div>
        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="px-3 py-2.5 bg-gray-100 text-xs font-semibold text-[#0f1e42]">+250</div>
          <input readOnly value="788123456" className="flex-1 px-3 py-2.5 text-xs outline-none" />
        </div>
        <button onClick={onPay}
          className="w-full py-3.5 rounded-xl text-sm font-extrabold text-black"
          style={{ background: `linear-gradient(135deg, ${MTN_YELLOW}, #e6b800)` }}>
          💳 Pay Now — {amount} RWF
        </button>
        <div className="text-center text-[9px] text-gray-400 mt-3">🔒 Secured by MTN Mobile Money</div>
      </div>
    </div>
  );
}

function OTPPage({ onVerify, error }: { onVerify: () => void; error?: string }) {
  return (
    <div>
      <div className="bg-[#0f1e42] px-4 py-3 flex items-center gap-3">
        <span className="text-white text-lg">←</span>
        <span className="text-white text-sm font-bold">Verify with OTP</span>
      </div>
      <div className="p-4 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <div className="h-1.5 w-2 rounded-full bg-green-500" />
          <div className="h-1.5 w-2 rounded-full bg-green-500" />
          <div className="h-1.5 w-6 rounded-full bg-[#E85D04]" />
        </div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0f1e42] to-[#1a2d5a] flex items-center justify-center mx-auto mb-4 text-2xl"
          style={{ animation: 'unlock 1s ease' }}>🔐</div>
        <div className="text-base font-extrabold text-[#0f1e42] mb-2">Enter Verification Code</div>
        <div className="text-[10px] text-gray-400 mb-5">
          We sent a 6-digit code to<br /><strong>+250 788 123 456</strong>
        </div>
        <div className="flex gap-2 justify-center mb-3">
          {['4','8','2','9','1','7'].map((d, i) => (
            <div key={i} className="w-10 h-12 border-2 border-green-400 bg-green-50 rounded-xl flex items-center justify-center text-lg font-bold text-[#0f1e42]"
              style={{ animationDelay: `${i * 0.1}s` }}>{d}</div>
          ))}
        </div>
        {error && <div className="text-[10px] text-red-500 mb-2">{error}</div>}
        <div className="text-[10px] text-gray-400 mb-4">Code expires in <span className="font-bold" style={{ color: ORG }}>4:47</span></div>
        <button onClick={onVerify}
          className="w-full py-3 bg-[#E85D04] text-white rounded-xl text-sm font-bold mb-3">
          Verify Code
        </button>
        <button className="w-full py-3 border-2 border-[#E85D04] text-[#E85D04] rounded-xl text-sm font-bold">
          Resend Code
        </button>
      </div>
    </div>
  );
}

/* ─── Main Demo Component ─── */

export default function DemoPage() {
  const [demoType, setDemoType] = useState<'post' | 'contact'>('post');
  const [scenario, setScenario] = useState<Scenario>('success');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPhoneSim, setShowPhoneSim] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [page, setPage] = useState('form');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef<NodeJS.Timeout | null>(null);

  const scenarios = demoType === 'post' ? POST_SCENARIOS : CONTACT_SCENARIOS;

  const resetDemo = useCallback(() => {
    setPlaying(false);
    setStep(0);
    setLoadingPercent(0);
    setShowPaymentModal(false);
    setShowPhoneSim(false);
    setShowSms(false);
    setSmsMessage('');
    setPage('form');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (loadingRef.current) clearInterval(loadingRef.current);
  }, []);

  useEffect(() => {
    resetDemo();
  }, [scenario, demoType, resetDemo]);

  const showSmsNotification = (msg: string) => {
    setSmsMessage(msg);
    setShowSms(true);
    setTimeout(() => setShowSms(false), 6000);
  };

  const animateLoading = (onComplete: () => void) => {
    setPage('loading');
    setLoadingPercent(0);
    let pct = 0;
    if (loadingRef.current) clearInterval(loadingRef.current);
    loadingRef.current = setInterval(() => {
      pct += Math.random() * 18;
      if (pct >= 100) {
        pct = 100;
        if (loadingRef.current) clearInterval(loadingRef.current);
        setTimeout(onComplete, 400);
      }
      setLoadingPercent(pct);
    }, 200);
  };

  const runStep = useCallback((stepIdx: number) => {
    const postSuccessFlow = [
      () => { setPage('form'); },
      () => { setPage('review'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('otp'); showSmsNotification('Your E-Nyagasambu verification code is: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">482917</div>Valid for 5 minutes.'); },
      () => { setPage('otpVerified'); },
      () => { setPage('success'); showSmsNotification("E-Nyagasambu: Your listing 'Samsung Galaxy S24 Ultra 256GB' is now live! Listing ID: #NYG-28491"); },
    ];

    const postFailFlow = [
      () => { setPage('form'); },
      () => { setPage('review'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentFailed'); },
    ];

    const postPendingFlow = [
      () => { setPage('form'); },
      () => { setPage('review'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentPending'); },
    ];

    const postWrongOtpFlow = [
      () => { setPage('form'); },
      () => { setPage('review'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('otp'); showSmsNotification('Your E-Nyagasambu verification code is: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">482917</div>'); },
      () => { setPage('wrongOtp'); },
    ];

    const postExpiredFlow = [
      () => { setPage('form'); },
      () => { setPage('review'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('expiredOtp'); },
    ];

    const contactSuccessFlow = [
      () => { setPage('product'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('otp'); showSmsNotification('Your E-Nyagasambu verification code is: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">693847</div>Valid for 5 minutes.'); },
      () => { setPage('otpVerified'); },
      () => { setPage('contactRevealed'); },
    ];

    const contactFailFlow = [
      () => { setPage('product'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentFailed'); },
    ];

    const contactWrongOtpFlow = [
      () => { setPage('product'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('otp'); showSmsNotification('Your verification code: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">693847</div>'); },
      () => { setPage('wrongOtp'); },
    ];

    const contactExpiredFlow = [
      () => { setPage('product'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('expiredOtp'); },
    ];

    const contactRetryFlow = [
      () => { setPage('product'); },
      () => { setShowPaymentModal(true); },
      () => { setShowPaymentModal(false); animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentFailed'); },
      () => { animateLoading(() => {
        setPage('paymentSent');
        setShowPhoneSim(true);
      }); },
      () => { setShowPhoneSim(false); setPage('paymentVerified'); },
      () => { setPage('otp'); showSmsNotification('Your verification code: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">693847</div>'); },
      () => { setPage('otpVerified'); },
      () => { setPage('contactRevealed'); },
    ];

    let flows: (() => void)[] = [];
    if (demoType === 'post') {
      if (scenario === 'success') flows = postSuccessFlow;
      else if (scenario === 'paymentFail') flows = postFailFlow;
      else if (scenario === 'paymentPending') flows = postPendingFlow;
      else if (scenario === 'wrongOtp') flows = postWrongOtpFlow;
      else if (scenario === 'expiredOtp') flows = postExpiredFlow;
    } else {
      if (scenario === 'success') flows = contactSuccessFlow;
      else if (scenario === 'paymentFail') flows = contactFailFlow;
      else if (scenario === 'wrongOtp') flows = contactWrongOtpFlow;
      else if (scenario === 'expiredOtp') flows = contactExpiredFlow;
      else if (scenario === 'retry') flows = contactRetryFlow;
    }

    if (stepIdx < flows.length) {
      flows[stepIdx]();
    }
  }, [demoType, scenario, step]);

  useEffect(() => {
    if (playing) {
      const delays = [800, 600, 1000, 3000, 1500, 1200, 1500, 1000];
      const d = delays[step] || 1500;
      timerRef.current = setTimeout(() => {
        if (step < (demoType === 'post' ? 7 : (scenario === 'retry' ? 8 : 6))) {
          setStep(s => s + 1);
        } else {
          setPlaying(false);
        }
      }, d);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [playing, step, demoType, scenario]);

  useEffect(() => {
    runStep(step);
  }, [step, runStep]);

  const maxSteps = demoType === 'post'
    ? (scenario === 'paymentFail' || scenario === 'paymentPending' ? 5 : scenario === 'wrongOtp' || scenario === 'expiredOtp' ? 7 : 8)
    : (scenario === 'retry' ? 9 : scenario === 'paymentFail' || scenario === 'wrongOtp' || scenario === 'expiredOtp' ? 5 : 7);

  const renderPhoneContent = () => {
    if (page === 'form') return <PostFormPage />;
    if (page === 'review') return <PostReviewPage />;
    if (page === 'loading') return <><LoadingSpinner text="Sending payment request..." /><ProgressBar percent={loadingPercent} /></>;
    if (page === 'paymentSent') return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-4xl"
          style={{ background: `linear-gradient(135deg, ${MTN_YELLOW}, ${ORG})`, animation: 'float 2s ease-in-out infinite' }}>📱</div>
        <div className="text-sm font-extrabold mb-2">Payment Request Sent!</div>
        <div className="text-[10px] text-gray-500 mb-4">
          A payment request has been sent to<br /><strong>+250 788 123 456</strong>
        </div>
        <div className="w-full bg-gray-100 rounded-xl p-3 text-left space-y-2">
          <div className="flex justify-between text-[10px]"><span className="text-gray-400">Amount</span><span className="font-bold">{demoType === 'post' ? '400' : '300'} RWF</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-400">Status</span><span className="font-bold" style={{ color: MTN_YELLOW }}>⏳ Waiting</span></div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#E85D04] rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
          Waiting for confirmation...
        </div>
      </div>
    );
    if (page === 'paymentVerified') return <SuccessResult title="Payment Verified ✓" subtitle={`Your payment of ${demoType === 'post' ? '400' : '300'} RWF has been confirmed.`}
      icon={<CheckCircle size={32} style={{ color: GREEN }} />} />;
    if (page === 'otp') return <OTPPage onVerify={() => {}} />;
    if (page === 'otpVerified') return <SuccessResult title="OTP Verified ✓" subtitle="Identity confirmed. Unlocking..." icon={<Lock size={32} style={{ color: GREEN }} />} />;
    if (page === 'success') return (
      <div className="relative">
        <Confetti />
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4"
            style={{ animation: 'popIn 0.6s ease' }}>
            <CheckCircle size={32} className="text-white" />
          </div>
          <div className="text-sm font-extrabold mb-2" style={{ color: GREEN }}>Post Published! 🎉</div>
          <div className="text-[10px] text-gray-500 mb-4">Your listing is now live on E-Nyagasambu.</div>
          <div className="bg-white border-2 border-green-200 rounded-xl p-3 text-left w-full">
            <div className="text-[10px] font-bold text-green-600 mb-1">📱 SMS Confirmation Sent</div>
            <div className="text-[10px] text-gray-600">"Your listing 'Samsung Galaxy S24 Ultra' is now live! ID: #NYG-28491"</div>
          </div>
        </div>
      </div>
    );
    if (page === 'contactRevealed') return (
      <div className="relative py-4">
        <Confetti />
        <div className="text-center text-sm font-extrabold mb-3" style={{ color: GREEN }}>Contact Unlocked! 🔓</div>
        <SellerContactCard />
        <div className="mx-4 mt-3 bg-white border-2 border-green-200 rounded-xl p-3 text-[10px] text-gray-600">
          <span className="font-bold text-green-600">📱 SMS:</span> "Seller contact unlocked! +250 788 987 654"
        </div>
      </div>
    );
    if (page === 'paymentFailed') return <ErrorResult title={demoType === 'post' ? 'Payment Declined' : 'Payment Cancelled'} subtitle="Your payment was not completed." icon={<XCircle size={32} style={{ color: RED }} />} />;
    if (page === 'paymentPending') return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="text-5xl mb-4" style={{ animation: 'float 2s ease-in-out infinite' }}>⏳</div>
        <div className="text-sm font-extrabold mb-2" style={{ color: '#d97706' }}>Payment Pending</div>
        <div className="text-[10px] text-gray-500 mb-4">Please check your phone for the MoMo prompt.</div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-[#E85D04] rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
          Still waiting...
        </div>
      </div>
    );
    if (page === 'wrongOtp') return <ErrorResult title="Wrong OTP Code" subtitle="The code you entered is incorrect. Attempts remaining: 2 of 3." icon={<XCircle size={32} style={{ color: RED }} />} />;
    if (page === 'expiredOtp') return <ErrorResult title="OTP Expired" subtitle="Your verification code has expired. Codes valid for 5 minutes." icon={<Clock size={32} style={{ color: RED }} />} />;

    if (page === 'product') return (
      <div>
        <div className="h-44 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center text-6xl opacity-30 relative">
          📱
          <div className="absolute top-2 left-2 flex gap-1">
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#E85D04] text-white">⭐ Featured</span>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-green-500 text-white">✓ Verified</span>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[8px] font-bold bg-black/60 text-white">📷 1/6</div>
        </div>
        <div className="p-4">
          <div className="text-xl font-extrabold" style={{ color: ORG }}>850,000 <span className="text-[10px] font-semibold text-gray-400">RWF</span></div>
          <div className="text-sm font-bold text-[#0f1e42] mt-1">Samsung Galaxy S24 Ultra 256GB</div>
          <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
            <span>📍 Kicukiro</span>
            <span>📅 2h ago</span>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-xl p-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0f1e42] flex items-center justify-center text-white text-xs font-bold">JK</div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-[#0f1e42]">Jean Kalisa</div>
              <div className="text-[9px] text-gray-400">Member since Jan 2024</div>
            </div>
            <div className="text-[10px]">⭐ 4.8</div>
          </div>
          <button onClick={() => setShowPaymentModal(true)}
            className="w-full py-3 mt-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${ORG}, ${ORG}dd)` }}>
            🔒 Get Seller Contact <span className="text-[10px] opacity-70">· 300 RWF</span>
          </button>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <SMSNotification show={showSms} message={smsMessage} />

      {/* Header */}
      <div className="bg-[#0f1e42] px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/guide" className="text-white/50 text-xs font-bold hover:text-white transition-colors">← Back to Guide</Link>
            <h1 className="text-white text-xl font-extrabold mt-1">
              Interactive <span style={{ color: ORG }}>Demo</span>
            </h1>
            <p className="text-white/40 text-xs mt-1">Click through or auto-play the complete payment workflow</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-xl p-1">
              <button onClick={() => { setDemoType('post'); setScenario('success'); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${demoType === 'post' ? 'bg-white text-[#0f1e42]' : 'text-white/50'}`}>
                Post Item (400 RWF)
              </button>
              <button onClick={() => { setDemoType('contact'); setScenario('success'); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${demoType === 'contact' ? 'bg-white text-[#0f1e42]' : 'text-white/50'}`}>
                Get Contact (300 RWF)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">
          {/* Left: Phone Demo */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <PhoneFrame>
                {renderPhoneContent()}
                {showPaymentModal && (
                  <PaymentModal
                    amount={demoType === 'post' ? '400' : '300'}
                    onPay={() => {
                      setShowPaymentModal(false);
                      animateLoading(() => {
                        setPage('paymentSent');
                        setShowPhoneSim(true);
                      });
                    }}
                  />
                )}
              </PhoneFrame>

              {/* Phone Sim Overlay */}
              {showPhoneSim && (
                <div className="absolute -right-4 top-1/4 w-64 z-20" style={{ animation: 'slideInRight 0.4s ease' }}>
                  <PhoneSimPanel
                    show={true}
                    amount={demoType === 'post' ? '400' : '300'}
                    onApprove={() => {
                      setShowPhoneSim(false);
                      setPage('paymentVerified');
                      setTimeout(() => {
                        setPage('otp');
                        showSmsNotification(`Your verification code: <div class="text-2xl font-extrabold text-[#E85D04] tracking-widest my-2">${demoType === 'post' ? '482917' : '693847'}</div>`);
                      }, 1200);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-80 shrink-0 space-y-4">
            {/* Scenario Selector */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-[#0f1e42] mb-3">Scenario</div>
              <div className="space-y-1.5">
                {scenarios.map(s => (
                  <button key={s.key} onClick={() => setScenario(s.key)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    style={{
                      background: scenario === s.key ? `${s.color}15` : 'transparent',
                      color: scenario === s.key ? s.color : 'rgba(0,0,0,0.4)',
                      border: scenario === s.key ? `1px solid ${s.color}33` : '1px solid transparent',
                    }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-[#0f1e42] mb-3">Playback</div>
              <div className="flex items-center justify-center gap-3 mb-3">
                <button onClick={() => { setStep(s => Math.max(0, s - 1)); }}
                  disabled={step === 0}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-200 transition-colors">
                  <SkipBack size={16} />
                </button>
                <button onClick={() => setPlaying(!playing)}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${ORG}, ${ORG}dd)`, boxShadow: `0 4px 15px ${ORG}44` }}>
                  {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button onClick={() => { setStep(s => Math.min(maxSteps - 1, s + 1)); }}
                  disabled={step >= maxSteps - 1}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-200 transition-colors">
                  <SkipForward size={16} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                <span>Step {step + 1} of {maxSteps}</span>
                <span>·</span>
                <button onClick={resetDemo} className="flex items-center gap-1 hover:text-[#E85D04] transition-colors">
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              {/* Progress */}
              <div className="mt-3">
                <div className="flex gap-1">
                  {Array.from({ length: maxSteps }).map((_, i) => (
                    <div key={i} className="h-1 rounded-full transition-all duration-300 cursor-pointer"
                      onClick={() => setStep(i)}
                      style={{
                        flex: 1,
                        background: i < step ? GREEN : i === step ? ORG : 'rgba(0,0,0,0.08)',
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Step Info */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: ORG }}>
                Current Step
              </div>
              <div className="text-sm font-bold text-[#0f1e42] mb-1">
                {page === 'form' && 'Fill Out Listing Form'}
                {page === 'review' && 'Review & Submit'}
                {page === 'loading' && 'Processing Payment...'}
                {page === 'paymentSent' && 'Approve on Phone'}
                {page === 'paymentVerified' && 'Payment Confirmed'}
                {page === 'otp' && 'Enter OTP Code'}
                {page === 'otpVerified' && 'OTP Verified'}
                {page === 'success' && 'Post Published! 🎉'}
                {page === 'contactRevealed' && 'Contact Unlocked! 🔓'}
                {page === 'paymentFailed' && 'Payment Failed'}
                {page === 'paymentPending' && 'Payment Pending'}
                {page === 'wrongOtp' && 'Wrong OTP'}
                {page === 'expiredOtp' && 'OTP Expired'}
                {page === 'product' && 'Browse Product'}
              </div>
              <div className="text-[10px] text-gray-400">
                {page === 'form' && 'User enters item details, photos, price, and contact info.'}
                {page === 'review' && 'Review the listing summary and posting fee of ' + (demoType === 'post' ? '400' : '300') + ' RWF.'}
                {page === 'loading' && 'System connects to MTN Mobile Money gateway to initiate payment.'}
                {page === 'paymentSent' && 'MoMo USSD prompt sent to user phone. Waiting for PIN approval.'}
                {page === 'paymentVerified' && 'Payment confirmed by MTN gateway. Transaction ID generated.'}
                {page === 'otp' && '6-digit OTP sent via SMS. User must enter within 5 minutes.'}
                {page === 'otpVerified' && 'OTP verified. System proceeds to publish/unlock.'}
                {page === 'success' && 'Listing is live! Confirmation SMS sent to seller.'}
                {page === 'contactRevealed' && 'Seller phone, Call, WhatsApp, and SMS buttons now visible.'}
                {page === 'paymentFailed' && 'Payment was rejected or cancelled. User can retry.'}
                {page === 'paymentPending' && 'Payment not yet confirmed. User should check phone.'}
                {page === 'wrongOtp' && 'Incorrect code entered. 2 attempts remaining.'}
                {page === 'expiredOtp' && 'Code expired after 5 minutes. User must request new one.'}
                {page === 'product' && 'Buyer views product details and taps Get Seller Contact.'}
              </div>
            </div>

            {/* Technical Notes */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-[#0f1e42] mb-2">Technical Rules</div>
              <div className="space-y-1.5 text-[10px] text-gray-500">
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> Post blocked until payment + OTP verified</div>
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> Contact locked until payment + OTP verified</div>
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> OTP expires after 5 minutes</div>
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> Each payment has unique transaction ID</div>
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> Payments are single-use (no reuse)</div>
                <div className="flex items-start gap-1.5"><span className="text-green-500">✓</span> Loading spinner during gateway calls</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 20px rgba(34,197,94,0.6); } }
        @keyframes unlock { 0% { transform: rotate(0); } 25% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-5deg); } 100% { transform: rotate(0); } }
        @keyframes smsSlide { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0); opacity: 1; } 100% { transform: translateY(600px) rotate(720deg); opacity: 0; } }
      `}</style>
    </div>
  );
}