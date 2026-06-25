import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';
import { ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { auth, db, getDoc, doc } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

type LoginMode = 'PIN' | 'OTP';

export function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>('PIN');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isSandbox, setIsSandbox] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState('');
  const [twilioError, setTwilioError] = useState('');

  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  // Helper to format phone to E.164 (defaults to India prefix +91 if needed)
  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/\D/g, '');
    if (num.startsWith('+')) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return '+' + cleaned;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send verification code");
      }

      const data = await response.json();
      if (data.success) {
        if (data.mode === 'simulated') {
          setIsSandbox(true);
          setSandboxOtp(data.otpCode);
          setTwilioError(data.twilioError || '');
        } else {
          setIsSandbox(false);
          setSandboxOtp('');
          setTwilioError('');
        }
        setStep('OTP');
      } else {
        throw new Error(data.message || "Failed to send verification code");
      }
    } catch (err: any) {
      console.error("Login OTP send error:", err);
      setError(err.message || "Could not send verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Please enter a valid OTP verification code');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Incorrect code. Please try again.");
      }

      const verifyData = await response.json();
      if (!verifyData.success) {
        throw new Error("Incorrect code. Please try again.");
      }

      // If OTP verified successfully, fetch user details and log in
      const cleanedPhone = phone.replace(/\D/g, '');
      let userData: any = null;
      let foundUser = false;

      try {
        // Try locating user by local key 'user_' + phone segment
        const localDocRef = doc(db, 'users', 'user_' + cleanedPhone);
        const localSnap = await getDoc(localDocRef);
        if (localSnap.exists()) {
          userData = localSnap.data();
          foundUser = true;
        } else {
          // Check ks_db_users local cache
          const localUsersJson = localStorage.getItem('ks_db_users');
          if (localUsersJson) {
            const localUsers = JSON.parse(localUsersJson);
            const matched = localUsers.find((u: any) => u.phone && u.phone.replace(/\D/g, '') === cleanedPhone);
            if (matched) {
              userData = matched;
              foundUser = true;
            }
          }
        }
      } catch (dbErr) {
        console.warn("Firestore lookup failed", dbErr);
      }

      if (foundUser && userData) {
        setUser(userData);
        sessionStorage.setItem('ks_session_user', JSON.stringify(userData));
        if (isSandbox) {
          sessionStorage.setItem('ks_is_local_only', 'true');
        } else {
          sessionStorage.removeItem('ks_is_local_only');
        }
        navigate('/');
      } else {
        throw new Error("No account details found for this phone number. Please register first!");
      }

    } catch (err: any) {
      console.error("Login OTP Verification Error:", err);
      setError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePINLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || !pin) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const success = await login(phone, pin);
      if (!success) {
        setError("Invalid phone number or Security Code");
      }
    } catch (e: any) {
      setError(e.message || "Invalid phone number or Security Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto items-center justify-center bg-background">
      <div id="login-recaptcha-container"></div>

      <div className="mb-6">
        <BrandLogo size={80} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("welcome_back")}</h1>
      <p className="text-gray-500 mb-6 text-center">{t("login_to_continue")}</p>

      {/* Mode Selector Toggle */}
      <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl mb-6 w-full">
        <button
          type="button"
          onClick={() => {
            setLoginMode('PIN');
            setError('');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${loginMode === 'PIN' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
        >
          <KeyRound size={16} />
          Security Code
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMode('OTP');
            setError('');
            setStep('PHONE');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${loginMode === 'OTP' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
        >
          <ShieldCheck size={16} />
          OTP Login (SMS)
        </button>
      </div>
      
      {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100 mb-4 w-full">{error}</div>}

      {loginMode === 'PIN' ? (
        <form onSubmit={handlePINLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">{t("phone_number")}</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
              placeholder="e.g., 9876543210"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">{t("security_code")}</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
              placeholder="••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center space-x-2 mt-6 active:scale-95 transition-transform disabled:opacity-75"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            <span>{loading ? "Logging in..." : t("login")}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      ) : (
        /* OTP Login Flow */
        <div className="w-full">
          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1">{t("phone_number")}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                  placeholder="e.g., 9876543210"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center space-x-2 mt-6 active:scale-95 transition-transform disabled:opacity-75"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                <span>{loading ? "Sending OTP..." : "Send Verification OTP"}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndLogin} className="space-y-4">
              {isSandbox && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-4 text-sm text-left">
                  <span className="font-bold block mb-1">🛠️ Sandbox Mode Active</span>
                  {twilioError ? (
                    <div className="mb-2 text-xs leading-relaxed">
                      <strong>Notice:</strong> Real Twilio SMS delivery was attempted but encountered an account restriction:
                      <code className="block bg-amber-100/70 p-1.5 rounded mt-1 font-mono text-[11px] text-amber-900 border border-amber-200 overflow-x-auto whitespace-pre-wrap">{twilioError}</code>
                    </div>
                  ) : (
                    <p className="mb-2">We generated a sandbox OTP since Twilio keys are not configured yet.</p>
                  )}
                  Please enter this simulated code: <strong className="text-base select-all bg-white px-2.5 py-0.5 rounded border border-amber-300 ml-1 font-mono tracking-wider">{sandboxOtp}</strong>
                </div>
              )}

              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-4 flex flex-col items-center text-center">
                <ShieldCheck size={36} className="mb-2" />
                <p className="text-sm font-medium">OTP Code requested for</p>
                <p className="font-bold">{phone}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1">Enter Verification Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center space-x-2 mt-6 active:scale-95 transition-transform disabled:opacity-75"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                <span>{loading ? "Verifying..." : "Verify & Login"}</span>
                {!loading && <ArrowRight size={18} />}
              </button>

              <button 
                type="button" 
                onClick={() => setStep('PHONE')} 
                className="w-full text-sm font-bold text-gray-500 mt-2 text-center"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <span className="text-gray-500 text-sm">{t("no_account")} </span>
        <button onClick={() => navigate('/register')} className="text-primary font-bold text-sm">{t("create_one")}</button>
      </div>

    </div>
  );
}

