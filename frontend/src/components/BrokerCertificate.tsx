'use client';
import React, { useState } from 'react';

interface BrokerCertificateProps {
  brokerName: string;
  brokerId: string;
  district: string;
  phone: string;
  email: string;
  profileImage?: string;
  qrCode?: string;
}

export default function BrokerCertificate({
  brokerName,
  brokerId,
  district,
  phone,
  email,
  profileImage = '/placeholder-avatar.jpg',
  qrCode = '/placeholder-qr.png',
}: BrokerCertificateProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const NAVY = '#0f1e42';
  const ORANGE = '#E85D04';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div
        className="perspective w-full max-w-4xl h-96 cursor-pointer relative"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s',
        }}
      >
        {/* FRONT SIDE */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex h-full">
            {/* Left Section - Broker Info */}
            <div
              className="w-1/2 p-8 flex flex-col justify-between"
              style={{ backgroundColor: NAVY }}
            >
              {/* Logo and Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2" style={{ borderColor: ORANGE }}>
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                </div>
                <h2 className="text-white font-bold text-sm tracking-widest">E-NYAGASAMBU</h2>
                <p className="text-orange-500 text-xs font-bold">DIGITAL MARKET PLACE</p>
                <h3 className="text-orange-500 text-2xl font-bold mt-2">CERTIFIED BROKER</h3>
              </div>

              {/* Broker Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{brokerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 text-lg">📋</span>
                  </div>
                  <div>
                    <p className="text-white text-xs">Broker ID</p>
                    <p className="text-white font-bold text-sm">: {brokerId}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 text-lg">📍</span>
                  </div>
                  <div>
                    <p className="text-white text-xs">District</p>
                    <p className="text-white font-bold text-sm">: {district}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 text-lg">📱</span>
                  </div>
                  <div>
                    <p className="text-white text-xs">Phone</p>
                    <p className="text-white font-bold text-sm">: {phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-500 text-lg">✉️</span>
                  </div>
                  <div>
                    <p className="text-white text-xs">Email</p>
                    <p className="text-white font-bold text-xs break-all">{email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Profile Photo and QR Code */}
            <div
              className="w-1/2 p-8 flex flex-col justify-between items-center"
              style={{ backgroundColor: '#f5f5f5' }}
            >
              {/* Profile Image */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: ORANGE }}>
                <img src={profileImage} alt={brokerName} className="w-full h-full object-cover" />
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="w-32 h-32 bg-white rounded-lg border-2 border-gray-300 p-2 flex items-center justify-center mb-2">
                  <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
                </div>
                <p className="text-gray-600 text-xs font-bold">SCAN TO VERIFY</p>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute w-full h-full rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col h-full" style={{ backgroundColor: NAVY }}>
            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="inline-block px-4 py-2 rounded-full" style={{ backgroundColor: ORANGE }}>
                <p className="text-white font-bold text-sm">AUTHORIZED SERVICES</p>
              </div>
            </div>

            {/* Services List */}
            <div className="px-8 flex-1 flex flex-col justify-center space-y-3">
              {[
                { title: 'Product Brokerage', icon: '✅' },
                { title: 'Property Brokerage', icon: '✅' },
                { title: 'Vehicle Brokerage', icon: '✅' },
                { title: 'Marketplace Verification', icon: '✅' },
                { title: 'Customer Support', icon: '✅' },
              ].map((service, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xl">{service.icon}</span>
                  <p className="text-white font-semibold text-sm">{service.title}</p>
                </div>
              ))}
            </div>

            {/* Contact Information */}
            <div className="px-8 pb-8 space-y-4 border-t-2" style={{ borderColor: ORANGE }}>
              <div className="flex items-start gap-3 mt-4">
                <span className="text-xl">🌐</span>
                <div>
                  <p className="text-orange-500 text-xs font-bold">Website</p>
                  <p className="text-white text-sm">www.enyagasambu.rw</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="text-orange-500 text-xs font-bold">Email</p>
                  <p className="text-white text-sm">info@enyagasambu.rw</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <p className="text-orange-500 text-xs font-bold">Emergency Contact</p>
                  <p className="text-white text-sm">+250 788 300 003</p>
                </div>
              </div>

              <div className="text-center mt-4 pt-4 border-t-2" style={{ borderColor: ORANGE }}>
                <p className="text-orange-500 font-bold text-xs">Building Trust. Connecting Opportunities. Growing Together.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click to Flip Instruction */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <p className="text-gray-600 text-sm animate-bounce">👆 Click to flip certificate</p>
      </div>
    </div>
  );
}
