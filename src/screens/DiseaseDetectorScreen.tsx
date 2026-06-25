import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Sparkles, ChevronLeft, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchVisionDiagnosis } from '../lib/api';
import { useSubscription } from '../lib/subscription';
import { PremiumModal } from '../components/PremiumModal';

export function DiseaseDetectorScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isExpired } = useSubscription();
  const [showPremiumOptions, setShowPremiumOptions] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (isExpired) {
      setShowPremiumOptions(true);
      return;
    }
    if (!image) return;
    setAnalyzing(true);
    try {
      const data = await fetchVisionDiagnosis(image, i18n.language);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error analyzing image");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-gray-100 text-gray-800 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Disease Detection</h1>
      </header>

      <div className="flex-1 p-4 pb-20">
        {!image ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-2xl bg-white mb-6">
            <label className="flex flex-col items-center justify-center cursor-pointer p-6">
              <Camera size={48} className="text-primary mb-4" />
              <span className="text-sm font-medium text-gray-600 mb-2">Tap to take a photo of the crop</span>
              <span className="text-xs text-gray-400">or select from gallery</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-sm relative relative">
            <img src={image} alt="Crop" className="w-full h-64 object-cover" />
            <button onClick={() => {setImage(null); setResult(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
              <Upload size={16} />
            </button>
          </div>
        )}

        {image && !result && (
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-70"
          >
            {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>{analyzing ? "Analyzing Crop..." : "Scan with Kisan AI"}</span>
          </button>
        )}

        {result && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Diagnosis Result</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Crop Identified</p>
                <p className="font-semibold text-gray-800">{result.crop || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Issue / Disease</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    result.severity === 'severe' ? 'bg-red-100 text-red-700' :
                    result.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {result.severity || 'mild'}
                  </span>
                  <p className="font-bold text-gray-800">{result.disease || 'None detected'}</p>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-xs font-bold text-primary mb-2 uppercase">Treatment Plan</p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.treatment || 'No specific treatment needed.'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 mb-1 uppercase">Prevention</p>
                <p className="text-sm text-gray-700">{result.prevention || 'Maintain good watering practices.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <PremiumModal isOpen={showPremiumOptions} onClose={() => setShowPremiumOptions(false)} message="Your 30-day free trial has expired. Upgrade to unlock AI Disease Scans." />
    </div>
  );
}
