import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, UserRole } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { ShieldCheck, CheckCircle2, Tractor, ShoppingBag, MapPin, Loader2, Search } from 'lucide-react';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../lib/firebase';

type RegisterStep = 'PHONE' | 'OTP' | 'DETAILS';

export function RegisterScreen() {
  const { t } = useTranslation();
  const { register, pendingVerification, setPendingVerification } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<RegisterStep>(() => pendingVerification?.step || 'PHONE');
  
  const [role, setRole] = useState<UserRole>(() => pendingVerification?.role || 'supplier');
  const [name, setName] = useState(() => pendingVerification?.name || '');
  const [phone, setPhone] = useState(() => pendingVerification?.phone || '');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  
  const [isSandbox, setIsSandbox] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState('');
  const [twilioError, setTwilioError] = useState('');
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  
  // Location States
  const [state, setState] = useState(() => pendingVerification?.state || '');
  const [district, setDistrict] = useState(() => pendingVerification?.district || '');
  const [city, setCity] = useState('');
  const [village, setVillage] = useState(() => pendingVerification?.village || '');
  const [pincode, setPincode] = useState('');
  const [landSize, setLandSize] = useState(() => pendingVerification?.landSize || '');
  
  const [statesList, setStatesList] = useState<string[]>([]);
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [pincodesList, setPincodesList] = useState<string[]>([]);
  const [villageSuggestions, setVillageSuggestions] = useState<string[]>([]);
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPincodes, setLoadingPincodes] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [error, setError] = useState('');

  // Fetch States list on step change to 'DETAILS'
  useEffect(() => {
    if (step === 'DETAILS') {
      setLoadingStates(true);
      fetch('/api/locations/states')
        .then(res => res.json())
        .then(data => {
          setStatesList(data);
          setLoadingStates(false);
        })
        .catch(err => {
          console.error("Error fetching states:", err);
          setLoadingStates(false);
          // Fallback static list
          setStatesList([
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
            "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
          ]);
        });
    }
  }, [step]);

  // Fetch Districts when State is manually changed
  const handleStateChange = (selectedState: string) => {
    setState(selectedState);
    setDistrict('');
    setCity('');
    setPincode('');
    setDistrictsList([]);
    setCitiesList([]);
    setPincodesList([]);
    setVillageSuggestions([]);
    
    if (!selectedState) return;
    
    setLoadingDistricts(true);
    fetch(`/api/locations/districts?state=${encodeURIComponent(selectedState)}`)
      .then(res => res.json())
      .then(data => {
        setDistrictsList(data);
        setLoadingDistricts(false);
      })
      .catch(err => {
        console.error("Error fetching districts:", err);
        setLoadingDistricts(false);
      });
  };

  // Fetch Cities/Tehsils when District is manually changed
  const handleDistrictChange = (selectedDistrict: string) => {
    setDistrict(selectedDistrict);
    setCity('');
    setPincode('');
    setCitiesList([]);
    setPincodesList([]);
    
    if (!state || !selectedDistrict) return;
    
    setLoadingCities(true);
    fetch(`/api/locations/cities-tehsils?state=${encodeURIComponent(state)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then(res => res.json())
      .then(data => {
        setCitiesList(data);
        setLoadingCities(false);
      })
      .catch(err => {
        console.error("Error fetching cities:", err);
        setLoadingCities(false);
      });
  };

  // Fetch Pincodes when City/Tehsil is manually changed
  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
    setPincode('');
    setPincodesList([]);
    
    if (!state || !district || !selectedCity) return;
    
    setLoadingPincodes(true);
    fetch(`/api/locations/pincodes?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&city=${encodeURIComponent(selectedCity)}`)
      .then(res => res.json())
      .then(data => {
        setPincodesList(data);
        setLoadingPincodes(false);
      })
      .catch(err => {
        console.error("Error fetching pincodes:", err);
        setLoadingPincodes(false);
      });
  };

  // Perform auto-lookup when 6-digit Pincode is typed
  const handlePincodeInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    
    if (cleaned.length === 6) {
      setLoadingLookup(true);
      setError('');
      
      fetch(`/api/locations/lookup-pincode?pincode=${cleaned}`)
        .then(res => res.json())
        .then(records => {
          setLoadingLookup(false);
          if (records && records.length > 0) {
            const first = records[0];
            setState(first.state);
            setDistrict(first.district);
            setCity(first.city);
            
            // Set suggestions for villages
            const villages = Array.from(new Set<string>(records.map((r: any) => r.village))).filter(Boolean) as string[];
            setVillageSuggestions(villages);
            
            // Populate lists with the resolved details so the dropdowns show active values
            setDistrictsList([first.district]);
            setCitiesList([first.city]);
            setPincodesList([cleaned]);
          } else {
            setError('Pincode details not found in database. Please choose manually.');
          }
        })
        .catch(err => {
          console.error("Pincode lookup error:", err);
          setLoadingLookup(false);
          setError('Failed to connect to location service. Please enter manually.');
        });
    }
  };

  // Helper to format phone to E.164 (defaults to India prefix +91 if needed)
  const formatPhoneNumber = (num: string) => {
    let cleaned = num.replace(/\D/g, '');
    if (num.startsWith('+')) {
      return '+' + cleaned;
    }
    // If it starts with 0, drop it and add +91
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // If it's a 10-digit number, prepend +91
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return '+' + cleaned;
  };

  // Setup/get invisible recaptcha verifier
  const getRecaptchaVerifier = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved successfully');
        }
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.error("Failed to create RecaptchaVerifier:", err);
      return null;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !phone) {
      setError('Please fill in Name and Phone Number');
      return;
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 10) {
      setError('Please enter a valid phone number (with country code if not in India)');
      return;
    }

    setRecaptchaLoading(true);
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
        setPendingVerification({ step: 'OTP', name, phone: formattedPhone, role });
      } else {
        throw new Error(data.message || "Failed to send verification code");
      }
    } catch (err: any) {
      console.error("OTP send error:", err);
      setError(err.message || "Could not send verification code. Please check your connection and try again.");
    } finally {
      setRecaptchaLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Please enter a valid verification code');
      return;
    }

    setRecaptchaLoading(true);
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

      const data = await response.json();
      if (data.success) {
        setStep('DETAILS');
        setPendingVerification({ step: 'DETAILS', name, phone: formattedPhone, role });
      } else {
        throw new Error(data.message || "Incorrect code. Please try again.");
      }
    } catch (err: any) {
      console.error("OTP Verification Error:", err);
      setError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setRecaptchaLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pin) {
      setError('Please set a Security Code for your account');
      return;
    }
    if (pin.length < 4) {
      setError('Security Code must be at least 4 digits');
      return;
    }
    if (!state) {
      setError('Please select a State');
      return;
    }
    if (!district) {
      setError('Please select a District');
      return;
    }
    if (!city) {
      setError('Please select a City/Tehsil');
      return;
    }
    if (!pincode) {
      setError('Please enter a Pincode');
      return;
    }
    
    try {
      await register({ 
        uid: auth.currentUser?.uid,
        name, 
        phone, 
        pin,
        role,
        village,
        state,
        district,
        city,
        pincode,
        landSize
      });
      navigate('/');
    } catch (e: any) {
      setError(e.message || "Failed to register.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto items-center justify-center bg-background py-10">
      <div className="mb-4">
        <BrandLogo size={80} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("create_account")}</h1>
      <p className="text-gray-500 mb-6 text-center">{t("join_kisansaathi")}</p>
      
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 mb-8 w-full max-w-[200px]">
        <div className={`h-2 flex-1 rounded-full ${step === 'PHONE' || step === 'OTP' || step === 'DETAILS' ? 'bg-secondary' : 'bg-gray-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step === 'OTP' || step === 'DETAILS' ? 'bg-secondary' : 'bg-gray-200'}`} />
        <div className={`h-2 flex-1 rounded-full ${step === 'DETAILS' ? 'bg-secondary' : 'bg-gray-200'}`} />
      </div>
      
      <div className="w-full">
        <div id="recaptcha-container" className="my-2 flex justify-center"></div>
        
        {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100 mb-4">{error}</div>}

        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            <div className="space-y-2 mb-4">
              <label className="text-sm font-bold text-gray-700 ml-1">I am a *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${role === 'supplier' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-200 bg-white text-gray-500 font-medium'}`}
                >
                  <Tractor size={18} /> Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('consumer')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors ${role === 'consumer' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold' : 'border-gray-200 bg-white text-gray-500 font-medium'}`}
                >
                  <ShoppingBag size={18} /> Consumer
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">{t("full_name")} *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder={t("full_name")}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">{t("phone_number")} *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder="Mobile Number"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={recaptchaLoading}
              className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-md mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {recaptchaLoading && <Loader2 size={18} className="animate-spin" />}
              <span>{recaptchaLoading ? "Sending OTP..." : "Send Verification Code"}</span>
            </button>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
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

            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-6 flex flex-col items-center">
              <ShieldCheck size={40} className="mb-2" />
              <p className="text-sm font-medium">We've sent a verification code to</p>
              <p className="font-bold">{phone}</p>
              <p className="text-xs mt-2 opacity-75">Enter the 6-digit code to continue</p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-sm font-bold text-gray-700 ml-1">Enter Verification Code *</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder="••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={recaptchaLoading}
              className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-md mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {recaptchaLoading && <Loader2 size={18} className="animate-spin" />}
              <span>{recaptchaLoading ? "Verifying..." : "Verify Code"}</span>
            </button>
            <button type="button" onClick={() => {
              setStep('PHONE');
              setPendingVerification(null);
            }} className="text-sm text-gray-500 font-medium mt-4">
              Wrong number? Go back
            </button>
          </form>
        )}

        {step === 'DETAILS' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <span className="text-sm font-bold text-gray-700">Phone Verified ({phone})</span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">{t("security_code")} *</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                placeholder="••••"
                required
              />
              <p className="text-xs text-gray-500 ml-1">Set a 4-digit Security Code for future login</p>
            </div>

            {/* Quick Pincode Auto-lookup */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">Enter Pincode (6 digits)</label>
                {loadingLookup && <Loader2 size={14} className="text-emerald-500 animate-spin" />}
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={e => handlePincodeInputChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-bold tracking-widest text-lg"
                  placeholder="e.g. 141401"
                  required
                />
                <div className="absolute right-3.5 top-3.5 text-gray-400">
                  <Search size={18} />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 ml-1">Type 6 digits for automatic state & district lookup.</p>
            </div>

            {/* State selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">State *</label>
                {loadingStates && <Loader2 size={14} className="text-gray-400 animate-spin" />}
              </div>
              <select
                value={state}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium"
                required
              >
                <option value="">Select State</option>
                {statesList.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* District selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">District *</label>
                {loadingDistricts && <Loader2 size={14} className="text-gray-400 animate-spin" />}
              </div>
              <select
                value={district}
                onChange={e => handleDistrictChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium"
                required
                disabled={!state}
              >
                <option value="">Select District</option>
                {districtsList.map(dst => (
                  <option key={dst} value={dst}>{dst}</option>
                ))}
              </select>
            </div>

            {/* City / Tehsil selection */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">City / Tehsil *</label>
                {loadingCities && <Loader2 size={14} className="text-gray-400 animate-spin" />}
              </div>
              <select
                value={city}
                onChange={e => handleCityChange(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium"
                required
                disabled={!district}
              >
                <option value="">Select City/Tehsil</option>
                {citiesList.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {/* Village Name input */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 ml-1">Village / Town *</label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/50 font-medium"
                placeholder="Enter Village Name"
                required
              />
              {/* Quick Suggestions */}
              {villageSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 ml-1">Select from matched postal locations:</p>
                  <div className="flex flex-wrap gap-1.5 p-1 max-h-[80px] overflow-y-auto">
                    {villageSuggestions.map((v, idx) => (
                      <button
                        key={`${v}_${idx}`}
                        type="button"
                        onClick={() => setVillage(v)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${village === v ? 'bg-emerald-500 border-emerald-500 text-white font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {role === 'supplier' && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1">{t("total_land")}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={landSize}
                    onChange={e => setLandSize(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-bold text-gray-400">{t("acres")}</span>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-md mt-6 active:scale-95 transition-transform flex items-center justify-center space-x-2">
              <MapPin size={18} />
              <span>{t("create_account")}</span>
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center pb-6">
        <span className="text-gray-500 text-sm">{t("have_account")} </span>
        <button type="button" onClick={() => navigate('/')} className="text-secondary font-bold text-sm">{t("sign_in")}</button>
      </div>
    </div>
  );
}
