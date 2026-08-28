'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Check, X, Loader2, Search } from '@/lib/icons';



interface BrokerCertificate {
  broker_name: string;
  type_name: string;
  issued_date: string;
  valid_until: string;
  is_expired: boolean;
  broker_phone?: string;
}

interface VerifyResult {
  valid: boolean;
  message?: string;
  certificate: BrokerCertificate;
}

export default function VerifyBrokerCertificatePage() {
  const params = useParams();
  const certNo = params.certNo as string;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const { data } = await api.get(`/broker/certificate/verify/${certNo}`);
        setResult(data);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to verify certificate');
      } finally {
        setLoading(false);
      }
    };

    if (certNo) {
      verifyCertificate();
    }
  }, [certNo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Verifying broker certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Broker Certificate Verification</h1>
          <p className="text-gray-600 mt-2">Certificate Number: <span className="font-mono font-semibold">{certNo}</span></p>
        </div>

        {error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-red-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Verification Failed</h2>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-800">
                Please ensure you have entered the correct certificate number. If you believe this is an error, please contact our support team.
              </p>
            </div>
          </div>
        ) : result && result.valid ? (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-green-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-900">Valid Broker Certificate</h2>
                <p className="text-green-700">This certificate is authentic and {result.certificate.is_expired ? 'has expired' : 'currently valid'}.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Broker Name</p>
                  <p className="font-semibold text-gray-900">{result.certificate.broker_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Certificate Type</p>
                  <p className="font-semibold text-gray-900">{result.certificate.type_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Issue Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(result.certificate.issued_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valid Until</p>
                  <p className={`font-semibold ${result.certificate.is_expired ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(result.certificate.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {result.certificate.broker_phone && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact Phone</p>
                  <p className="font-semibold text-gray-900">{result.certificate.broker_phone}</p>
                </div>
              )}

              {result.certificate.is_expired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This certificate has expired. Please contact the broker or our support team for renewal information.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Verified by E-Nyagasambu Digital Marketplace • {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-yellow-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <X className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-yellow-900">Certificate Not Valid</h2>
                <p className="text-yellow-700">{result?.message || 'This certificate is not currently valid.'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}