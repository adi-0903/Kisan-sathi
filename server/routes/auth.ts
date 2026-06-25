import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { appData } from "../../src/db/schema.js";
import { verifyPin } from "../utils/hash";

const router = Router();

router.post("/verify-pin", async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      return res.status(400).json({ error: "Phone number and PIN are required" });
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    const docId = `user_${cleanedPhone}`;
    const [row] = await db.select().from(appData).where(eq(appData.id, `users:${docId}`));
    
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    
    let userData;
    try {
      userData = JSON.parse(row.data);
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse user data" });
    }
    
    const isValid = await verifyPin(pin, userData.pin);
    
    if (isValid) {
      res.json({ success: true, user: userData });
    } else {
      res.status(401).json({ error: "Invalid PIN" });
    }
  } catch (err: any) {
     console.error("PIN verify error:", err);
     res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
