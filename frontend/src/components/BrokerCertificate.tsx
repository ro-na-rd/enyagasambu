'use client';
import AppImage from '@/components/AppImage';
import { SITE_DOMAIN } from '@/lib/config';
import { MapPin, Phone, Mail, Globe, User, BadgeCheck, Check } from '@/lib/icons';
import { useQrDataUrl } from './QrCode';

const NAVY = '#0e1f4b';
const ORG = '#f2701c';
const CARD_W = 520;
const CARD_H = 240;

export interface BrokerCertificateProps {
  name: string;
  brokerId: string;
  district?: string;
  phone?: string;
  email: string;
  photo?: string | null;
  services?: string[];
  id?: string;
  className?: string;
  showBack?: boolean;
}

const DEFAULT_SERVICES = [
  'Product Brokerage',
  'Property Brokerage',
  'Vehicle Brokerage',
  'Marketplace Verification',
  'Customer Support',
];

const FONT = "'Poppins', Arial, sans-serif";
const SHADOW = '0 22px 45px rgba(10,20,50,0.25)';

function BrokerFront({ name, brokerId, district, phone, email, qr, photo }: {
  name: string; brokerId: string; district: string; phone: string; email: string; qr: string; photo: string | null;
}) {
  const fields = [
    { ic: <BadgeCheck size={14} color={ORG} />, k: 'Broker ID', v: brokerId },
    { ic: <MapPin size={14} color={ORG} />, k: 'District', v: district },
    { ic: <Phone size={14} color={ORG} />, k: 'Phone', v: phone },
    { ic: <Mail size={14} color={ORG} />, k: 'Email', v: email },
  ];
  const rowCentres = [139, 164, 189, 214];

  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 18, overflow: 'hidden', position: 'relative', background: NAVY, fontFamily: FONT, boxShadow: SHADOW, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: ORG, clipPath: 'polygon(88% 0%, 100% 0%, 100% 20%, 93% 51%, 76% 100%, 71% 100%, 84% 50%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#f4f5f8', clipPath: 'polygon(62.8% 0%, 88% 0%, 91% 20%, 84% 52%, 74% 100%, 58.7% 45.5%)' }} />

      <AppImage src="/assets/logo.png" alt="E-Nyagasambu" width={105} height={141} style={{ position: 'absolute', left: 25, top: 11, width: 38, height: 38, objectFit: 'contain' }} />
      <div style={{ position: 'absolute', left: 74, top: 14, fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1, letterSpacing: -0.2, fontFamily: "'Literata', serif", whiteSpace: 'nowrap' }}>E-NYAGASAMBU</div>
      <div style={{ position: 'absolute', left: 74, top: 37, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4, color: ORG, whiteSpace: 'nowrap' }}>DIGITAL MARKET PLACE</div>

      <div style={{ position: 'absolute', left: 74, top: 58, fontSize: 15, fontWeight: 800, letterSpacing: 0.3, color: ORG, whiteSpace: 'nowrap' }}>CERTIFIED BROKER</div>

      <div style={{ position: 'absolute', left: 25, top: 94, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <User size={16} color="#ffffff" />
      </div>
      <div style={{ position: 'absolute', left: 53, top: 92, fontSize: 17, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{name}</div>

      {fields.map(({ ic, k, v }, i) => (
        <div key={k}>
          <div style={{ position: 'absolute', left: 25, top: rowCentres[i] - 7, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</div>
          <div style={{ position: 'absolute', left: 53, top: rowCentres[i] - 8, fontSize: 12, fontWeight: 500, color: '#e6e9f5', lineHeight: '16px', whiteSpace: 'nowrap' }}>{k}</div>
          <div style={{ position: 'absolute', left: 147, top: rowCentres[i] - 8, fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: '16px', whiteSpace: 'nowrap' }}>: {v}</div>
        </div>
      ))}

      <div style={{ position: 'absolute', left: 431, top: 122, width: 77, height: 77, boxSizing: 'border-box', background: '#fff', border: `2px solid ${ORG}`, borderRadius: 10, padding: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
        {qr && <AppImage src={qr} alt="QR" width={65} height={65} style={{ display: 'block', width: 65, height: 65 }} />}
      </div>
      <div style={{ position: 'absolute', left: 431, top: 203, width: 77, textAlign: 'center', fontSize: 8.5, fontWeight: 800, color: '#fff', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>SCAN TO VERIFY</div>

      <div style={{ position: 'absolute', left: 336, top: 13, width: 114, height: 114, boxSizing: 'border-box', borderRadius: '50%', border: `3px solid ${ORG}`, background: '#dfe3ef', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo
          ? <AppImage src={photo} alt="Profile" width={108} height={108} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={50} color="#98a1bd" />
        }
      </div>
    </div>
  );
}

function BrokerBack({ qr, services }: { qr: string; services: string[] }) {
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES;
  const contacts = [
    { ic: <Globe size={19} color={NAVY} />, label: 'Website', val: `www.${SITE_DOMAIN}`, labelTop: 57, iconTop: 61 },
    { ic: <Mail size={19} color={NAVY} />, label: 'Email', val: `info@${SITE_DOMAIN}`, labelTop: 103, iconTop: 107 },
    { ic: <Phone size={19} color={NAVY} />, label: 'Emergency Contact', val: '+250 788 300 003', labelTop: 144, iconTop: 148 },
  ];

  return (
    <div style={{ width: CARD_W, height: CARD_H, borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#ffffff', fontFamily: FONT, boxShadow: SHADOW, flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 193, height: 47, background: NAVY }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 193, height: 47, background: ORG, clipPath: 'polygon(79.4% 0%, 100% 0%, 100% 100%, 72.5% 100%)' }} />
      <p style={{ position: 'absolute', left: 44, top: 210, margin: 0, fontSize: 9.5, fontWeight: 600, color: ORG, lineHeight: '14px', whiteSpace: 'nowrap' }}>Building Trust. Connecting Opportunities. Growing Together.</p>

      <div style={{ position: 'absolute', left: 32, top: 20, width: 158, height: 22, boxSizing: 'border-box', background: NAVY, color: '#fff', borderRadius: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>AUTHORIZED SERVICES</div>

      {displayServices.map((s, i) => (
        <div key={s}>
          <div style={{ position: 'absolute', left: 25, top: 63 + i * 26, width: 14, height: 14, borderRadius: '50%', background: ORG, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={9} />
          </div>
          <div style={{ position: 'absolute', left: 48, top: 63 + i * 26 - 1, fontSize: 10.5, fontWeight: 600, color: NAVY, lineHeight: '16px', whiteSpace: 'nowrap' }}>{s}</div>
        </div>
      ))}

      <div style={{ position: 'absolute', left: 201, top: 53, width: 1, height: 133, background: NAVY, opacity: 0.6 }} />

      {contacts.map(({ ic, label, val, labelTop, iconTop }) => (
        <div key={label}>
          <div style={{ position: 'absolute', left: 221, top: iconTop, width: 19, height: 19, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</div>
          <div style={{ position: 'absolute', left: 251, top: labelTop, fontSize: 10, fontWeight: 500, color: NAVY, lineHeight: '12px', whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ position: 'absolute', left: 251, top: labelTop + 15, fontSize: 11.5, fontWeight: 500, color: NAVY, lineHeight: '14px', whiteSpace: 'nowrap' }}>{val}</div>
        </div>
      ))}

      <div style={{ position: 'absolute', left: 401, top: 60, width: 92, height: 92, boxSizing: 'border-box', background: '#fff', border: `2px solid ${NAVY}`, borderRadius: 10, padding: 4 }}>
        {qr && <AppImage src={qr} alt="QR" width={76} height={76} style={{ display: 'block', width: 76, height: 76 }} />}
      </div>
      <div style={{ position: 'absolute', left: 401, top: 162, width: 92, textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: NAVY, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>SCAN TO VERIFY</div>
    </div>
  );
}

export default function BrokerCertificate({
  name,
  brokerId,
  district = 'Kigali City',
  phone,
  email,
  photo = null,
  services = [],
  id = 'broker-cert-print',
  className,
  showBack = true,
}: BrokerCertificateProps) {
  const verifyUrl = `https://${SITE_DOMAIN}/verify-broker/${brokerId}`;
  const qr = useQrDataUrl(verifyUrl, { size: 130, color: '#1B2A5E', bgColor: '#ffffff', margin: 4 });

  return (
    <div id={id} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BrokerFront
        name={name}
        brokerId={brokerId}
        district={district}
        phone={phone || 'N/A'}
        email={email}
        qr={qr}
        photo={photo}
      />
      {showBack && <BrokerBack qr={qr} services={services} />}
    </div>
  );
}
