'use client';
import AppImage from '@/components/AppImage';
import { SITE_URL } from '@/lib/config';
import {
  AMBASSADOR_CERT_HEIGHT,
  AMBASSADOR_CERT_SWOOSH_PATH,
  AMBASSADOR_CERT_WIDTH,
} from '@/lib/ambassadorCertFrame';
import { useEffect } from 'react';
import styles from './AmbassadorCertificate.module.css';
import QrCode from './QrCode';

const RESPONSIBILITIES = [
  'Promote E-Nyagasambu services',
  'Recruit suppliers and vendors',
  'Support user onboarding',
  'Conduct awareness campaigns',
  'Represent the platform professionally',
  'Uphold E-Nyagasambu policies',
];

export interface AmbassadorCertificateProps {
  name: string;
  certNo?: string;
  issued: string;
  validUntil: string;
  territory?: string;
  id?: string;
  className?: string;
}

export default function AmbassadorCertificate({
  name,
  certNo = 'ENA-AMB-2026-0001',
  issued,
  validUntil,
  territory = 'Kigali City',
  id = 'ambassador-cert-print',
  className,
}: AmbassadorCertificateProps) {
  const verifyUrl = `${SITE_URL}/verify/${certNo}`;

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Montserrat:wght@400;500;600;700;800&family=Great+Vibes&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className={styles.certificatePage}>
      <div id={id} className={`${styles.certificate} ${className || ''}`}>
        <svg className={styles.frameSvg} viewBox={`0 0 ${AMBASSADOR_CERT_WIDTH} ${AMBASSADOR_CERT_HEIGHT}`} preserveAspectRatio="none" aria-hidden>
          <path d={AMBASSADOR_CERT_SWOOSH_PATH} fill="#ed5b22" />
          <g transform={`translate(${AMBASSADOR_CERT_WIDTH} 0) scale(-1 1)`}>
            <path d={AMBASSADOR_CERT_SWOOSH_PATH} fill="#ed5b22" />
          </g>
        </svg>

        <div className={styles.whiteCard}>
          <div className={styles.layoutGrid}>
            {/* Left column: brand block, badge centred below */}
            <aside className={styles.leftCol}>
              <div className={styles.brandRow}>
                <AppImage src="/assets/logo.png" alt="E-Nyagasambu" width={105} height={141} className={styles.stackLogo} />
                <div>
                  <h1 className={styles.brandName}>E-NYAGASAMBU</h1>
                  <p className={styles.brandTagline}>Digital Market Place</p>
                  <p className={styles.brandSite}>www.enyagasambu.rw</p>
                </div>
              </div>
              <AppImage src="/assets/Barge.png" alt="Official Brand Ambassador" width={448} height={403} className={styles.medalImage} />
            </aside>

            {/* Centre column */}
            <div className={styles.mainCol}>
              <header className={styles.headerRow}>
                <div className={styles.titleBlock}>
                  <h2 className={styles.titleMain}>CERTIFICATE</h2>
                  <p className={styles.titleSub}>
                    <span className={styles.titleDash}></span>
                    <span className={styles.titleDot}></span>
                    OF APPOINTMENT
                    <span className={styles.titleDot}></span>
                    <span className={styles.titleDash}></span>
                  </p>
                </div>
              </header>

              <div className={styles.awardSection}>
                <p className={styles.awardLabel}>This Certificate is Proudly Awarded To</p>
                <h3 className={styles.recipientName}>{name}</h3>
                <div className={styles.nameDivider}></div>

                <p className={styles.appointLabel}>For being officially appointed as a</p>
                <p className={styles.appointRole}>BRAND AMBASSADOR</p>
                <p className={styles.appointOf}>of E-Nyagasambu Digital Marketplace</p>
                <p className={styles.description}>
                  In recognition of your commitment to promoting digital commerce,<br />
                  supporting local businesses, onboarding users, and representing<br />
                  the values and mission of E-Nyagasambu.
                </p>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <div className={styles.infoHead}>
                    <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="#ed5b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Authorized Territory</span>
                  </div>
                  <p className={`${styles.infoValue} ${styles.infoDotted}`}>{territory}</p>
                </div>

                <div className={styles.infoSep}></div>

                <div className={styles.infoItem}>
                  <div className={styles.infoHead}>
                    <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="#ed5b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>Issue Date</span>
                  </div>
                  <p className={styles.infoValue}>{issued}</p>
                </div>

                <div className={styles.infoSep}></div>

                <div className={styles.infoItem}>
                  <div className={styles.infoHead}>
                    <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="#ed5b22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>Valid Until</span>
                  </div>
                  <p className={styles.infoValue}>{validUntil}</p>
                </div>
              </div>

              <footer className={styles.signaturesRow}>
                <div className={styles.signatureCol}>
                  <AppImage src="/assets/signatures/ceo-signature.png" alt="Co-Founder & CEO signature" className={styles.signatureImage} />
                  <div className={styles.signatureLine}></div>
                  <p className={styles.signatureTitle}>Co-Founder & CEO</p>
                  <p className={styles.signatureOrg}>E-Nyagasambu Ltd</p>
                </div>

                <div className={styles.sealWrap}>
                  <AppImage src="/assets/seal.png" alt="E-Nyagasambu Seal" width={500} height={500} className={styles.sealImage} />
                </div>

                <div className={styles.signatureCol}>
                  <AppImage src="/assets/signatures/coo-signature.png" alt="Co-Founder & COO signature" className={styles.signatureImage} />
                  <div className={styles.signatureLine}></div>
                  <p className={styles.signatureTitle}>Co-Founder & COO</p>
                  <p className={styles.signatureOrg}>E-Nyagasambu Ltd</p>
                </div>
              </footer>
            </div>

            {/* Right column */}
            <aside className={styles.sideCol}>
              <div className={styles.qrBox}>
                <QrCode data={verifyUrl} size={108} color="#0c2c5c" className={styles.qrCode} />
              </div>
              <p className={styles.scanLabel}>Scan to Verify</p>

              <p className={styles.sideLabel}>Certificate No.</p>
              <div className={styles.certNoPill}>{certNo}</div>

              <p className={styles.sideLabel}>Issue Date</p>
              <p className={styles.sideValue}>{issued}</p>
              <div className={styles.goldRule}></div>

              <p className={styles.sideLabel}>Valid Until</p>
              <p className={styles.sideValue}>{validUntil}</p>
              <div className={styles.goldRule}></div>

              <div className={styles.respCard}>
                <div className={styles.respTitleBar}>RESPONSIBILITIES</div>
                <ul className={styles.respList}>
                  {RESPONSIBILITIES.map(item => (
                    <li key={item} className={styles.respItem}>
                      <span className={styles.respCheck}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
