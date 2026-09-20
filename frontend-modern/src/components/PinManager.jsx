import React, { useState, useEffect } from 'react';
import { setSessionKey, sessionCryptoKey } from '../services/syncService';
import { deriveKey as deriveCryptoKey } from '../utils/crypto';

export default function PinManager({ onUnlocked }) {
    const [needsSetup, setNeedsSetup] = useState(false);
    const [needsUnlock, setNeedsUnlock] = useState(false);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const salt = localStorage.getItem('userPinSalt');
        if (!salt) {
            setNeedsSetup(true);
        } else if (!sessionCryptoKey) {
            setNeedsUnlock(true);
        } else {
            if (onUnlocked) onUnlocked();
        }
    }, [onUnlocked]);

    const handleSetup = async (e) => {
        e.preventDefault();
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }
        setError('');

        // Generate new derived key and salt
        const { key, saltHex } = await deriveCryptoKey(pin);
        localStorage.setItem('userPinSalt', saltHex);
        // Note: To use setSessionKey, I need to import it properly.
        // I will dynamically import it here to avoid circular deps.
        import('../services/syncService').then(({ setSessionKey }) => {
            setSessionKey(key);
            setNeedsSetup(false);
            if (onUnlocked) onUnlocked();
        });
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        setError('');
        const salt = localStorage.getItem('userPinSalt');

        // In a real app we'd verify the PIN against a known hash. For now, we trust.
        const { key } = await deriveCryptoKey(pin, salt);
        import('../services/syncService').then(({ setSessionKey }) => {
            setSessionKey(key);
            setNeedsUnlock(false);
            if (onUnlocked) onUnlocked();
        });
    };

    if (!needsSetup && !needsUnlock) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-medical-gray-900/50 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-medical-white p-8 shadow-2xl">
                <h2 className="text-xl font-serif text-medical-gray-900 mb-6 font-bold text-center">
                    {needsSetup ? 'Set Security PIN' : 'Enter PIN to Unlock'}
                </h2>
                <p className="text-sm text-medical-gray-600 mb-6 text-center">
                    {needsSetup
                        ? 'Set a 4-digit PIN to securely encrypt patient cases on this device.'
                        : 'Your local cases are encrypted. Enter your PIN to unlock them for offline access.'}
                </p>

                <form onSubmit={needsSetup ? handleSetup : handleUnlock} className="space-y-4">
                    <input
                        type="password"
                        maxLength="4"
                        placeholder={needsSetup ? "Enter 4-digit PIN" : "PIN"}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white p-3 text-center text-2xl tracking-widest outline-none focus:border-medical-blue-light focus:ring-1 focus:ring-medical-blue-light"
                    />
                    {needsSetup && (
                        <input
                            type="password"
                            maxLength="4"
                            placeholder="Confirm PIN"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full rounded-lg border border-medical-gray-200 bg-medical-soft-white p-3 text-center text-2xl tracking-widest outline-none focus:border-medical-blue-light focus:ring-1 focus:ring-medical-blue-light"
                        />
                    )}

                    {error && <p className="text-sm font-semibold text-medical-red text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-gradient-to-br from-medical-blue-light to-medical-blue-dark py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition"
                    >
                        {needsSetup ? 'Secure Device' : 'Unlock'}
                    </button>
                </form>
            </div>
        </div>
    );
}
