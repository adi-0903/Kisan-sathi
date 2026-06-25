import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { appData } from "../../src/db/schema.js";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all DB routes
router.use(requireAuth);

router.get("/list", async (req, res) => {
  try {
    const { collection } = req.query;
    if (!collection || typeof collection !== "string") {
      return res.status(400).json({ error: "Collection name required" });
    }

    const rows = await db.select().from(appData).where(eq(appData.collection, collection));
    const items = rows.map(r => {
      try {
        return { ...JSON.parse(r.data), id: r.docId, uid: r.docId };
      } catch (_) {
        return null;
      }
    }).filter(Boolean);

    res.json(items);
  } catch (err: any) {
    console.error("Error in /api/db/list:", err);
    res.status(500).json({ error: err.message || "Database query failed" });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { collection, docId } = req.query;
    if (!collection || typeof collection !== "string" || !docId || typeof docId !== "string") {
      return res.status(400).json({ error: "Collection and docId required" });
    }

    const [row] = await db.select().from(appData).where(eq(appData.id, `${collection}:${docId}`));
    if (!row) {
      return res.status(404).json({ error: "Document not found" });
    }

    try {
      res.json({ ...JSON.parse(row.data), id: row.docId, uid: row.docId });
    } catch (_) {
      res.status(500).json({ error: "Failed to parse document data" });
    }
  } catch (err: any) {
    console.error("Error in /api/db/get:", err);
    res.status(500).json({ error: err.message || "Database query failed" });
  }
});

router.post("/set", async (req, res) => {
  try {
    const { collection, docId, data } = req.body;
    if (!collection || !docId || !data) {
      return res.status(400).json({ error: "Collection, docId and data are required" });
    }

    const now = new Date().toISOString();
    await db.insert(appData).values({
      id: `${collection}:${docId}`,
      collection,
      docId,
      data: JSON.stringify(data),
      createdAt: data.createdAt || now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: appData.id,
      set: {
        data: JSON.stringify(data),
        updatedAt: now
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/db/set:", err);
    res.status(500).json({ error: err.message || "Database write failed" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { collection, data } = req.body;
    if (!collection || !data) {
      return res.status(400).json({ error: "Collection and data are required" });
    }

    const docId = data.id || Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const docData = { ...data, id: docId, uid: docId, createdAt: data.createdAt || now };

    await db.insert(appData).values({
      id: `${collection}:${docId}`,
      collection,
      docId,
      data: JSON.stringify(docData),
      createdAt: docData.createdAt,
      updatedAt: now
    });

    res.json({ success: true, id: docId });
  } catch (err: any) {
    console.error("Error in /api/db/add:", err);
    res.status(500).json({ error: err.message || "Database write failed" });
  }
});

router.post("/update", async (req, res) => {
  try {
    const { collection, docId, data } = req.body;
    if (!collection || !docId || !data) {
      return res.status(400).json({ error: "Collection, docId and data are required" });
    }

    const [existing] = await db.select().from(appData).where(eq(appData.id, `${collection}:${docId}`));
    let mergedData = { ...data };
    if (existing) {
      try {
        mergedData = { ...JSON.parse(existing.data), ...data };
      } catch (_) {}
    }

    const now = new Date().toISOString();
    await db.insert(appData).values({
      id: `${collection}:${docId}`,
      collection,
      docId,
      data: JSON.stringify(mergedData),
      createdAt: mergedData.createdAt || now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: appData.id,
      set: {
        data: JSON.stringify(mergedData),
        updatedAt: now
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/db/update:", err);
    res.status(500).json({ error: err.message || "Database write failed" });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const { collection, docId } = req.body;
    if (!collection || !docId) {
      return res.status(400).json({ error: "Collection and docId are required" });
    }

    await db.delete(appData).where(and(eq(appData.collection, collection), eq(appData.docId, docId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/db/delete:", err);
    res.status(500).json({ error: err.message || "Database delete failed" });
  }
});

export default router;
