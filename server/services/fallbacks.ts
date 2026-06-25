export const getFallbackChatResponse = (prompt: string, language: string, role?: string): string => {
  const isHi = language === "Hindi";
  const isPb = language === "Punjabi";
  const lowPrompt = prompt.toLowerCase();
  
  let text = "";
  
  if (role === 'consumer') {
    if (lowPrompt.includes("recipe") || lowPrompt.includes("cook") || lowPrompt.includes("dish")) {
      if (isHi) {
        text = `यहाँ बाजरे की खिचड़ी की एक सरल रेसिपी है:\n1. आधा कप बाजरा और मूंग दाल को धोकर 2 घंटे के लिए भिगो दें।\n2. कुकर में घी गरम करें, उसमें जीरा, हींग और कटी हुई सब्जियां डालें।\n3. बाजरा, दाल, हल्दी, नमक और 4 कप पानी डालें।\n4. 4 सीटी आने तक पकाएं और गरम-गरम परोसें!`;
      } else if (isPb) {
        text = `ਇੱਥੇ ਬਾਜਰੇ ਦੀ ਖਿਚੜੀ ਦੀ ਇੱਕ ਸਧਾਰਨ ਰੈਸਿਪੀ ਹੈ:\n1. ਅੱਧਾ ਕੱਪ ਬਾਜਰਾ ਅਤੇ ਮੂੰਗੀ ਦੀ ਦਾਲ ਨੂੰ ਧੋ ਕੇ 2 ਘੰਟੇ ਲਈ ਭਿਓ ਦਿਓ।\n2. ਕੁੱਕਰ ਵਿੱਚ ਘਿਓ ਗਰਮ ਕਰੋ, ਜੀਰਾ, ਹੀਂਗ ਅਤੇ ਕੱਟੀਆਂ ਸਬਜ਼ੀਆਂ ਪਾਓ।\n3. ਬਾਜਰਾ, ਦਾਲ, ਹਲਦੀ, ਨਮਕ ਅਤੇ 4 ਕੱਪ ਪਾਣੀ ਪਾਓ।\n4. 4 ਸੀਟੀਆਂ ਆਉਣ ਤੱਕ ਪਕਾਓ ਅਤੇ ਗਰਮ-ਗਰਮ ਪਰੋਸੋ!`;
      } else {
        text = `Here is a simple healthy Millet Khichdi recipe:\n1. Wash and soak half a cup of Pearl Millet (Bajra) and Moong Dal for 2 hours.\n2. Heat ghee in a pressure cooker, add cumin, hing, and chopped vegetables of your choice.\n3. Add the millet, dal, turmeric, salt, and 4 cups of water.\n4. Cook for 4 whistles on medium flame. Serve hot with curd!`;
      }
    } else if (lowPrompt.includes("millet") || lowPrompt.includes("grain") || lowPrompt.includes("diet") || lowPrompt.includes("health")) {
      if (isHi) {
        text = `बाजरा, रागी और ज्वार जैसे मोटे अनाज पोषण से भरपूर होते हैं। इनमें भरपूर मात्रा में डाइटरी फाइबर, आयरन और कैल्शियम होता है, जो मधुमेह को नियंत्रित करने और पाचन में सुधार करने में मदद करता है।`;
      } else if (isPb) {
        text = `ਬਾਜਰਾ, ਰਾਗੀ ਅਤੇ ਜਵਾਰ ਵਰਗੇ ਮੋਟੇ ਅਨਾਜ ਪੋਸ਼ਣ ਨਾਲ ਭਰਪੂਰ ਹੁੰਦੇ ਹਨ। ਇਹਨਾਂ ਵਿੱਚ ਭਰਪੂਰ ਮਾਤਰਾ ਵਿੱਚ ਫਾਈਬਰ, ਆਇਰਨ ਅਤੇ ਕੈਲਸ਼ੀਅਮ ਹੋਵੇਗਾ, ਜੋ ਸ਼ੂਗਰ ਨੂੰ ਕੰਟਰੋਲ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।`;
      } else {
        text = `Millets (like Bajra, Ragi, Jowar) are powerhouse grains. They are rich in dietary fiber, gluten-free, and loaded with essential minerals like Iron and Calcium. Incorporating them into your daily diet helps manage diabetes and improves gut health.`;
      }
    } else {
      if (isHi) {
        text = `किसानसाथी उपभोक्ता सहायक में आपका स्वागत है! मैं यहाँ आपको सीधे खेतों से मिलने वाले शुद्ध, जैविक उत्पादों और स्वस्थ जीवन शैली के बारे में जानकारी देने के लिए हूँ। आप मुझसे रेसिपी, फसलों के पोषण लाभ और जैविक खेती के बारे में पूछ सकते हैं।`;
      } else if (isPb) {
        text = `ਕਿਸਾਨਸਾਥੀ ਉਪਭੋਗਤਾ ਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਮੈਂ ਇੱਥੇ ਤੁਹਾਨੂੰ ਸਿੱਧੇ ਖੇਤਾਂ ਤੋਂ ਮਿਲਣ ਵਾਲੇ ਸ਼ੁੱਧ, ਜੈਵਿਕ ਉਤਪਾਦਾਂ ਅਤੇ ਸਿਹਤਮੰਦ ਜੀਵਨ ਸ਼ੈਲੀ ਬਾਰੇ ਜਾਣਕਾਰੀ ਦੇਣ ਲਈ ਹਾਂ।`;
      } else {
        text = `Welcome to KisanSaathi Consumer Assistant! I'm here to guide you on fresh, organic produce directly from farmers, regional crop health benefits, sustainable eating, and delicious farm-to-table recipes. Ask me anything about healthy grains, millets, or fresh veggies!`;
      }
    }
  } else {
    // Farmer Assistant
    if (lowPrompt.includes("pest") || lowPrompt.includes("disease") || lowPrompt.includes("insect") || lowPrompt.includes("fungus") || lowPrompt.includes("keeda")) {
      if (isHi) {
        text = `फसल में कीट या रोग प्रबंधन के लिए सामान्य सुझाव:\n1. नीम का तेल (Neem Oil 1500 PPM) 5 मिली प्रति लीटर पानी में मिलाकर छिड़काव करें। यह एक सुरक्षित जैविक उपाय है।\n2. रोगग्रस्त पौधों को खेत से हटा दें ताकि रोग अन्य पौधों में न फैले।\n3. फसल चक्र (Crop Rotation) अपनाएं।\n4. रासायनिक नियंत्रण के लिए किसी स्थानीय कृषि विशेषज्ञ से सलाह अवश्य लें।`;
      } else if (isPb) {
        text = `ਫਸਲਾਂ ਵਿੱਚ ਕੀੜੇ ਜਾਂ ਬਿਮਾਰੀ ਦੇ ਪ੍ਰਬੰਧਨ ਲਈ ਆਮ ਸੁਝਾਅ:\n1. ਨਿੰਮ ਦਾ ਤੇਲ (Neem Oil 1500 PPM) 5 ਮਿਲੀਲੀਟਰ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ। ਇਹ ਇੱਕ ਸੁਰੱਖਿਅਤ ਜੈਵਿਕ ਉਪਾਅ ਹੈ।\n2. ਬਿਮਾਰ ਪੌਦਿਆਂ ਨੂੰ ਖੇਤ ਵਿੱਚੋਂ ਕੱਢ ਦਿਓ।\n3. ਫਸਲੀ ਚੱਕਰ (Crop Rotation) ਅਪਣਾਓ।\n4. ਕਿਸੇ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਮਾਹਿਰ ਨਾਲ ਸਲਾਹ ਜ਼ਰੂਰ ਕਰੋ।`;
      } else {
        text = `General advisory for pest or disease management:\n1. Use organic Neem Oil (1500 PPM) at 5ml/liter of water as a safe preventive spray.\n2. Manually remove and safely destroy infected plants to prevent transmission.\n3. Implement crop rotation and avoid waterlogging.\n4. For chemical sprays, consult a certified agronomist to get precise dosages for your specific crop.`;
      }
    } else if (lowPrompt.includes("weather") || lowPrompt.includes("rain") || lowPrompt.includes("monsoon") || lowPrompt.includes("barish") || lowPrompt.includes("mousam")) {
      if (isHi) {
        text = `मौसम संबंधित सलाह:\n1. बुवाई या कीटनाशक छिड़काव से पहले हमेशा 3-दिन का मौसम पूर्वानुमान हमारे 'मौसम' टैब पर देखें।\n2. तेज हवा (>15 किमी/घंटा) या बारिश की संभावना होने पर कीटनाशक का छिड़काव टालें।\n3. यदि भारी बारिश होने वाली हो, तो सिंचाई रोक दें और खेतों में जल निकासी (drainage) की व्यवस्था दुरुस्त करें।`;
      } else if (isPb) {
        text = `ਮੌਸਮ ਸੰਬੰਧੀ ਸਲਾਹ:\n1. ਬਿਜਾਈ ਜਾਂ ਕੀਟਨਾਸ਼ਕ ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਹਮੇਸ਼ਾ ਸਾਡੇ 'ਮੌਸਮ' ਟੈਬ 'ਤੇ 3-ਦਿਨ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ ਦੇਖੋ।\n2. ਤੇਜ਼ ਹਵਾ ਜਾਂ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਹੋਣ 'ਤੇ ਛਿੜਕਾਅ ਨਾ ਕਰੋ।\n3. ਭਾਰੀ ਮੀਂਹ ਦੀ ਸੂਰਤ ਵਿੱਚ ਸਿੰਚਾਈ ਰੋਕ ਦਿਓ ਅਤੇ ਨਿਕਾਸੀ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ।`;
      } else {
        text = `Weather advisory recommendations:\n1. Always check our dedicated 'Weather' tab for a 3-day micro-forecast before sowing or spraying.\n2. Postpone chemical spraying if wind speeds exceed 15 km/h or rain probability is high.\n3. Clear drainage channels to prevent waterlogging before heavy downpours.`;
      }
    } else if (lowPrompt.includes("fertilizer") || lowPrompt.includes("urea") || lowPrompt.includes("soil") || lowPrompt.includes("khad")) {
      if (isHi) {
        text = `मिट्टी और उर्वरक संबंधित सलाह:\n1. संतुलित मात्रा में खाद डालें। यूरिया (N), सिंगल सुपर फॉस्फेट (P) और म्‍यूरिएट ऑफ पोटाश (K) का अनुपात 4:2:1 रखें।\n2. हमारी 'मिट्टी की सेहत' (Soil Health) सुविधा में जाकर अपनी मिट्टी का परीक्षण विवरण दर्ज करें ताकि आपको विशिष्ट सलाह मिल सके।\n3. जैविक खाद (Compost या गोबर की खाद) का भरपूर उपयोग करें ताकि मिट्टी की जल धारण क्षमता बढ़े।`;
      } else if (isPb) {
        text = `ਮਿੱਟੀ ਅਤੇ ਖਾਦ ਸੰਬੰਧੀ ਸਲਾਹ:\n1. ਖਾਦਾਂ ਦੀ ਸੰਤੁਲਿਤ ਵਰਤੋਂ ਕਰੋ। ਨਾਈਟ੍ਰੋਜਨ, ਫਾਸਫੋਰਸ ਅਤੇ ਪੋਟਾਸ਼ ਦਾ ਅਨੁਪਾਤ 4:2:1 ਰੱਖੋ।\n2. ਸਾਡੇ 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ' (Soil Health) ਟੈਬ 'ਤੇ ਜਾ ਕੇ ਆਪਣੀ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਰਿਪੋਰਟ ਦਰਜ ਕਰੋ।\n3. ਰੂੜੀ ਦੀ ਖਾਦ (Organic Compost) ਦੀ ਵਰਤੋਂ ਵਧਾਓ।`;
      } else {
        text = `Soil & fertilizer advisory:\n1. Maintain a balanced NPK ratio (typically 4:2:1 for cereal crops like wheat and rice).\n2. Head over to our 'Soil Health' tab to enter your soil test values and get a customized recommendation.\n3. Integrate organic manure or vermicompost to improve soil structure and moisture retention.`;
      }
    } else {
      if (isHi) {
        text = `नमस्ते! मैं आपका किसानसाथी AI सहायक हूँ। मैं आपको फसलों की सुरक्षा, मवेशी स्वास्थ्य, मौसम की जानकारी और सरकारी योजनाओं के बारे में सलाह दे सकता हूँ। आप मुझसे खेती से जुड़ा कोई भी सवाल पूछ सकते हैं!`;
      } else if (isPb) {
        text = `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਕਿਸਾਨਸਾਥੀ AI ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਨੂੰ ਫਸਲਾਂ ਦੀ ਸੁਰੱਖਿਆ, ਪਸ਼ੂਆਂ ਦੀ ਸਿਹਤ ਅਤੇ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਸਲਾਹ ਦੇ ਸਕਦਾ ਹਾਂ।`;
      } else {
        text = `Hello! I am your KisanSaathi AI Assistant. I can help you with crop disease management, soil fertility, animal husbandry, crop calendars, and navigating government schemes. Please ask me any questions about your farm!`;
      }
    }
  }

  const configMsg = isHi 
    ? `\n\n(⚠️ ऑफ़लाइन डेमो मोड: लाइव AI प्रतिक्रियाओं के लिए, कृपया अपने AI Studio सेटिंग्स/सीक्रेट्स पैनल में GROQ_API_KEY या GEMINI_API_KEY सेट करें।)`
    : isPb
    ? `\n\n(⚠️ ਔਫਲਾਈਨ ਡੈਮੋ ਮੋਡ: ਲਾਈਵ AI ਪ੍ਰਤੀਕਿਰਿਆਵਾਂ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ AI Studio ਸੈਟਿੰਗਜ਼/ਸੀਕਰੇਟਸ ਪੈਨਲ ਵਿੱਚ GROQ_API_KEY ਜਾਂ GEMINI_API_KEY ਸੈੱਟ ਕਰੋ।)`
    : `\n\n(⚠️ Offline Demo Mode: To activate live AI responses, please configure your GROQ_API_KEY or GEMINI_API_KEY in the Secrets panel of your AI Studio workspace/published app!)`;

  return text + configMsg;
};

export const getFallbackVisionResponse = (language: string, role?: string): any => {
  const isHi = language === "Hindi";
  const isPb = language === "Punjabi";
  
  if (role === 'consumer') {
    if (isHi) {
      return {
        crop: "ताजा हरी सब्जियां (सिम्युलेटेड डेमो)",
        disease: "उत्कृष्ट ताजगी और गुणवत्ता",
        severity: "9/10",
        treatment: "इन ताजी सब्जियों में भरपूर मात्रा में विटामिन्स, आयरन और एंटीऑक्सिडेंट्स होते हैं जो इम्युनिटी बूस्ट करते हैं।",
        prevention: "उपयोग करने से पहले साफ पानी से अच्छी तरह धो लें। गीली सब्जियों को सुखाकर फ्रिज में रखें। (नोट: वास्तविक विश्लेषण के लिए कृपया सेटिंग्स में GROQ_API_KEY या GEMINI_API_KEY सेट करें!)"
      };
    } else if (isPb) {
      return {
        crop: "ਤਾਜ਼ੀਆਂ ਹਰੀਆਂ ਸਬਜ਼ੀਆਂ (ਸਿਮੂਲੇਟਡ ਡੈਮੋ)",
        disease: "ਸ਼ਾਨਦਾਰ ਤਾਜ਼ਗੀ ਅਤੇ ਗੁਣਵੱਤਾ",
        severity: "9/10",
        treatment: "ਇਹਨਾਂ ਤਾਜ਼ੀਆਂ ਸਬਜ਼ੀਆਂ ਵਿੱਚ ਭਰਪੂਰ ਮਾਤਰਾ ਵਿੱਚ ਵਿਟਾਮਿਨ, ਆਇਰਨ ਅਤੇ ਐਂਟੀਆਕਸੀਡੈਂਟ ਹੁੰਦੇ ਹਨ ਜੋ ਇਮਿਊਨਿਟੀ ਵਧਾਉਂਦੇ ਹਨ।",
        prevention: "ਵਰਤੋਂ ਤੋਂ ਪਹਿਲਾਂ ਸਾਫ਼ ਪਾਣੀ ਨਾਲ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ। (ਨੋਟ: ਅਸਲ ਵਿਸ਼ਲੇਸ਼ਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਸੈਟਿੰਗਜ਼ ਵਿੱਚ GROQ_API_KEY ਜਾਂ GEMINI_API_KEY ਸੈੱਟ ਕਰੋ!)"
      };
    } else {
      return {
        crop: "Fresh Green Vegetables (Simulated Demo)",
        disease: "Excellent Freshness & Quality",
        severity: "9/10",
        treatment: "These fresh green vegetables are packed with dietary fiber, essential vitamins A & C, iron, and rich antioxidants that boost immunity.",
        prevention: "Wash thoroughly under clean running water before cooking. Pat dry and store in a ventilated container. (Note: To enable active image analysis, please configure GROQ_API_KEY or GEMINI_API_KEY in your settings!)"
      };
    }
  } else {
    // Farmer
    if (isHi) {
      return {
        crop: "टमाटर / फसल पत्तियां (सिम्युलेटेड डेमो)",
        disease: "अगेती झुलसा रोग (Early Blight) का संदेह",
        severity: "मध्यम (Moderate)",
        treatment: "1. प्रभावित निचली पत्तियों को तुरंत हटा दें। 2. नीम का तेल या कॉपर ऑक्सीक्लोराइड का छिड़काव करें। 3. जैविक खाद का उपयोग बढ़ाएं।",
        prevention: "पौधों के बीच उचित दूरी रखें, ऊपर से पानी देने से बचें और फसल चक्र अपनाएं। (नोट: लाइव डायग्नोसिस सक्रिय करने के लिए कृपया सेटिंग्स में GROQ_API_KEY या GEMINI_API_KEY सेट करें!)"
      };
    } else if (isPb) {
      return {
        crop: "ਟਮਾਟਰ / ਫਸਲ ਦੇ ਪੱਤੇ (ਸਿਮੂਲੇਟਡ ਡੈਮੋ)",
        disease: "ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ (Early Blight) ਦਾ ਖਦਸ਼ਾ",
        severity: "ਦਰਮਿਆਨੀ (Moderate)",
        treatment: "1. ਪ੍ਰਭਾਵਿਤ ਹੇਠਲੇ ਪੱਤੇ ਤੁਰੰਤ ਹਟਾ ਦਿਓ। 2. ਨਿੰਮ ਦੇ ਤੇਲ ਜਾਂ ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।",
        prevention: "ਪੌਦਿਆਂ ਵਿਚਕਾਰ ਉਚਿਤ ਦੂਰੀ ਰੱਖੋ, ਉੱਪਰੋਂ ਪਾਣੀ ਦੇਣ ਤੋਂ ਬਚੋ। (ਨੋਟ: ਲਾਈਵ ਡਾਇਗਨੋਸਿਸ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਸੈਟਿੰਗਜ਼ ਵਿੱਚ GROQ_API_KEY ਜਾਂ GEMINI_API_KEY ਸੈੱਟ ਕਰੋ!)"
      };
    } else {
      return {
        crop: "Tomato / Crop Leaves (Simulated Demo)",
        disease: "Suspected Early Blight (Fungal Infection)",
        severity: "Moderate",
        treatment: "1. Prune and remove the affected lower leaves to stop fungal spore spread. 2. Apply a copper-based fungicide or Neem Oil spray (1500 PPM). 3. Avoid water accumulation around roots.",
        prevention: "Ensure proper spacing for air circulation, avoid overhead watering, and apply mulch to prevent soil splashing. (Note: To enable active crop diagnosis, please configure GROQ_API_KEY or GEMINI_API_KEY in your settings!)"
      };
    }
  }
};

export function getFallbackDistricts(state: string): string[] {
  const norm = (state || "").toLowerCase();
  if (norm.includes("punjab")) return ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur", "Gurdaspur", "Pathankot", "Moga", "Sangrur", "Firozpur", "Rupnagar", "Sahibzada Ajit Singh Nagar"];
  if (norm.includes("haryana")) return ["Gurugram", "Faridabad", "Karnal", "Ambala", "Hisar", "Rohtak", "Panipat", "Sonipat", "Sirsa", "Panchkula", "Kurukshetra", "Yamunanagar"];
  if (norm.includes("uttar pradesh")) return ["Lucknow", "Kanpur Nagar", "Varanasi", "Agra", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Gorakhpur", "Gautam Buddha Nagar", "Ghaziabad", "Mathura"];
  if (norm.includes("rajasthan")) return ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Sri Ganganagar", "Chittorgarh"];
  if (norm.includes("gujarat")) return ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Anand", "Mehsana", "Gandhinagar", "Bharuch", "Valsad"];
  if (norm.includes("maharashtra")) return ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli", "Satara"];
  if (norm.includes("madhya pradesh")) return ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"];
  if (norm.includes("bihar")) return ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Ara", "Begusarai", "Katihar", "Munger"];
  return ["Central District", "East District", "West District", "North District", "South District"];
}

export function getFallbackTehsils(state: string, district?: string): string[] {
  const distNorm = (district || "").toLowerCase();
  if (distNorm.includes("ludhiana")) return ["Ludhiana East", "Ludhiana West", "Khanna", "Jagraon", "Samrala", "Payal", "Raikot"];
  if (distNorm.includes("amritsar")) return ["Amritsar-I", "Amritsar-II", "Ajnala", "Baba Bakala"];
  if (distNorm.includes("gurugram")) return ["Gurugram", "Sohna", "Pataudi", "Farrukhnagar"];
  if (distNorm.includes("jaipur")) return ["Jaipur", "Sanganer", "Amer", "Chomu", "Phulera", "Kotputli"];
  if (distNorm.includes("lucknow")) return ["Lucknow", "Malihabad", "Bakshi Ka Talab", "Mohanlalganj"];

  const norm = (state || "").toLowerCase();
  if (norm.includes("punjab")) return ["Khanna", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Sangrur", "Pathankot", "Moga", "Abohar"];
  if (norm.includes("haryana")) return ["Karnal", "Ambala", "Hisar", "Rohtak", "Panipat", "Sonipat", "Gurugram", "Faridabad", "Sirsa", "Yamunanagar"];
  if (norm.includes("uttar pradesh")) return ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Gorakhpur", "Noida"];
  if (norm.includes("rajasthan")) return ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Sri Ganganagar"];
  
  return ["District Headquarters", "Tehsil Center", "City Center", "Rural Taluk", "Sub-District Central"];
}

export function getFallbackPincodes(state: string, city: string): string[] {
  const norm = (city || "").toLowerCase();
  if (norm.includes("khanna")) return ["141401", "141402"];
  if (norm.includes("ludhiana")) return ["141001", "141002", "141003", "141008"];
  if (norm.includes("amritsar")) return ["143001", "143002", "143006"];
  if (norm.includes("jalandhar")) return ["144001", "144002", "144003"];
  if (norm.includes("patiala")) return ["147001", "147002", "147004"];
  if (norm.includes("bathinda")) return ["151001", "151003", "151005"];
  return ["141401", "141001", "143001", "110001", "400001"];
}

export const STATES_OF_INDIA = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];
