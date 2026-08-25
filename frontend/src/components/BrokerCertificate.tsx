'use client';
import { SITE_DOMAIN } from '@/lib/config';
import { MapPin, Phone, Mail, Globe, User, BadgeCheck, Check } from '@/lib/icons';
import { useQrDataUrl } from './QrCode';

const NAVY = '#0e1f4b';
const ORG = '#f2701c';

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

function BrokerFront({ name, brokerId, district, phone, email, qr, photo }: {
  name: string; brokerId: string; district: string; phone: string; email: string; qr: string; photo: string | null;
}) {
  const W = 520, H = 300;
  return (
    <div style={{ width: W, height: H, borderRadius: 18, overflow: 'hidden', position: 'relative', background: NAVY, fontFamily: "'Poppins', Arial, sans-serif", boxShadow: '0 22px 45px rgba(10,20,50,0.25)', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, right: -30, bottom: 0, width: '52%', background: NAVY, transform: 'skewX(-12deg)', transformOrigin: 'top right' }} />
      <div style={{ position: 'absolute', top: 0, right: -90, bottom: 0, width: '52%', background: ORG, transform: 'skewX(-12deg)', transformOrigin: 'top right' }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', height: '100%', padding: 26, gap: 12 }}>
        <div style={{ flex: '1.6', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/assets/logo.png" alt="E-Nyagasambu" style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 14.5, letterSpacing: 0.5, color: '#fff', lineHeight: 1.15, fontFamily: "'Literata', serif" }}>E-NYAGASAMBU</div>
              <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: 1.8, color: '#ffb585' }}>DIGITAL MARKET PLACE</div>
            </div>
          </div>

          <div style={{ marginTop: 12, alignSelf: 'flex-start', background: ORG, color: '#fff', fontWeight: 800, fontSize: 11.5, letterSpacing: 1.5, padding: '4px 12px', borderRadius: 6 }}>CERTIFIED BROKER</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <User size={17} color="#ffb585" />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210 }}>{name}</span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { ic: <BadgeCheck size={12} color={ORG} />, k: 'Broker ID', v: brokerId },
              { ic: <MapPin size={12} color={ORG} />, k: 'District',  v: district },
              { ic: <Phone size={12} color={ORG} />, k: 'Phone',     v: phone || 'N/A' },
              { ic: <Mail size={12} color={ORG} />, k: 'Email',     v: email.length > 22 ? email.slice(0, 20) + '\u2026' : email },
            ].map(({ ic, k, v }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11.5 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORG, flexShrink: 0 }}>{ic}</span>
                <span style={{ color: '#c6cde6', minWidth: 52 }}>{k}</span>
                <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>: {v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <div style={{ borderRadius: '50%', background: ORG, padding: 4, boxShadow: '0 6px 14px rgba(0,0,0,0.25)' }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', border: '3px solid #fff', overflow: 'hidden', background: '#dfe3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photo
                ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={46} color="#98a1bd" />
              }
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.12)' }}>
              <img src={qr} alt="QR" width={54} height={54} style={{ display: 'block' }} />
            </div>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#ffb585', letterSpacing: 0.8, marginTop: 3 }}>SCAN TO VERIFY</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrokerBack({ qr, services }: { qr: string; services: string[] }) {
  const displayServices = services.length > 0 ? services : DEFAULT_SERVICES;
  return (
    <div style={{ width: 520, height: 300, borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#fdfdfc', fontFamily: "'Poppins', Arial, sans-serif", boxShadow: '0 22px 45px rgba(10,20,50,0.25)', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: -60, top: -45, width: 110, height: 110, transform: 'rotate(45deg)', background: ORG, opacity: 0.9 }} />
      <div style={{ position: 'absolute', right: -50, top: 24, width: 110, height: 110, transform: 'rotate(45deg)', background: NAVY, opacity: 0.08 }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', padding: '26px 28px 0' }}>
        <div style={{ display: 'flex', flex: 1, gap: 18 }}>
          <div style={{ flex: '1.15', display: 'flex', flexDirection: 'column' }}>
            <span style={{ alignSelf: 'flex-start', background: NAVY, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '6px 14px', borderRadius: 6, marginBottom: 14 }}>AUTHORIZED SERVICES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {displayServices.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11.5, color: NAVY, fontWeight: 600 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: ORG, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}><Check size={10} /></span>
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 30 }}>
            {[
              { ic: <Globe size={14} color={ORG} />, label: 'Website',   val: `www.${SITE_DOMAIN}` },
              { ic: <Mail size={14} color={ORG} />, label: 'Email',     val: `info@${SITE_DOMAIN}` },
              { ic: <Phone size={14} color={ORG} />, label: 'Emergency Contact', val: '+250 788 300 003' },
            ].map(({ ic, label, val }) => (
              <div key={label} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ color: ORG, marginTop: 1, flexShrink: 0 }}>{ic}</span>
                <div>
                  <div style={{ fontSize: 9.5, color: '#5c6684', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: NAVY, fontWeight: 700 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ border: '1px solid rgba(23,42,99,0.15)', borderRadius: 8, padding: 4 }}>
              <img src={qr} alt="QR" width={60} height={60} style={{ display: 'block' }} />
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: NAVY, letterSpacing: 0.8 }}>SCAN TO VERIFY</div>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '0 -28px', background: NAVY, padding: '11px 28px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: 0, bottom: 0, width: 80, transform: 'skewX(-12deg)', background: ORG }} />
          <p style={{ position: 'relative', margin: 0, fontSize: 11, fontWeight: 600, fontStyle: 'italic', color: '#ffb585', letterSpacing: 0.4 }}>Building Trust. Connecting Opportunities. Growing Together.</p>
        </div>
      </div>
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
        phone={phone || ''}
        email={email}
        qr={qr}
        photo={photo}
      />
      {showBack && <BrokerBack qr={qr} services={services} />}
    </div>
  );
}
