import { SITE_DOMAIN, SITE_URL } from '@/lib/config';

const NAVY = '#0f1e42';
const ORG = '#E85D04';
const GOLD = '#c9a227';

const RESPONSIBILITIES = [
  'Promote E-Nyagasambu services',
  'Recruit suppliers and vendors',
  'Support user onboarding',
  'Conduct awareness campaigns',
  'Represent the platform professionally',
  'Uphold E-Nyagasambu policies',
];

export function buildAmbassadorCertPrintHtml(opts: {
  name: string;
  certNo: string;
  issued: string;
  validUntil: string;
  territory?: string;
}) {
  const { name, certNo, issued, validUntil, territory = 'Kigali City' } = opts;
  const verifyUrl = `${SITE_URL}/verify/${certNo}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;
  const respItems = RESPONSIBILITIES.map(
    item => `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:9px">
      <div style="width:16px;height:16px;border-radius:50%;background:${ORG};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
        <span style="color:#fff;font-size:9px;font-weight:900">✓</span>
      </div>
      <span style="font-size:9px;color:${NAVY};line-height:1.35">${item}</span>
    </div>`
  ).join('');

  return `<!DOCTYPE html><html><head><title>Certificate - ${certNo}</title>
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@900&display=swap" rel="stylesheet" />
<style>
  @page { size: landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial,Helvetica,sans-serif; margin: 0; background: #fff; }
  .cert { width: 1000px; height: 700px; position: relative; background: #fff; overflow: hidden; margin: 0 auto; }
  .badge { display: inline-flex; align-items: center; gap: 12px; border-radius: 28px; border: 1px solid ${NAVY}; background: #f7f9ff; padding: 12px 18px; }
  .badge-dot { width: 44px; height: 44px; border-radius: 50%; background: ${ORG}; display: grid; place-items: center; color: #fff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
  .top-panel { display: flex; justify-content: space-between; gap: 20px; padding: 28px 36px 0 36px; }
  .top-center { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .top-center h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 56px; color: ${NAVY}; letter-spacing: 4px; margin: 0; }
  .top-center .subtitle { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .top-center .subtitle div { height: 2px; background: ${NAVY}; flex: 1; }
  .top-center .subtitle span { font-size: 14px; color: ${ORG}; font-weight: 900; letter-spacing: 4px; }
  .top-center p { margin: 12px 0 0; font-size: 10.5px; color: #555; letter-spacing: 1.1; }
  .details-panel { width: 248px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .details-box { width: 100%; background: #f7f9ff; border-radius: 18px; padding: 14px 16px; border: 1px solid rgba(15,30,66,0.15); box-shadow: 0 14px 24px rgba(15,30,66,0.06); }
  .details-box strong { color: ${NAVY}; }
  .details-box .title { font-size: 8px; color: ${ORG}; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 9px; }
  .main-row { display: flex; gap: 16px; margin-top: 18px; padding: 0 36px 24px 36px; }
  .main-left { width: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 18px; }
  .main-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 12px; }
  .main-body h2 { font-family: 'Great Vibes', cursive; font-size: 46px; color: ${NAVY}; margin: 0 0 8px; line-height: 1.05; }
  .main-body .line { width: 360px; height: 2px; background: linear-gradient(90deg, transparent, ${GOLD}, transparent); margin-bottom: 18px; }
  .main-body .role { font-size: 14px; color: ${NAVY}; text-align: center; margin: 0 0 12px; line-height: 1.5; }
  .main-body .role strong { font-size: 18px; font-weight: 900; color: ${ORG}; letter-spacing: 0.8; }
  .main-body .desc { font-size: 10px; color: #555; text-align: center; margin: 0 0 22px; line-height: 1.7; max-width: 520px; }
  .stats { display: flex; justify-content: center; gap: 28px; flex-wrap: wrap; margin-bottom: 24px; }
  .stat { text-align: center; min-width: 98px; }
  .stat .label { font-size: 8px; color: ${ORG}; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .stat .value { font-size: 10px; color: ${NAVY}; font-weight: 700; }
  .signatures { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; max-width: 520px; }
  .signature { text-align: center; flex: 1; }
  .signature-line { width: 120px; height: 36px; }
  .signature-title { font-size: 8px; color: ${NAVY}; font-weight: 600; margin-top: 4px; border-top: 1px solid ${NAVY}; padding-top: 4px; }
  .badge-panel { width: 240px; display: flex; flex-direction: column; gap: 12px; }
  .badge-panel-box { border-radius: 20px; border: 1.5px solid ${NAVY}; background: #eef4fb; overflow: hidden; box-shadow: 0 18px 42px rgba(15,30,66,0.06); }
  .badge-panel-box .header { background: ${NAVY}; padding: 14px 16px; text-align: center; }
  .badge-panel-box .header span { color: #fff; font-size: 10px; font-weight: 800; letter-spacing: 2px; }
  .badge-panel-box .content { padding: 16px 14px; }
  .badge-panel-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
  .badge-panel-item:last-child { margin-bottom: 0; }
  .badge-panel-item .bullet { width: 18px; height: 18px; border-radius: 50%; background: ${ORG}; display: grid; place-items: center; margin-top: 1px; }
  .badge-panel-item .bullet span { color: #fff; font-size: 10px; font-weight: 900; }
  .badge-panel-item .text { margin: 0; font-size: 10px; color: ${NAVY}; line-height: 1.45; }
</style></head><body>
<div class="cert">
  <svg style="position:absolute;top:0;left:0;width:200px;height:160px" viewBox="0 0 200 160"><path d="M0,0 L200,0 L200,80 Q120,100 0,160 Z" fill="${NAVY}"/><path d="M0,0 L140,0 Q80,40 0,100 Z" fill="${ORG}" opacity="0.85"/></svg>
  <svg style="position:absolute;top:0;right:0;width:180px;height:140px" viewBox="0 0 180 140"><path d="M180,0 L0,0 L0,70 Q60,90 180,140 Z" fill="${NAVY}"/><path d="M180,0 L40,0 Q100,35 180,90 Z" fill="${ORG}" opacity="0.85"/></svg>
  <svg style="position:absolute;bottom:0;right:0;width:220px;height:150px" viewBox="0 0 220 150"><path d="M220,150 L220,0 L110,0 Q160,60 220,150 Z" fill="${NAVY}"/><path d="M220,150 L220,40 Q150,80 220,150 Z" fill="${ORG}" opacity="0.85"/></svg>

  <div style="position:absolute;inset:0;display:flex;flex-direction:column;z-index:2">
    <div class="top-panel">
      <div style="display:flex;flex-direction:column;gap:16px;min-width:260px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" fill="${NAVY}" stroke="${ORG}" stroke-width="1.5"/><text x="8" y="36" font-size="28" font-weight="900" font-family="Arial Black,Arial" fill="#fff">E</text></svg>
          <div>
            <div style="font-size:15px;font-weight:900;color:${NAVY};letter-spacing:1.2">E-NYAGASAMBU</div>
            <div style="font-size:8.5px;color:${ORG};letter-spacing:2px;font-weight:700">DIGITAL MARKET PLACE</div>
            <div style="font-size:7.5px;color:${NAVY};margin-top:2px">www.${SITE_DOMAIN}</div>
          </div>
        </div>
        <div class="badge"><div class="badge-dot">official</div><div style="display:flex;flex-direction:column;line-height:1.05"><span style="font-size:9px;font-weight:700;color:${NAVY};letter-spacing:1.3">BRAND</span><span style="font-size:14px;font-weight:900;color:${NAVY};letter-spacing:0.6">AMBASSADOR</span></div></div>
      </div>

      <div class="top-center">
        <h1>CERTIFICATE</h1>
        <div class="subtitle"><div></div><span>OF APPOINTMENT</span><div></div></div>
        <p>This Certificate is Proudly Awarded To</p>
      </div>

      <div class="details-panel">
        <img src="${qrUrl}" width="90" height="90" style="border-radius:18px;border:1px solid #d9d9d9;" />
        <div class="details-box">
          <div class="title">Scan to verify</div>
          <div style="font-size:9px;color:${NAVY};margin-bottom:8px;"><strong>Certificate No.</strong> <span style="display:inline-block;background:${NAVY};color:#fff;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:700">${certNo}</span></div>
          <div style="font-size:9px;color:${NAVY};margin-bottom:6px;"><strong>Issue Date</strong> <span style="float:right">${issued}</span></div>
          <div style="font-size:9px;color:${NAVY};"><strong>Valid Until</strong> <span style="float:right">${validUntil}</span></div>
        </div>
      </div>
    </div>

    <div class="main-row">
      <div class="main-left">
        <svg width="140" height="160" viewBox="0 0 140 140"><defs><radialGradient id="sealGold" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#f7d670"/><stop offset="100%" stop-color="#a8841a"/></radialGradient></defs><circle cx="70" cy="70" r="56" fill="url(#sealGold)" stroke="#a8841a" stroke-width="2"/><circle cx="70" cy="70" r="48" fill="none" stroke="#a8841a" stroke-width="1.5" stroke-dasharray="4 3"/><circle cx="70" cy="70" r="40" fill="none" stroke="#a8841a" stroke-width="1"/><path d="M70,30 C90,30 90,60 70,60 C50,60 50,30 70,30 Z" fill="#a8841a" opacity="0.08"/><path d="M32,70 Q70,40 108,70 Q70,100 32,70" fill="none" stroke="#a8841a" stroke-width="1.2"/><text x="70" y="56" text-anchor="middle" font-size="8" font-weight="800" fill="${NAVY}" font-family="Arial,sans-serif">OFFICIAL</text><text x="70" y="68" text-anchor="middle" font-size="8" font-weight="800" fill="${NAVY}" font-family="Arial,sans-serif">BRAND</text><text x="70" y="80" text-anchor="middle" font-size="8" font-weight="800" fill="${NAVY}" font-family="Arial,sans-serif">AMBASSADOR</text></svg>
        <div style="margin-top:18px;font-size:10px;color:#444;font-weight:700;text-align:center;">Official Brand Ambassador Seal</div>
      </div>

      <div class="main-body">
        <h2>${name}</h2>
        <div class="line"></div>
        <p class="role">For being officially appointed as a <strong>BRAND AMBASSADOR</strong> of E-Nyagasambu Digital Marketplace</p>
        <p class="desc">In recognition of your commitment to promoting digital commerce, supporting local businesses, onboarding users, and representing the values and mission of E-Nyagasambu.</p>
        <div class="stats">
          <div class="stat"><div class="label"><span>Authorized Territory</span></div><div class="value">${territory}</div></div>
          <div class="stat"><div class="label"><span>Issue Date</span></div><div class="value">${issued}</div></div>
          <div class="stat"><div class="label"><span>Valid Until</span></div><div class="value">${validUntil}</div></div>
        </div>
        <div class="signatures">
          <div class="signature"><svg class="signature-line" viewBox="0 0 120 36"><path d="M8,28 C25,10 40,32 55,18 S85,8 112,24" fill="none" stroke="#333" stroke-width="1.5"/></svg><div class="signature-title">Platform Director, E-Nyagasambu Ltd</div></div>
          <div style="width:88px;height:88px;display:flex;align-items:center;justify-content:center;"><svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="42" fill="none" stroke="${NAVY}" stroke-width="2"/><text x="45" y="22" text-anchor="middle" font-size="5.5" font-weight="700" fill="${NAVY}">E-NYAGASAMBU LTD</text><circle cx="45" cy="48" r="14" fill="${NAVY}"/><text x="45" y="53" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">E</text></svg></div>
          <div class="signature"><svg class="signature-line" viewBox="0 0 120 36"><path d="M8,28 C25,10 40,32 55,18 S85,8 112,24" fill="none" stroke="#333" stroke-width="1.5"/></svg><div class="signature-title">Business Development Officer, E-Nyagasambu Ltd</div></div>
        </div>
      </div>

      <div class="badge-panel">
        <div class="badge-panel-box">
          <div class="header"><span>RESPONSIBILITIES</span></div>
          <div class="content">
            ${RESPONSIBILITIES.map(item => `<div class="badge-panel-item"><div class="bullet"><span>✓</span></div><p class="text">${item}</p></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>window.onload=function(){window.print();window.close();}</script>
</body></html>`;
}
