'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SimulationBannerProps {
  referenceId?: string;
  paymentType?: 'listing' | 'contact';
  onSuccess?: () => void;
  onFailure?: () => void;
}

export default function SimulationBanner({ referenceId, paymentType = 'listing', onSuccess, onFailure }: SimulationBannerProps) {
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    checkSimulationMode();
  }, []);

  const checkSimulationMode = async () => {
    try {
      const { data } = await api.get('/simulation/status');
      setIsSimulationMode(data.simulationMode);
    } catch {
      setIsSimulationMode(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!referenceId) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post('/simulation/success', { referenceId });
      setMessage('Payment simulated as successful!');
      onSuccess?.();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to simulate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (!referenceId) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post('/simulation/failure', { referenceId });
      setMessage('Payment simulated as failed.');
      onFailure?.();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to simulate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleGetOtp = async () => {
    if (!referenceId) return;
    setLoading(true);
    setOtpCode('');
    try {
      const { data } = await api.get(`/simulation/otp?referenceId=${referenceId}&type=${paymentType}`);
      setOtpCode(data.code);
    } catch (err: any) {
      setOtpCode(err.response?.data?.message || 'No OTP available yet');
    } finally {
      setLoading(false);
    }
  };

  if (!isSimulationMode) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-600 font-bold text-sm">🧪 SIMULATION MODE</span>
        </div>
        <p className="text-xs text-yellow-700 mb-3">
          Payment simulation is active. No real money will be charged.
        </p>
        
        {referenceId && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleSimulateSuccess}
                disabled={loading}
                className="flex-1 bg-green-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '...' : '✓ Success'}
              </button>
              <button
                onClick={handleSimulateFailure}
                disabled={loading}
                className="flex-1 bg-red-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? '...' : '✗ Fail'}
              </button>
            </div>
            <button
              onClick={handleGetOtp}
              disabled={loading}
              className="w-full bg-blue-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '...' : 'Get OTP Code'}
            </button>
            {otpCode && (
              <div className="bg-white border border-blue-200 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500">OTP Code:</span>
                <span className="block text-lg font-mono font-bold text-blue-600">{otpCode}</span>
              </div>
            )}
          </div>
        )}
        
        {message && (
          <p className={`text-xs mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
