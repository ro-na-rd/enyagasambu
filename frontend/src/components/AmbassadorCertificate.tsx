'use client';
import { SITE_URL } from '@/lib/config';
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
        {/* Navy background + orange swooshes */}
        <div className={styles.bgSwooshLeft}></div>
        <div className={styles.bgSwooshRight}></div>

        {/* Logo above badge + text beside logo */}
        <div className={styles.medalStack}>
          <div className={styles.stackBrandRow}>
            <img src="/assets/logo.png" alt="E-Nyagasambu" className={styles.stackLogo} />
            <div className={styles.stackBrandText}>
              <h1 className={styles.brandName}>E-NYAGASAMBU</h1>
              <p className={styles.brandTagline}>Digital Market Place</p>
              <p className={styles.brandSite}>www.enyagasambu.rw</p>
            </div>
          </div>
          <img src="/assets/Barge.png" alt="Official Brand Ambassador" className={styles.medalImage} />
        </div>

        {/* White card */}
        <div className={styles.whiteCard}>
          <div className={styles.layoutGrid}>
            {/* Main column */}
            <div className={styles.mainCol}>
              {/* Header: title centered */}
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

              {/* Award section */}
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

              {/* Info row */}
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

              {/* Signatures */}
              <footer className={styles.signaturesRow}>
                <div className={styles.signatureCol}>
                  <svg className={styles.signatureSvg} viewBox="0 0 140 42" aria-hidden>
                    <path d="M14,30 C28,8 44,34 58,20 S86,6 104,26 C112,32 122,22 130,18" fill="none" stroke="#1a1a3a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className={styles.signatureLine}></div>
                  <p className={styles.signatureTitle}>Platform Director</p>
                  <p className={styles.signatureOrg}>E-Nyagasambu Ltd</p>
                </div>

                <div className={styles.sealWrap}>
                  <img src="/assets/seal.png" alt="E-Nyagasambu Seal" className={styles.sealImage} />
                </div>

                <div className={styles.signatureCol}>
                  <svg className={styles.signatureSvg} viewBox="0 0 140 42" aria-hidden>
                    <path d="M20,28 C36,10 50,32 66,18 C78,10 92,30 108,16 C118,10 128,24 134,20" fill="none" stroke="#1a1a3a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className={styles.signatureLine}></div>
                  <p className={styles.signatureTitle}>Business Development Officer</p>
                  <p className={styles.signatureOrg}>E-Nyagasambu Ltd</p>
                </div>
              </footer>
            </div>

            {/* Right sidebar column */}
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
