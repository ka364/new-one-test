/**
 * Two-Factor Authentication Component
 * UI for setting up and verifying 2FA
 */

import { useState } from 'react';

interface TwoFactorAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }), // Replace with actual user email
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.data.qrCode);
        setBackupCodes(data.data.backupCodes);
        setStep('verify');
      } else {
        setError('Failed to setup 2FA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com', // Replace with actual user email
          token: verificationCode,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess?.();
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h2>
        <p className="text-gray-600 mb-6">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Your smartphone</li>
              <li>A few minutes to complete setup</li>
            </ul>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Start Setup'}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
      
      <div className="space-y-6">
        {/* QR Code */}
        <div className="bg-gray-50 p-6 rounded-lg flex justify-center">
          {qrCode ? (
            <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
          ) : (
            <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg" />
          )}
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
            <li>Open your authenticator app</li>
            <li>Scan the QR code above</li>
            <li>Enter the 6-digit code below</li>
          </ol>
        </div>
        
        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Save Your Backup Codes</h3>
            <p className="text-yellow-800 text-sm mb-3">
              Store these codes in a safe place. You can use them to access your account if you lose your phone.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="bg-white p-2 rounded border border-yellow-300">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Verification Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={6}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
        </button>
      </div>
    </div>
  );
};

export const TwoFactorVerification: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!useBackupCode && verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = useBackupCode ? '/api/2fa/verify-backup' : '/api/2fa/verify';
      const body = useBackupCode
        ? { email: 'user@example.com', backupCode: verificationCode }
        : { email: 'user@example.com', token: verificationCode };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess?.();
      } else {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      <p className="text-gray-600 mb-6">
        Enter the 6-digit code from your authenticator app
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={useBackupCode ? 'Enter backup code' : '000000'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={useBackupCode ? 20 : 6}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleVerify}
          disabled={loading || (!useBackupCode && verificationCode.length !== 6)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        
        <button
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setVerificationCode('');
            setError('');
          }}
          className="w-full text-blue-600 text-sm hover:underline"
        >
          {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
        </button>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
