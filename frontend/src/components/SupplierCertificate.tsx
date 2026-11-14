'use client';

import AppImage from '@/components/AppImage';
import QrCode from '@/components/QrCode';
import { SITE_DOMAIN, SITE_URL } from '@/lib/config';

const NAVY = '#0f1e42';
const ORANGE = '#E85D04';

export interface SupplierCertificateProps {
  legalName: string;
  businessName?: string | null;
  certNo: string;
  issued: string;
  validUntil: string;
  photo?: string | null;
  id?: string;
}

export default function SupplierCertificate({
  legalName,
  businessName,
  certNo,
  issued,
  validUntil,
  photo,
  id = 'supplier-cert-print',
}: SupplierCertificateProps) {
  const verifyUrl = `${SITE_URL}/verify-supplier/${encodeURIComponent(certNo)}`;

  return (
    <article
      id={id}
      className="relative isolate w-full overflow-hidden bg-white text-center shadow-xl"
      style={{ aspectRatio: '210 / 297', color: NAVY, fontFamily: 'Georgia, Cambria, serif' }}
    >
      <div className="absolute inset-[9mm] border-[3px]" style={{ borderColor: NAVY }} />
      <div className="absolute inset-[11mm] border" style={{ borderColor: ORANGE }} />
      <div className="absolute left-0 right-0 top-0 h-[16%]" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY} 74%, ${ORANGE} 74%, ${ORANGE} 100%)` }} />
      <div className="absolute bottom-0 left-0 right-0 h-[8%]" style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE} 24%, ${NAVY} 24%, ${NAVY} 100%)` }} />

      <div className="relative z-10 flex h-full flex-col px-[10%] pb-[11%] pt-[8%]">
        <header className="flex items-center justify-center gap-3 text-left text-white">
          <AppImage src="/assets/logo.png" alt="E-Nyagasambu" className="h-14 w-14 object-contain" />
          <div>
            <p className="text-lg font-black leading-none tracking-wide">E-NYAGASAMBU</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-orange-200">Digital Marketplace</p>
          </div>
        </header>

        <div className="mt-[9%]">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em]" style={{ color: ORANGE }}>Certificate of Supplier Verification</p>
          <div className="mx-auto mt-3 h-px w-28" style={{ background: ORANGE }} />
          <p className="mt-5 text-xs text-slate-500">This certifies that</p>
          <h1 className="mt-2 break-words text-3xl font-bold leading-tight sm:text-4xl">{legalName}</h1>
          {businessName && (
            <p className="mt-2 text-sm font-bold sm:text-base" style={{ color: ORANGE }}>Trading as {businessName}</p>
          )}
          {photo && (
            <div className="mx-auto mt-5 h-20 w-20 overflow-hidden rounded-full border-4 bg-slate-100 shadow-md" style={{ borderColor: ORANGE }}>
              <AppImage src={photo} alt={legalName} className="h-full w-full object-cover" />
            </div>
          )}
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-slate-600">
            is recognized as a verified supplier on the E-Nyagasambu Digital Marketplace, subject to the platform&apos;s supplier standards and terms of service.
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-3 border-y py-4 text-left text-[9px] sm:text-[11px]" style={{ borderColor: '#d9dee8' }}>
          <div className="border-r px-2" style={{ borderColor: '#d9dee8' }}>
            <dt className="font-sans uppercase tracking-wide text-slate-400">Certificate ID</dt>
            <dd className="mt-1 break-all font-sans font-bold" style={{ color: NAVY }}>{certNo}</dd>
          </div>
          <div className="border-r px-2" style={{ borderColor: '#d9dee8' }}>
            <dt className="font-sans uppercase tracking-wide text-slate-400">Issued</dt>
            <dd className="mt-1 font-sans font-bold" style={{ color: NAVY }}>{issued}</dd>
          </div>
          <div className="px-2">
            <dt className="font-sans uppercase tracking-wide text-slate-400">Expires</dt>
            <dd className="mt-1 font-sans font-bold" style={{ color: NAVY }}>{validUntil}</dd>
          </div>
        </dl>

        <footer className="mt-5 flex items-end justify-between gap-4 text-left">
          <div className="min-w-0 flex-1 text-center">
            <svg viewBox="0 0 160 48" className="mx-auto h-9 w-32" aria-label="Authorized signature">
              <path d="M14 35c17-32 25 7 41-14 10-13 11 12 27 2 17-10 19-25 33 0 8 13 18 1 31-5" fill="none" stroke={NAVY} strokeLinecap="round" strokeWidth="2.5" />
            </svg>
            <div className="mx-auto h-px max-w-[150px]" style={{ background: NAVY }} />
            <p className="mt-1 font-sans text-[9px] font-bold uppercase tracking-wide">Authorized Signature</p>
            <p className="font-sans text-[8px] text-slate-500">E-Nyagasambu Ltd</p>
          </div>
          <div className="shrink-0 rounded border bg-white p-1" style={{ borderColor: ORANGE }}>
            <QrCode data={verifyUrl} size={68} color={NAVY} bgColor="#ffffff" margin={1} alt={`QR code to verify ${certNo}`} />
          </div>
          <div className="min-w-0 flex-1 text-center font-sans">
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Verify online</p>
            <p className="mt-1 break-all text-[8px] font-semibold" style={{ color: NAVY }}>{SITE_DOMAIN}/verify-supplier/{certNo}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
