'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Smartphone, FileText, List, Clock, Coins, Lock, CheckCircle, Store, Search, Unlock, Phone, CreditCard, Clock3, Star, Package, Monitor, ExternalLink, AlertOctagon, Award, User, MessageSquare, Info, MailOpen, Check, X, MousePointerClick } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const LIGHT_BG = '#f8f9fc';

const VIDEOS: { key: Flow; title: string; duration: string; thumbnail: string; embedId: string; description: string }[] = [
  {
    key: 'post',
    title: 'How to Post a Listing',
    duration: '3:24',
    thumbnail: '/og-image.png',
    embedId: 'dQw4w9WgXcQ',
    description: 'Full walkthrough: fill out the form, upload photos, choose duration, pay with MoMo, verify with OTP, and publish your listing.',
  },
  {
    key: 'view',
    title: 'How to Get Seller Contact',
    duration: '2:15',
    thumbnail: '/og-image.png',
    embedId: 'dQw4w9WgXcQ',
    description: 'See how to browse listings, open a listing, tap Get Contact, pay 300 RWF via MoMo, enter OTP, and reveal the seller phone.',
  },
  {
    key: 'payment',
    title: 'MoMo Payment Guide',
    duration: '1:48',
    thumbnail: '/og-image.png',
    embedId: 'dQw4w9WgXcQ',
    description: 'Step-by-step MoMo payment: how the USSD prompt works, how to approve, and how OTP verification secures your transaction.',
  },
  {
    key: 'coins',
    title: 'How to Buy Coins',
    duration: '1:30',
    thumbnail: '/og-image.png',
    embedId: 'dQw4w9WgXcQ',
    description: 'Choose a coin package, pay with MoMo, and get coins instantly in your wallet to use for listings, contacts, and boosts.',
  },
];

type Flow = 'post' | 'view' | 'payment' | 'coins';

interface Step {
  title: string;
  desc: string;
  detail: string;
  icon: React.ReactNode;
  highlight?: string;
}

const POST_STEPS: Step[] = [
  {
    title: 'Go to Create Listing',
    desc: 'Tap "Post Listing" from the homepage or dashboard menu.',
    detail: 'You can post as a guest or as a registered user. No account is required to list.',
    icon: <FileText size={20} />,
  },
  {
    title: 'Fill in Your Item Details',
    desc: 'Enter the title, description, category, price, and location of your item.',
    detail: 'Example: Title: "iPhone 13 Pro Max - Like New", Price: "350,000 RWF", Location: "Kicukiro, Kigali". Choose "For Sale" or "For Rent".',
    icon: <List size={20} />,
    highlight: 'Add up to 6 photos to attract more buyers!',
  },
  {
    title: 'Enter Your Contact Info',
    desc: 'Provide your seller name and phone number so buyers can reach you.',
    detail: 'Your phone number must be a valid MTN or Airtel number (e.g. 0788123456). This is used for payment verification and buyer contact.',
    icon: <Smartphone size={20} />,
  },
  {
    title: 'Choose Listing Duration',
    desc: 'Select how long your listing will stay active.',
    detail: '3 Days (500 RWF) · 7 Days (1,000 RWF) · 30 Days (3,500 RWF). Longer durations give more visibility.',
    icon: <Clock size={20} />,
  },
  {
    title: 'Submit & Pay with MoMo',
    desc: 'Tap Submit — a payment prompt will appear on your phone via MTN Mobile Money.',
    detail: 'A USSD popup will appear on your phone. Enter your MoMo PIN to approve the payment. The system will wait for confirmation.',
    icon: <Coins size={20} />,
    highlight: 'Do NOT close the page while waiting!',
  },
  {
    title: 'Verify with OTP',
    desc: 'You\'ll receive a 6-digit code via SMS. Enter it to confirm payment.',
    detail: 'The OTP is sent to the phone number you entered. It expires in 5 minutes. You can tap "Resend Code" if you didn\'t receive it.',
    icon: <Lock size={20} />,
  },
  {
    title: 'Listing Published!',
    desc: 'Your listing is now live! Others can see it and contact you.',
    detail: 'Your listing appears in the marketplace immediately. You can share it or boost it for more visibility.',
    icon: <CheckCircle size={20} />,
  },
];

const VIEW_STEPS: Step[] = [
  {
    title: 'Browse the Marketplace',
    desc: 'Open the Listings page to see all available items.',
    detail: 'Filter by category, search by keyword, or sort by newest. Featured items appear at the top with a gold badge.',
    icon: <Store size={20} />,
  },
  {
    title: 'Open a Listing',
    desc: 'Tap any listing to see its full details.',
    detail: 'View all photos in the gallery, read the description, see the price, location, and how long ago it was posted.',
    icon: <Search size={20} />,
  },
  {
    title: 'Tap "Get Seller Contact"',
    desc: 'To see the seller\'s phone number and call them, tap the contact button.',
    detail: 'This costs 300 RWF (paid via MTN MoMo). You only pay once per seller — the contact is saved permanently after unlock.',
    icon: <Unlock size={20} />,
  },
  {
    title: 'Enter Your Phone Number',
    desc: 'Type in your MTN Mobile Money number to receive the payment prompt.',
    detail: 'Format: +250 7XX XXX XXX. A USSD prompt will be sent to this number for payment approval.',
    icon: <Smartphone size={20} />,
  },
  {
    title: 'Approve Payment & Enter OTP',
    desc: 'Approve the 300 RWF payment on your phone, then enter the SMS code.',
    detail: 'Step 1: Approve the MoMo USSD popup on your phone. Step 2: Enter the 6-digit OTP sent to your phone via SMS.',
    icon: <CheckCircle size={20} />,
  },
  {
    title: 'Contact Revealed!',
    desc: 'See the seller\'s phone number with Call and WhatsApp buttons.',
    detail: 'Tap Call to call directly, or tap WhatsApp to open a chat. You can now negotiate and arrange pickup or delivery.',
    icon: <Phone size={20} />,
    highlight: 'The contact is saved — no need to pay again for this seller!',
  },
];

const PAYMENT_STEPS: Step[] = [
  {
    title: 'MTN Mobile Money (MoMo)',
    desc: 'All payments go through MTN MoMo USSD push notifications.',
    detail: 'When you tap "Pay", the system sends a USSD request to your phone. A popup appears asking you to enter your MoMo PIN.',
    icon: <CreditCard size={20} />,
  },
  {
    title: 'Payment Prompt on Phone',
    desc: 'You\'ll see a popup on your phone screen — NOT in the app.',
    detail: 'The prompt shows: the amount (e.g. 500 RWF), the merchant name, and asks for your PIN. Enter your MoMo PIN to approve.',
    icon: <Smartphone size={20} />,
    highlight: 'If the popup doesn\'t appear, check your network signal and try again.',
  },
  {
    title: 'Automatic Verification',
    desc: 'The app checks payment status every 5 seconds automatically.',
    detail: 'After you approve, the system polls MTN\'s servers to confirm the payment. This usually takes 5-15 seconds. Wait on the page.',
    icon: <Clock3 size={20} />,
  },
  {
    title: 'SMS OTP Confirmation',
    desc: 'Once payment is confirmed, you receive a 6-digit code via SMS.',
    detail: 'Enter the code in the app to finalize. The OTP expires in 5 minutes. You can resend it if needed.',
    icon: <Lock size={20} />,
  },
  {
    title: 'Payment Complete!',
    desc: 'Your action is now complete — listing posted, contact unlocked, or coins credited.',
    detail: 'Each action uses the same payment flow. You\'ll always get an OTP as a final security step.',
    icon: <Star size={20} />,
  },
];

const COIN_STEPS: Step[] = [
  {
    title: 'Open the Coins Page',
    desc: 'Go to Dashboard → Coins (or tap the coin icon in the header).',
    detail: 'You\'ll see your current balance and available coin packages to purchase.',
    icon: <Coins size={20} />,
  },
  {
    title: 'Choose a Coin Package',
    desc: 'Pick a package that suits your needs.',
    detail: '500 coins = 1,000 RWF · 1,200 coins = 2,000 RWF · 3,000 coins = 4,500 RWF · 7,000 coins = 9,000 RWF. The bigger the package, the cheaper per coin!',
    icon: <Package size={20} />,
  },
  {
    title: 'Enter Your MoMo Number',
    desc: 'Type your MTN Mobile Money number to receive the payment prompt.',
    detail: 'The USSD payment prompt will be sent to this number. Make sure it\'s an active MTN MoMo number.',
    icon: <Smartphone size={20} />,
  },
  {
    title: 'Approve on Your Phone',
    desc: 'Tap the MoMo popup on your phone and enter your PIN.',
    detail: 'The app will wait and check every 5 seconds. Don\'t close the page until you see the success message.',
    icon: <CheckCircle size={20} />,
  },
  {
    title: 'Coins Added to Wallet!',
    desc: 'Your coins are instantly credited after payment confirmation.',
    detail: 'Use coins to: Post listings (400 coins), Unlock contacts (300 coins), Boost listings (200 coins), Subscribe to Premium (1,200 coins/month).',
    icon: <Star size={20} />,
    highlight: 'Coins never expire — use them anytime!',
  },
];

const FLOWS: { key: Flow; label: string; icon: React.ReactNode; steps: Step[] }[] = [
  { key: 'post', label: 'Post a Listing', icon: <FileText size={20} />, steps: POST_STEPS },
  { key: 'view', label: 'Get Seller Contact', icon: <Phone size={20} />, steps: VIEW_STEPS },
  { key: 'payment', label: 'How Payment Works', icon: <CreditCard size={20} />, steps: PAYMENT_STEPS },
  { key: 'coins', label: 'Buy Coins', icon: <Coins size={20} />, steps: COIN_STEPS },
];

export default function GuidePage() {
  const [activeFlow, setActiveFlow] = useState<Flow>('post');
  const [activeStep, setActiveStep] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<Flow | null>(null);
  const [videoMode, setVideoMode] = useState<'desktop' | 'mobile'>('mobile');
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const currentFlow = FLOWS.find(f => f.key === activeFlow)!;
  const steps = currentFlow.steps;

  useEffect(() => { setActiveStep(0); }, [activeFlow]);

  const next = () => { if (activeStep < steps.length - 1) setActiveStep(s => s + 1); };
  const prev = () => { if (activeStep > 0) setActiveStep(s => s - 1); };

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${NAVY}, transparent 70%)` }} />
          <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${ORG}, transparent 70%)` }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-16 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ORG}, ${ORG}cc)`, boxShadow: `0 4px 20px ${ORG}44` }}>
            <span className="text-white font-black text-2xl">E</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            How It Works
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(0,0,0,0.5)' }}>
            Step-by-step guide to posting listings, connecting with sellers, and making payments on E-Nyagasambu.
          </p>
        </div>
      </div>

      {/* Video Section */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Featured Video Player */}
        {playingVideo && (
          <div className="mb-8 rounded-2xl overflow-hidden"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
            }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Play size={14} style={{ color: ORG }} />
                <span className="text-sm font-bold text-gray-900">
                  {VIDEOS.find(v => v.key === playingVideo)?.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVideoMode('mobile')}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: videoMode === 'mobile' ? `${ORG}22` : 'transparent', color: videoMode === 'mobile' ? ORG : 'rgba(0,0,0,0.3)' }}
                  title="Mobile View"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  onClick={() => setVideoMode('desktop')}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: videoMode === 'desktop' ? `${ORG}22` : 'transparent', color: videoMode === 'desktop' ? ORG : 'rgba(0,0,0,0.3)' }}
                  title="Desktop View"
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: 'rgba(0,0,0,0.4)' }}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className={`mx-auto ${videoMode === 'mobile' ? 'max-w-[360px]' : 'max-w-full'}`}>
              <div className="relative w-full" style={{ paddingBottom: videoMode === 'mobile' ? '177.78%' : '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${VIDEOS.find(v => v.key === playingVideo)?.embedId}?autoplay=1&rel=0`}
                  title={VIDEOS.find(v => v.key === playingVideo)?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* Video Cards */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play size={14} style={{ color: ORG }} />
              <h2 className="text-sm font-bold text-gray-900">Tutorial Videos</h2>
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'rgba(0,0,0,0.3)' }}>
              {VIDEOS.length} videos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {VIDEOS.map((video) => (
              <button
                key={video.key}
                onClick={() => { setPlayingVideo(video.key); setActiveFlow(video.key); }}
                className="group text-left p-5 transition-all hover:bg-gray-50"
              >
                {/* Thumbnail */}
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-video"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY}cc)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: `${ORG}dd`, boxShadow: `0 4px 15px ${ORG}44` }}>
                      <Play size={16} className="text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                    {video.duration}
                  </div>
                </div>
                <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-gray-900 transition-colors">
                  {video.title}
                </h3>
                <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  {video.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Demo CTA */}
        <Link href="/demo" className="mt-6 block rounded-2xl overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, ${NAVY}, ${NAVY}ee)`,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
          <div className="p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${ORG}22`, boxShadow: `0 4px 20px ${ORG}33` }}>
                <MousePointerClick size={24} style={{ color: ORG }} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Try the Interactive Demo
                </h3>
                <p className="text-xs text-white/50 max-w-md">
                  Click through the complete payment workflow — from posting an item to OTP verification. Includes success and error scenarios.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all group-hover:scale-105"
              style={{ background: ORG, color: '#fff', boxShadow: `0 4px 15px ${ORG}44` }}>
              Launch Demo
              <span className="text-lg">→</span>
            </div>
          </div>
        </Link>

        {/* How to Record Your Own Video */}
        <div className="mt-6 rounded-xl p-5"
          style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${ORG}15` }}>
              <ExternalLink size={14} style={{ color: ORG }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Want to create your own tutorial?</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Record your screen while using the app. Free tools: OBS Studio (desktop), or built-in screen recorder on Android/iOS. Upload to YouTube, then replace the embed IDs in <code className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100" style={{ color: ORG }}>frontend/src/app/(main)/guide/page.tsx</code> with your video IDs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Tabs */}
      <div className="max-w-5xl mx-auto px-4 -mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FLOWS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFlow(f.key)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0"
              style={{
                background: activeFlow === f.key ? `linear-gradient(135deg, ${ORG}, ${ORG}dd)` : '#ffffff',
                color: activeFlow === f.key ? '#fff' : 'rgba(0,0,0,0.5)',
                border: activeFlow === f.key ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: activeFlow === f.key ? `0 4px 15px ${ORG}33` : 'none',
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Steps Content */}
      <div className="max-w-5xl mx-auto px-4 py-10" ref={stepsEndRef}>
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
              onClick={() => setActiveStep(i)}
              style={{
                flex: 1,
                background: i <= activeStep ? ORG : 'rgba(0,0,0,0.08)',
              }}
            />
          ))}
        </div>

        {/* Step indicators */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0"
              style={{
                background: i === activeStep ? 'rgba(0,0,0,0.05)' : 'transparent',
                color: i === activeStep ? '#1e293b' : i < activeStep ? ORG : 'rgba(0,0,0,0.3)',
                border: i === activeStep ? `1px solid ${ORG}44` : '1px solid transparent',
              }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
                style={{
                  background: i < activeStep ? ORG : i === activeStep ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  color: i <= activeStep ? '#fff' : 'rgba(0,0,0,0.3)',
                }}>
                {i < activeStep ? <Check size={12} /> : i + 1}
              </span>
              {s.title}
            </button>
          ))}
        </div>

        {/* Active Step Card */}
        <div className="rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.06)',
          }}>
          {/* Step header */}
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${ORG}15`, border: `1px solid ${ORG}22` }}>
                {steps[activeStep].icon}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1"
                  style={{ color: ORG }}>
                  Step {activeStep + 1} of {steps.length}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {steps[activeStep].title}
                </h2>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="bg-[#0d1225] rounded-2xl border border-white/5 p-6 sm:p-8 mb-6">
              {/* Phone frame */}
              <div className="max-w-sm mx-auto">
                <div className="rounded-[2rem] overflow-hidden border-2 border-white/10"
                  style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  {/* Phone notch */}
                  <div className="bg-black py-2 flex justify-center">
                    <div className="w-20 h-5 rounded-full bg-[#1a1a2e]" />
                  </div>
                  {/* Phone screen */}
                  <div className="p-5 min-h-[220px] flex flex-col justify-center"
                    style={{ background: `linear-gradient(135deg, ${NAVY}ee, ${NAVY}dd)` }}>
                    <div className="text-center">
                      <div className="text-4xl mb-3">{steps[activeStep].icon}</div>
                      <h3 className="text-white font-bold text-sm mb-2">{steps[activeStep].title}</h3>
                      <p className="text-white/60 text-xs leading-relaxed">{steps[activeStep].desc}</p>
                    </div>
                  </div>
                  {/* Phone bar */}
                  <div className="bg-black py-1 flex justify-center">
                    <div className="w-24 h-1 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detail text */}
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.6)' }}>
                {steps[activeStep].detail}
              </p>
              {steps[activeStep].highlight && (
                <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3"
                  style={{ background: `${ORG}10`, border: `1px solid ${ORG}22`, color: ORG }}>
                  <span className="shrink-0 mt-0.5"><Info size={14} /></span>
                  {steps[activeStep].highlight}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-gray-100">
            <button
              onClick={prev}
              disabled={activeStep === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-20"
              style={{
                background: 'rgba(0,0,0,0.03)',
                color: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              ← Previous
            </button>
            <div className="text-xs font-bold" style={{ color: 'rgba(0,0,0,0.3)' }}>
              {activeStep + 1} / {steps.length}
            </div>
            {activeStep < steps.length - 1 ? (
              <button
                onClick={next}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: `linear-gradient(135deg, ${ORG}, ${ORG}dd)`,
                  color: '#fff',
                  boxShadow: `0 4px 15px ${ORG}33`,
                }}
              >
                Next →
              </button>
            ) : (
              <Link
                href={activeFlow === 'post' ? '/listings/create' : activeFlow === 'coins' ? '/coins' : '/listings'}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${ORG}, ${ORG}dd)`,
                  color: '#fff',
                  boxShadow: `0 4px 15px ${ORG}33`,
                }}
              >
                {activeFlow === 'post' ? 'Post a Listing Now' : activeFlow === 'coins' ? 'Buy Coins' : 'Browse Listings'}
                →
              </Link>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            { icon: <Lock size={16} />, title: 'Secure Payments', desc: 'All payments are processed via MTN MoMo with OTP verification for your safety.' },
            { icon: <Smartphone size={16} />, title: 'No App Needed', desc: 'Works on any phone with a browser. Payment prompts come via SMS — no downloads required.' },
            { icon: <MessageSquare size={16} />, title: 'Direct Contact', desc: 'Unlock seller details once and contact them directly via Call or WhatsApp anytime.' },
          ].map((tip) => (
            <div key={tip.title} className="rounded-xl p-5"
              style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <div className="text-2xl mb-3">{tip.icon}</div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{tip.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,0,0,0.5)' }}>{tip.desc}</p>
            </div>
          ))}
        </div>

        {/* Coin costs table */}
        <div className="mt-8 rounded-xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Quick Reference — Coin Costs</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { action: 'Post a Listing', cost: '400 coins', note: '≈ 800 RWF' },
              { action: 'Unlock Seller Contact', cost: '300 coins', note: 'One-time per seller' },
              { action: 'Boost Listing (7 days)', cost: '200 coins', note: 'Gold featured badge' },
              { action: 'Premium Plan (30 days)', cost: '1,200 coins', note: '100 listings, 30-day duration' },
            ].map((row) => (
              <div key={row.action} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-600">{row.action}</span>
                <div className="text-right">
                  <span className="text-sm font-bold" style={{ color: ORG }}>{row.cost}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{row.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-10 text-center pb-8">
          <p className="text-xs mb-3" style={{ color: 'rgba(0,0,0,0.4)' }}>
            Need more help?
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/about" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>
              About Us
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/login" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>
              Sign In
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/register" className="text-xs font-semibold hover:underline" style={{ color: ORG }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
