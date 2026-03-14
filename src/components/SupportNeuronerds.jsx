import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCopy, FaCheck } from 'react-icons/fa';
import QRCode from 'qrcode';

export default function SupportNeuronerds() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  const bkashNumber = '01711279638';

  useEffect(() => {
    setMounted(true);
    console.log('✅ SupportNeuronerds component mounted');
  }, []);

  useEffect(() => {
    if (isOpen && !qrDataUrl) {
      console.log('🔄 Generating QR code...');
      QRCode.toDataURL(bkashNumber, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        console.log('✅ QR code generated successfully');
        setQrDataUrl(url);
      }).catch(err => {
        console.error('❌ QR Code generation failed:', err);
      });
    }
  }, [isOpen, qrDataUrl]);

  const donationTiers = [
    { amount: 20, emoji: '☕', name: 'Tiny Coffee', description: 'A small sip of support' },
    { amount: 50, emoji: '💙', name: 'Developer Energy', description: 'Keeps the code flowing' },
    { amount: 100, emoji: '🚀', name: 'Legendary Coffee', description: 'Fuel for epic features' },
  ];

  const showToast = (message) => {
    console.log('📢 Toast:', message);
    alert(message);
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(bkashNumber);
      setCopied(true);
      showToast('☕ Number copied! You\'re awesome 😎');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy number');
    }
  };

  const handleDonationClick = (amount, name) => {
    showToast(`💙 ${name} selected! Coffee delivered, happiness level +1 😁`);
  };

  const handleCustomDonation = () => {
    if (customAmount && parseInt(customAmount) > 0) {
      showToast(`🥰 Feeling generous? You're a legend! Happiness level +999 🚀`);
      setCustomAmount('');
    }
  };

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = 'neuronerds-support-qr.png';
      link.click();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-red-500/90 z-[999999] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(255, 0, 0, 0.9)' // Bright red for debugging
      }}
      onClick={() => {
        console.log('🔒 Modal background clicked');
        setIsOpen(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Glassmorphism Modal */}
        <div 
          className="bg-yellow-500 border-4 border-red-500 rounded-3xl p-8 shadow-2xl"
          style={{
            backgroundColor: 'yellow',
            border: '4px solid red',
            minHeight: '200px',
            minWidth: '300px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">☕</span>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Support Neuronerds
                </h2>
                <p className="text-sm text-gray-400">Fuel the developer's energy ⚡</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-purple-500/20 rounded-full transition-all"
            >
              <FaTimes className="text-gray-400 hover:text-purple-400 text-xl" />
            </button>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-6">
            <p className="text-gray-200 text-sm leading-relaxed">
              <span className="text-lg">🥰</span> Hey there! Neuronerds is completely <span className="font-semibold text-blue-400">free</span> and always will be. But you know what keeps developers going? <span className="font-semibold text-purple-400">Coffee</span> ☕ and your love 💙
            </p>
            <p className="text-gray-300 text-sm mt-3">
              Every little bit helps us build cooler features, fix bugs faster, and keep the energy flowing! <span className="text-lg">✨</span>
            </p>
          </div>

          {/* Donation Tiers */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>💝</span> Choose Your Coffee Level
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {donationTiers.map((tier) => (
                <motion.button
                  key={tier.amount}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDonationClick(tier.amount, tier.name)}
                  className="group relative p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                  
                  <div className="relative z-10">
                    <div className="text-3xl mb-2">{tier.emoji}</div>
                    <div className="text-white font-bold text-lg">৳{tier.amount}</div>
                    <div className="text-purple-300 font-semibold text-sm">{tier.name}</div>
                    <div className="text-gray-400 text-xs mt-1">{tier.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>😋</span> Feeling Generous?
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter custom amount (৳)"
                className="flex-1 bg-gray-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCustomDonation}
                disabled={!customAmount || parseInt(customAmount) <= 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
              >
                Surprise! 🚀
              </motion.button>
            </div>
          </div>

          {/* bKash Payment Section */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/40 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📱</span> Send via bKash
            </h3>

            {/* bKash Number Card */}
            <div className="bg-gray-800/50 border border-purple-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-400 text-sm mb-2">bKash Number:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-white font-mono text-lg font-bold">{bkashNumber}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyNumber}
                  className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <FaCheck className="text-lg" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="text-lg" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 mb-4">
              {qrDataUrl && (
                <>
                  <div className="bg-white p-3 rounded-lg">
                    <img src={qrDataUrl} alt="bKash QR Code" className="w-40 h-40" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadQR}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    📥 Download QR Code
                  </motion.button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-300 space-y-2">
              <p className="font-semibold text-white mb-2">💡 How to send:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Open your bKash app</li>
                <li>Select "Send Money"</li>
                <li>Enter the number above or scan the QR code</li>
                <li>Enter your desired amount</li>
                <li>Complete the transaction</li>
                <li>You're a legend! 🎉</li>
              </ol>
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center text-gray-400 text-sm">
            <p>
              <span className="text-lg">💙</span> Whether you donate or not, thank you for being part of the Neuronerds family! <span className="text-lg">🥰</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {/* Floating Coffee Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          console.log('☕ Coffee button clicked');
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl flex items-center justify-center text-3xl cursor-pointer transition-all duration-300"
        style={{
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)'
        }}
      >
        ☕
      </motion.button>

      {/* Support Modal Portal */}
      <AnimatePresence>
        {isOpen && createPortal(modalContent, document.body)}
      </AnimatePresence>
      
      {/* Debug: Show modal state */}
      {isOpen && (
        <div className="fixed top-4 left-4 bg-green-500 text-white p-2 rounded z-[999999]">
          Modal is OPEN!
        </div>
      )}
    </>
  );
}
