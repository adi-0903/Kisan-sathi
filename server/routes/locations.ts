import { Router } from "express";
import { dataLimiter } from "../middleware/rateLimiter";
import { getFallbackDistricts, getFallbackTehsils, getFallbackPincodes, STATES_OF_INDIA } from "../services/fallbacks";

const router = Router();

function toTitleCase(str: string): string {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

router.get("/states", dataLimiter, (req, res) => {
  res.json(STATES_OF_INDIA);
});

router.get("/districts", dataLimiter, async (req, res) => {
  const { state } = req.query;
  if (!state || typeof state !== "string") {
    return res.status(400).json({ error: "State parameter is required" });
  }
  try {
    const apiKey = process.env.DATAGOVIN_API_KEY;
    if (!apiKey) {
      return res.json(getFallbackDistricts(state));
    }
    const uppercaseState = state.toUpperCase();
    const url = `https://api.data.gov.in/resource/61766b26-1c17-47b3-81c5-0c84166fcd97?api-key=${apiKey}&format=json&filters[statename]=${encodeURIComponent(uppercaseState)}&limit=1000`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`data.gov.in returned status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.records && data.records.length > 0) {
      const districts = new Set<string>();
      data.records.forEach((r: any) => {
        if (r.districtname && r.districtname !== "NA" && r.districtname !== "Null") {
          districts.add(toTitleCase(r.districtname));
        }
      });
      return res.json(Array.from(districts).sort());
    }
    return res.json(getFallbackDistricts(state));
  } catch (err) {
    console.error("data.gov.in districts fetch failed, using fallback:", err);
    return res.json(getFallbackDistricts(state));
  }
});

router.get("/cities-tehsils", dataLimiter, async (req, res) => {
  const { state, district } = req.query;
  if (!state || typeof state !== "string") {
    return res.status(400).json({ error: "State parameter is required" });
  }
  try {
    const apiKey = process.env.DATAGOVIN_API_KEY;
    if (!apiKey) {
      return res.json(getFallbackTehsils(state, typeof district === "string" ? district : undefined));
    }
    const uppercaseState = state.toUpperCase();
    let url = `https://api.data.gov.in/resource/61766b26-1c17-47b3-81c5-0c84166fcd97?api-key=${apiKey}&format=json&filters[statename]=${encodeURIComponent(uppercaseState)}&limit=1000`;
    if (district && typeof district === "string") {
      url += `&filters[districtname]=${encodeURIComponent(district.toUpperCase())}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`data.gov.in returned status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.records && data.records.length > 0) {
      const tehsils = new Set<string>();
      data.records.forEach((r: any) => {
        const taluk = r.taluk || r.districtname;
        if (taluk && taluk !== "NA" && taluk !== "Null") {
          tehsils.add(toTitleCase(taluk));
        }
      });
      return res.json(Array.from(tehsils).sort());
    }
    return res.json(getFallbackTehsils(state, typeof district === "string" ? district : undefined));
  } catch (err) {
    console.error("data.gov.in tehsils fetch failed, using fallback:", err);
    return res.json(getFallbackTehsils(state, typeof district === "string" ? district : undefined));
  }
});

router.get("/pincodes", dataLimiter, async (req, res) => {
  const { state, district, city } = req.query;
  if (!state || !city || typeof state !== "string" || typeof city !== "string") {
    return res.status(400).json({ error: "State and city parameters are required" });
  }
  try {
    const apiKey = process.env.DATAGOVIN_API_KEY;
    if (!apiKey) {
      return res.json(getFallbackPincodes(state, city));
    }
    const uppercaseState = state.toUpperCase();
    const uppercaseCity = city.toUpperCase();
    let url = `https://api.data.gov.in/resource/61766b26-1c17-47b3-81c5-0c84166fcd97?api-key=${apiKey}&format=json&filters[statename]=${encodeURIComponent(uppercaseState)}&filters[taluk]=${encodeURIComponent(uppercaseCity)}&limit=200`;
    if (district && typeof district === "string") {
      url += `&filters[districtname]=${encodeURIComponent(district.toUpperCase())}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`data.gov.in returned status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.records && data.records.length > 0) {
      const pincodes = new Set<string>();
      data.records.forEach((r: any) => {
        if (r.pincode) {
          pincodes.add(r.pincode.toString());
        }
      });
      return res.json(Array.from(pincodes).sort());
    }
    return res.json(getFallbackPincodes(state, city));
  } catch (err) {
    console.error("data.gov.in pincodes fetch failed, using fallback:", err);
    return res.json(getFallbackPincodes(state, city));
  }
});

router.get("/lookup-pincode", dataLimiter, async (req, res) => {
  const { pincode } = req.query;
  if (!pincode || typeof pincode !== "string" || pincode.length !== 6) {
    return res.status(400).json({ error: "A valid 6-digit Pincode is required" });
  }
  try {
    const apiKey = process.env.DATAGOVIN_API_KEY;
    let dataGovinSuccess = false;
    let records: any[] = [];

    if (apiKey) {
      try {
        const url = `https://api.data.gov.in/resource/61766b26-1c17-47b3-81c5-0c84166fcd97?api-key=${apiKey}&format=json&filters[pincode]=${pincode}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && data.records && data.records.length > 0) {
            records = data.records.map((r: any) => ({
              state: toTitleCase(r.statename),
              district: toTitleCase(r.districtname),
              city: toTitleCase(r.taluk || r.districtname),
              village: toTitleCase(r.officename),
              pincode: r.pincode
            }));
            dataGovinSuccess = true;
          }
        }
      } catch (e) {
        console.warn("Failed to query data.gov.in for pincode lookup, trying postalpincode.in fallback", e);
      }
    }

    if (!dataGovinSuccess) {
      const url = `https://api.postalpincode.in/pincode/${pincode}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].PostOffice) {
          records = data[0].PostOffice.map((po: any) => ({
            state: po.State,
            district: po.District,
            city: po.Taluk && po.Taluk !== "NA" ? po.Taluk : po.District,
            village: po.Name,
            pincode: po.Pincode
          }));
        }
      }
    }

    res.json(records);
  } catch (error: any) {
    console.error("Pincode lookup error:", error);
    res.status(500).json({ error: "Failed to resolve pincode details" });
  }
});

export default router;
