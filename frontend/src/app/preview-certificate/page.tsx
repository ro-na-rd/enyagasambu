'use client';
import AmbassadorCertificate from '@/components/AmbassadorCertificate';

export default function PreviewCertificatePage() {
  const sampleData = {
    name: 'John Doe',
    certNo: 'ENA-AMB-2026-0001',
    issued: '15 August 2026',
    validUntil: '15 August 2027',
    territory: 'Kigali City',
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ambassador Certificate Preview</h1>
        <div className="flex justify-center">
          <AmbassadorCertificate
            name={sampleData.name}
            certNo={sampleData.certNo}
            issued={sampleData.issued}
            validUntil={sampleData.validUntil}
            territory={sampleData.territory}
          />
        </div>
        <p className="text-center text-gray-600 mt-6 text-sm">
          This is a preview of the ambassador certificate design. The actual certificate will include the ambassador&apos;s photo and real certificate number.
        </p>
      </div>
    </div>
  );
}