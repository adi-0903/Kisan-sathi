






import { Router } from "express";
import { eq, and, like, or } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { appData, productsTable, ordersTable } from "../../src/db/schema.js";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all DB routes
router.use(requireAuth);

router.get("/list", async (req, res) => {
  try {
    const { collection } = req.query;
    const sessionUid = req.headers['x-session-uid'] as string;

    if (!collection || typeof collection !== "string") {
      return res.status(400).json({ error: "Collection name required" });
    }

    if (collection === "products") {
      const rows = await db.select().from(productsTable);
      return res.json(rows);
    }

    if (collection === "orders") {
      // Users should only see orders they placed or supplied
      const rows = await db.select().from(ordersTable).where(
        or(
          eq(ordersTable.buyerId, sessionUid),
          eq(ordersTable.supplierId, sessionUid)
        )
      );
      return res.json(rows);
    }

    // Users should only see their own sync_state items
    let rows;
    if (collection === "sync_state") {
      rows = await db.select().from(appData).where(
        and(
          eq(appData.collection, collection),
          like(appData.docId, `${sessionUid}_%`)
        )
      );
    } else {
      rows = await db.select().from(appData).where(eq(appData.collection, collection));
    }

    const items = rows.map(r => {
      try {
        const parsed = JSON.parse(r.data);
        // Strip out plaintext PIN from other users' profiles
        if (collection === "users" && r.docId !== sessionUid) {
          delete parsed.pin;
        }
        return { ...parsed, id: r.docId, uid: r.docId };
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

router.get("/aggregate", async (req, res) => {
  try {
    const { keySuffix } = req.query;
    if (!keySuffix || typeof keySuffix !== "string") {
      return res.status(400).json({ error: "keySuffix required" });
    }

    const rows = await db.select().from(appData).where(
      and(
        eq(appData.collection, "sync_state"),
        like(appData.docId, `%${keySuffix}`)
      )
    );

    let allItems: any[] = [];
    rows.forEach(r => {
      try {
        const parsed = JSON.parse(r.data);
        const dataArr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.value) ? parsed.value : null);
        if (dataArr) {
          const farmerId = r.docId.replace(keySuffix, '').replace(/_$/, '');
          const enriched = dataArr.map((p: any) => ({ ...p, _farmerId: farmerId }));
          allItems = allItems.concat(enriched);
        }
      } catch (_) {}
    });

    res.json(allItems);
  } catch (err: any) {
    console.error("Error in /api/db/aggregate:", err);
    res.status(500).json({ error: err.message || "Database aggregation failed" });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { collection, docId } = req.query;
    const sessionUid = req.headers['x-session-uid'] as string;

    if (!collection || typeof collection !== "string" || !docId || typeof docId !== "string") {
      return res.status(400).json({ error: "Collection and docId required" });
    }

    if (collection === "products") {
      const [row] = await db.select().from(productsTable).where(eq(productsTable.id, docId));
      if (!row) return res.status(404).json({ error: "Document not found" });
      return res.json(row);
    }

    if (collection === "orders") {
      const [row] = await db.select().from(ordersTable).where(eq(ordersTable.id, docId));
      if (!row) return res.status(404).json({ error: "Document not found" });
      // Enforce order ownership (must be buyer or supplier)
      if (row.buyerId !== sessionUid && row.supplierId !== sessionUid) {
        return res.status(403).json({ error: "Forbidden: Cannot access other users' orders" });
      }
      return res.json(row);
    }

    const [row] = await db.select().from(appData).where(eq(appData.id, `${collection}:${docId}`));
    if (!row) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Enforce sync_state ownership
    if (collection === "sync_state" && !docId.startsWith(`${sessionUid}_`)) {
      return res.status(403).json({ error: "Forbidden: Cannot access other users' sync state" });
    }

    try {
      const parsed = JSON.parse(row.data);
      // Strip plaintext PIN if this profile belongs to another user
      if (collection === "users" && docId !== sessionUid) {
        delete parsed.pin;
      }
      res.json({ ...parsed, id: row.docId, uid: row.docId });
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

    if (collection === "products") {
      await db.insert(productsTable).values({
        id: docId,
        supplierId: data.supplierId,
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        quantity: data.quantity,
        isAgriInput: data.isAgriInput,
        status: data.status,
        image: data.image,
        description: data.description,
        farmerName: data.farmerName,
        certified: data.certified,
        createdAt: data.createdAt || now,
        updatedAt: now
      }).onConflictDoUpdate({
        target: productsTable.id,
        set: {
          supplierId: data.supplierId,
          name: data.name,
          category: data.category,
          price: data.price,
          unit: data.unit,
          quantity: data.quantity,
          isAgriInput: data.isAgriInput,
          status: data.status,
          image: data.image,
          description: data.description,
          farmerName: data.farmerName,
          certified: data.certified,
          updatedAt: now
        }
      });
      return res.json({ success: true });
    }

    if (collection === "orders") {
      await db.insert(ordersTable).values({
        id: docId,
        buyerId: data.buyerId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        deliveryAddress: data.deliveryAddress,
        supplierId: data.supplierId,
        totalAmount: data.totalAmount,
        isGroupBuy: data.isGroupBuy,
        societyCode: data.societyCode,
        status: data.status,
        paymentStatus: data.paymentStatus,
        isAgriInput: data.isAgriInput,
        items: data.items || [],
        createdAt: data.createdAt || now,
        updatedAt: now
      }).onConflictDoUpdate({
        target: ordersTable.id,
        set: {
          buyerName: data.buyerName,
          buyerPhone: data.buyerPhone,
          deliveryAddress: data.deliveryAddress,
          supplierId: data.supplierId,
          totalAmount: data.totalAmount,
          isGroupBuy: data.isGroupBuy,
          societyCode: data.societyCode,
          status: data.status,
          paymentStatus: data.paymentStatus,
          isAgriInput: data.isAgriInput,
          items: data.items || [],
          updatedAt: now
        }
      });
      return res.json({ success: true });
    }

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

    if (collection === "products") {
      await db.insert(productsTable).values({
        id: docId,
        supplierId: data.supplierId,
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        quantity: data.quantity,
        isAgriInput: data.isAgriInput,
        status: data.status,
        image: data.image,
        description: data.description,
        farmerName: data.farmerName,
        certified: data.certified,
        createdAt: docData.createdAt,
        updatedAt: now
      });
      return res.json({ success: true, id: docId });
    }

    if (collection === "orders") {
      await db.insert(ordersTable).values({
        id: docId,
        buyerId: data.buyerId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        deliveryAddress: data.deliveryAddress,
        supplierId: data.supplierId,
        totalAmount: data.totalAmount,
        isGroupBuy: data.isGroupBuy,
        societyCode: data.societyCode,
        status: data.status,
        paymentStatus: data.paymentStatus,
        isAgriInput: data.isAgriInput,
        items: data.items || [],
        createdAt: docData.createdAt,
        updatedAt: now
      });
      return res.json({ success: true, id: docId });
    }

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

    const now = new Date().toISOString();

    if (collection === "products") {
      const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, docId));
      if (!existing) return res.status(404).json({ error: "Not found" });

      const merged = { ...existing, ...data };
      await db.update(productsTable).set({
        supplierId: merged.supplierId,
        name: merged.name,
        category: merged.category,
        price: merged.price,
        unit: merged.unit,
        quantity: merged.quantity,
        isAgriInput: merged.isAgriInput,
        status: merged.status,
        image: merged.image,
        description: merged.description,
        farmerName: merged.farmerName,
        certified: merged.certified,
        updatedAt: now
      }).where(eq(productsTable.id, docId));
      return res.json({ success: true });
    }

    if (collection === "orders") {
      const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, docId));
      if (!existing) return res.status(404).json({ error: "Not found" });

      const merged = { ...existing, ...data };
      await db.update(ordersTable).set({
        buyerName: merged.buyerName,
        buyerPhone: merged.buyerPhone,
        deliveryAddress: merged.deliveryAddress,
        supplierId: merged.supplierId,
        totalAmount: merged.totalAmount,
        isGroupBuy: merged.isGroupBuy,
        societyCode: merged.societyCode,
        status: merged.status,
        paymentStatus: merged.paymentStatus,
        isAgriInput: merged.isAgriInput,
        items: merged.items,
        updatedAt: now
      }).where(eq(ordersTable.id, docId));
      return res.json({ success: true });
    }

    const [existing] = await db.select().from(appData).where(eq(appData.id, `${collection}:${docId}`));
    let mergedData = { ...data };
    if (existing) {
      try {
        mergedData = { ...JSON.parse(existing.data), ...data };
      } catch (_) {}
    }

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

    if (collection === "products") {
      await db.delete(productsTable).where(eq(productsTable.id, docId));
      return res.json({ success: true });
    }

    if (collection === "orders") {
      await db.delete(ordersTable).where(eq(ordersTable.id, docId));
      return res.json({ success: true });
    }

    await db.delete(appData).where(and(eq(appData.collection, collection), eq(appData.docId, docId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/db/delete:", err);
    res.status(500).json({ error: err.message || "Database delete failed" });
  }
});

export default router;
