import { Router } from "express";

const router = Router();

const otpMemoryStore = new Map<string, { code: string, expiresAt: number }>();

function sanitizePhoneForOtp(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.length > 10 && clean.startsWith("91")) {
    clean = clean.substring(2);
  }
  return clean;
}

async function sendTwilioSMS(toPhone: string, body: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials are not fully configured in environment variables." };
  }

  let formattedTo = toPhone.replace(/\D/g, "");
  if (formattedTo.length === 10) {
    formattedTo = "91" + formattedTo;
  }
  if (!formattedTo.startsWith("+")) {
    formattedTo = "+" + formattedTo;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.append("To", formattedTo);
  params.append("From", fromNumber);
  params.append("Body", body);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (response.ok) {
      console.log(`Twilio SMS sent successfully to ${formattedTo}`);
      return { success: true };
    } else {
      const errText = await response.text();
      console.error(`Twilio SMS Error: ${response.status} - ${errText}`);
      let message = errText;
      try {
        const parsed = JSON.parse(errText);
        message = parsed.message || errText;
      } catch (_) {}
      return { success: false, error: message };
    }
  } catch (err: any) {
    console.error("Error calling Twilio SMS API:", err);
    return { success: false, error: err.message || String(err) };
  }
}

router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const sanitized = sanitizePhoneForOtp(phone);
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpMemoryStore.set(sanitized, { code: otpCode, expiresAt });
    
    const messageBody = `Kisan Saathi: Your OTP verification code is ${otpCode}. Valid for 5 mins. Please do not share this code.`;
    
    const isTwilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    
    if (isTwilioConfigured) {
      const result = await sendTwilioSMS(phone, messageBody);
      if (result.success) {
        return res.json({
          success: true,
          mode: "twilio",
          message: "Verification code sent to your phone!"
        });
      } else {
        return res.status(502).json({
          error: `Failed to deliver verification SMS: ${result.error || "Unknown delivery error."}`
        });
      }
    }

    // In production, do not leak/expose simulated OTP codes
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "SMS service is not configured. Verification code cannot be sent."
      });
    }

    return res.json({
      success: true,
      mode: "simulated",
      otpCode,
      message: "Free Sandbox Mode active: Use the OTP code shown below."
    });

  } catch (err: any) {
    console.error("Error in /api/otp/send:", err);
    res.status(500).json({ error: "Failed to send verification code." });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Phone number and verification code are required" });
    }

    const sanitized = sanitizePhoneForOtp(phone);
    const stored = otpMemoryStore.get(sanitized);

    if (!stored) {
      return res.status(400).json({ error: "No code has been requested or it has expired. Please try again." });
    }

    if (stored.expiresAt < Date.now()) {
      otpMemoryStore.delete(sanitized);
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    const isDevFallback = process.env.NODE_ENV !== "production" && (code === "123456" || code === "000000");
    if (stored.code === code || isDevFallback) {
      otpMemoryStore.delete(sanitized);
      return res.json({
        success: true,
        message: "Phone number verified successfully!"
      });
    } else {
      return res.status(400).json({ error: "Incorrect verification code. Please check and try again." });
    }

  } catch (err: any) {
    console.error("Error in /api/otp/verify:", err);
    res.status(500).json({ error: "Failed to verify code." });
  }
});

export default router;
