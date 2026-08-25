import { SITE_URL } from '@/lib/config';
import { generateQrDataUrl } from '@/components/QrCode';

const NAVY = '#0c2c5c';
const ORG = '#ed5b22';

const RESPONSIBILITIES = [
  'Promote E-Nyagasambu services',
  'Recruit suppliers and vendors',
  'Support user onboarding',
  'Conduct awareness campaigns',
  'Represent the platform professionally',
  'Uphold E-Nyagasambu policies',
];

export async function buildAmbassadorCertPrintHtml(opts: {
  name: string;
  certNo: string;
  issued: string;
  validUntil: string;
  territory?: string;
}) {
  const { name, certNo, issued, validUntil, territory = 'Kigali City' } = opts;
  const verifyUrl = `${SITE_URL}/verify/${certNo}`;
  const qrUrl = await generateQrDataUrl(verifyUrl, { size: 140, color: NAVY, bgColor: '#ffffff' });
  const logoUrl = `${SITE_URL}/assets/logo.png`;
  const badgeUrl = `${SITE_URL}/assets/Barge.png`;
  const sealUrl = `${SITE_URL}/assets/seal.png`;
  const respItems = RESPONSIBILITIES.map(
    item => `<li style="display:flex;gap:8px;align-items:flex-start;margin-bottom:9px;font-size:10.5px;font-weight:600;color:#16233f;line-height:1.4"><span style="width:15px;height:15px;border-radius:50%;background:${ORG};color:#fff;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">✓</span>${item}</li>`
  ).join('');

  return `<!DOCTYPE html><html><head><title>Certificate - ${certNo}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Montserrat:wght@400;500;600;700;800&family=Great+Vibes&display=swap" rel="stylesheet" />
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust:exact; print-color-adjust:exact; color-adjust:exact; }
  body { font-family: "Montserrat", sans-serif; margin: 0; background: #fff; display:flex; justify-content:center; align-items:center; min-height:100vh; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .cert { position:relative; width:1123px; height:794px; background:linear-gradient(120deg, #0c2c5c 0%, #12336a 55%, #0c2c5c 100%); border-radius:26px; overflow:hidden; flex-shrink:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .bgSwooshLeft,.bgSwooshRight { position:absolute; top:-12%; width:190px; height:130%; background:linear-gradient(180deg, #ed5b22 0%, #ff8a3d 100%); }
  .bgSwooshLeft { left:-60px; transform:rotate(14deg); border-radius:90px; }
  .bgSwooshRight { right:-60px; transform:rotate(-14deg); border-radius:90px; }
  .medalStack { position:absolute; top:32px; left:34px; z-index:3; width:150px; display:flex; flex-direction:column; align-items:center; gap:10px; }
  .stackBrandRow { display:flex; align-items:center; gap:8px; align-self:stretch; }
  .stackLogo { width:52px; height:52px; object-fit:contain; flex-shrink:0; }
  .brandName { font-size:15px; font-weight:900; letter-spacing:0.6px; color:#0c2c5c; margin:0; line-height:1.1; }
  .brandTagline { font-size:8.5px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#ed5b22; margin:2px 0 0; }
  .brandSite { font-size:7.5px; font-weight:600; color:#0c2c5c; margin:2px 0 0; }
  .medalImage { width:128px; height:auto; object-fit:contain; filter:drop-shadow(0 6px 14px rgba(0,0,0,0.35)); }
  .whiteCard { position:absolute; inset:22px; background:#fff; border-radius:20px; z-index:2; overflow:hidden; }
  .layoutGrid { display:grid; grid-template-columns:1fr 250px; gap:18px; height:100%; padding:26px 30px 22px 150px; }
  .mainCol { display:flex; flex-direction:column; min-width:0; }
  .headerRow { display:flex; justify-content:center; align-items:start; }
  .titleMain { font-family:"DM Serif Display",serif; font-size:54px; font-weight:400; letter-spacing:12px; color:#0c2c5c; margin:0; line-height:1; text-align:center; }
  .titleSub { display:flex; align-items:center; justify-content:center; gap:8px; font-size:17px; font-weight:800; letter-spacing:5px; color:#ed5b22; margin:6px 0 0; white-space:nowrap; }
  .titleDash { width:44px; height:2px; background:#ed5b22; }
  .titleDot { width:7px; height:7px; border-radius:50%; background:#ed5b22; }
  .awardSection { text-align:center; margin-top:18px; }
  .awardLabel { font-size:13px; font-weight:600; color:#23324d; margin:0 0 6px; }
  .recipientName { font-family:"Great Vibes",cursive; font-size:58px; font-weight:400; color:#12275c; margin:6px 0 0; line-height:1.1; }
  .nameDivider { width:420px; max-width:80%; height:3px; margin:10px auto 14px; background:linear-gradient(90deg, transparent, #caa53d 18%, #caa53d 82%, transparent); border-radius:2px; }
  .appointLabel { font-size:13px; font-weight:600; color:#23324d; margin:8px 0 4px; }
  .appointRole { font-size:30px; font-weight:900; letter-spacing:1px; color:#ed5b22; margin:0; line-height:1.1; }
  .appointOf { font-size:15px; font-weight:800; color:#0c2c5c; margin:6px 0 10px; }
  .description { font-size:11px; font-weight:500; line-height:1.55; color:#33415e; margin:0; }
  .infoRow { display:flex; align-items:stretch; justify-content:center; gap:22px; margin-top:22px; }
  .infoSep { width:1px; background:#d7dde8; }
  .infoItem { text-align:left; min-width:130px; }
  .infoHead { display:flex; align-items:center; gap:7px; font-size:10.5px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase; color:#ed5b22; }
  .infoIcon { width:17px; height:17px; flex-shrink:0; }
  .infoValue { font-size:14px; font-weight:600; color:#16233f; margin:6px 0 0 24px; }
  .infoDotted { border-bottom:2px dotted #9aa7bd; padding-bottom:3px; display:inline-block; }
  .signaturesRow { margin-top:28px; display:flex; align-items:flex-end; justify-content:space-between; gap:12px; padding-top:16px; }
  .signatureCol { text-align:center; flex:1; min-width:0; }
  .signatureSvg { width:120px; height:38px; margin-bottom:-6px; }
  .signatureLine { width:170px; max-width:100%; height:1.5px; background:#16233f; margin:0 auto 6px; }
  .signatureTitle { font-size:11px; font-weight:800; color:#16233f; margin:0; }
  .signatureOrg { font-size:10px; font-weight:600; color:#33415e; margin:2px 0 0; }
  .sealWrap { flex-shrink:0; margin-bottom:4px; }
  .sealImage { width:96px; height:96px; object-fit:contain; }
  .sideCol { display:flex; flex-direction:column; align-items:center; padding-top:6px; }
  .qrBox { background:#fff; border:2px solid #0c2c5c; border-radius:10px; padding:8px; line-height:0; }
  .qrCode { width:108px; height:108px; }
  .scanLabel { font-size:10.5px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#16233f; margin:8px 0 12px; }
  .sideLabel { align-self:flex-start; font-size:11.5px; font-weight:600; color:#33415e; margin:6px 0 4px; }
  .certNoPill { align-self:stretch; background:#0c2c5c; color:#fff; font-size:12px; font-weight:800; letter-spacing:1px; text-align:center; padding:7px 10px; border-radius:6px; }
  .sideValue { align-self:flex-start; font-size:14px; font-weight:700; color:#16233f; margin:0; }
  .goldRule { align-self:stretch; height:2px; background:linear-gradient(90deg, #caa53d 0%, #e9cd74 100%); border-radius:2px; margin-top:6px; }
  .respCard { align-self:stretch; margin-top:14px; border:2px solid #0c2c5c; border-radius:10px; overflow:hidden; background:#fff; }
  .respTitleBar { background:#0c2c5c; color:#fff; font-size:11px; font-weight:800; letter-spacing:2px; text-align:center; padding:9px 10px; }
  .respList { list-style:none; margin:0; padding:12px 14px; }
  @media print { body { background:#fff; } .cert { box-shadow:none; } }
</style></head><body>
<div class="cert">
  <div class="bgSwooshLeft"></div><div class="bgSwooshRight"></div>
  <div class="medalStack">
    <div class="stackBrandRow">
      <img src="${logoUrl}" alt="E-Nyagasambu" class="stackLogo" />
      <div>
        <h1 class="brandName">E-NYAGASAMBU</h1>
        <p class="brandTagline">Digital Market Place</p>
        <p class="brandSite">www.enyagasambu.rw</p>
      </div>
    </div>
    <img src="${badgeUrl}" alt="Official Brand Ambassador" class="medalImage" />
  </div>
  <div class="whiteCard">
    <div class="layoutGrid">
      <div class="mainCol">
        <header class="headerRow">
          <div style="text-align:center">
            <h2 class="titleMain">CERTIFICATE</h2>
            <p class="titleSub"><span class="titleDash"></span><span class="titleDot"></span>OF APPOINTMENT<span class="titleDot"></span><span class="titleDash"></span></p>
          </div>
        </header>
        <div class="awardSection">
          <p class="awardLabel">This Certificate is Proudly Awarded To</p>
          <h3 class="recipientName">${name}</h3>
          <div class="nameDivider"></div>
          <p class="appointLabel">For being officially appointed as a</p>
          <p class="appointRole">BRAND AMBASSADOR</p>
          <p class="appointOf">of E-Nyagasambu Digital Marketplace</p>
          <p class="description">In recognition of your commitment to promoting digital commerce,<br/>supporting local businesses, onboarding users, and representing<br/>the values and mission of E-Nyagasambu.</p>
        </div>
        <div class="infoRow">
          <div class="infoItem">
            <div class="infoHead"><svg class="infoIcon" viewBox="0 0 24 24" fill="none" stroke="#ed5b22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>Authorized Territory</span></div>
            <p class="infoValue infoDotted">${territory}</p>
          </div>
          <div class="infoSep"></div>
          <div class="infoItem">
            <div class="infoHead"><svg class="infoIcon" viewBox="0 0 24 24" fill="none" stroke="#ed5b22" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg><span>Issue Date</span></div>
            <p class="infoValue">${issued}</p>
          </div>
          <div class="infoSep"></div>
          <div class="infoItem">
            <div class="infoHead"><svg class="infoIcon" viewBox="0 0 24 24" fill="none" stroke="#ed5b22" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg><span>Valid Until</span></div>
            <p class="infoValue">${validUntil}</p>
          </div>
        </div>
        <footer class="signaturesRow">
          <div class="signatureCol">
            <svg class="signatureSvg" viewBox="0 0 140 42" aria-hidden><path d="M14,30 C28,8 44,34 58,20 S86,6 104,26 C112,32 122,22 130,18" fill="none" stroke="#1a1a3a" stroke-width="2" stroke-linecap="round"/></svg>
            <div class="signatureLine"></div>
            <p class="signatureTitle">Platform Director</p>
            <p class="signatureOrg">E-Nyagasambu Ltd</p>
          </div>
          <div class="sealWrap"><img src="${sealUrl}" alt="Seal" class="sealImage" /></div>
          <div class="signatureCol">
            <svg class="signatureSvg" viewBox="0 0 140 42" aria-hidden><path d="M20,28 C36,10 50,32 66,18 C78,10 92,30 108,16 C118,10 128,24 134,20" fill="none" stroke="#1a1a3a" stroke-width="2" stroke-linecap="round"/></svg>
            <div class="signatureLine"></div>
            <p class="signatureTitle">Business Development Officer</p>
            <p class="signatureOrg">E-Nyagasambu Ltd</p>
          </div>
        </footer>
      </div>
      <aside class="sideCol">
        <div class="qrBox"><img src="${qrUrl}" alt="QR" class="qrCode" /></div>
        <p class="scanLabel">Scan to Verify</p>
        <p class="sideLabel">Certificate No.</p>
        <div class="certNoPill">${certNo}</div>
        <p class="sideLabel">Issue Date</p>
        <p class="sideValue">${issued}</p>
        <div class="goldRule"></div>
        <p class="sideLabel">Valid Until</p>
        <p class="sideValue">${validUntil}</p>
        <div class="goldRule"></div>
        <div class="respCard">
          <div class="respTitleBar">RESPONSIBILITIES</div>
          <ul class="respList" style="list-style:none;margin:0;padding:12px 14px">${respItems}</ul>
        </div>
      </aside>
    </div>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
}
