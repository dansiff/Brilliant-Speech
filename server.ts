import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import admin from "firebase-admin";
import bodyParser from "body-parser";
import fs from "fs";
import { teletherapyApiRouter } from "./src/components/teletherapy/apiStubs.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
let firebaseConfig: any;
try {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
} catch (e) {
  firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));
}

// Initialize Firebase Admin
// Note: In a real production environment, you'd use a service account key.
// Here we attempt to use the project ID from the config.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const firestore = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  let stripe: Stripe | null = null;
  const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required for this operation.");
    }
    if (!stripe) {
      stripe = new Stripe(key, {
        apiVersion: "2026-03-25.dahlia" as any,
      });
    }
    return stripe;
  };

  // Usage Gating Helper
  const checkAIUsage = async (userId: string, cost: number = 1) => {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // If user opted out on server side (just in case)
    if (userData?.isAiOptedOut) {
      throw new Error("AI analysis is disabled in settings.");
    }
    
    const usageRef = firestore.collection("usage").doc(userId);
    const usageDoc = await usageRef.get();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Limits
    // Free: 10 credits/day
    // Pro: 500 credits/day
    const dailyLimit = userData?.isPremium ? 500 : 10;
    
    let usageData = usageDoc.data();
    if (!usageData || usageData.date !== today) {
      usageData = { count: 0, date: today };
    }

    // First check daily limit
    if (usageData.count + cost > dailyLimit) {
      // If daily limit reached, check if they have "Purchased Credits"
      const purchasedCredits = userData?.aiCredits || 0;
      if (purchasedCredits < cost) {
        throw new Error(userData?.isPremium 
          ? "Daily Pro limit reached! Your purchased credits are also empty." 
          : "Daily limit reached. Upgrade to Pro or purchase credits for more!");
      }
      
      // Deduct from purchased credits
      await userRef.update({
        aiCredits: admin.firestore.FieldValue.increment(-cost)
      });
    } else {
      // Increment daily usage
      await usageRef.set({
        count: usageData.count + cost,
        date: today
      }, { merge: true });
    }
  };

  // Stripe Webhook handler (must be before express.json())
  app.post(
    "/api/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        if (!sig || !webhookSecret) {
          throw new Error("Missing stripe-signature or webhook secret");
        }
        const stripeInstance = getStripe();
        event = stripeInstance.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const purchaseType = session.metadata?.type;

          if (userId) {
            const updateData: any = {};
            
            if (purchaseType === "subscription") {
              updateData.isPremium = true;
              updateData.stripeCustomerId = session.customer;
              updateData.subscriptionStatus = "active";
            } else if (purchaseType === "autism_addon") {
              updateData.isAutismAddonActive = true;
            } else if (purchaseType === "credits_100") {
              updateData.aiCredits = admin.firestore.FieldValue.increment(100);
            } else if (purchaseType === "credits_1000") {
              updateData.aiCredits = admin.firestore.FieldValue.increment(1000);
            }

            try {
              await firestore.collection("users").doc(userId).update(updateData);
              console.log(`User ${userId} updated via Webhook (${purchaseType})`);
            } catch (error) {
              console.error(`Error updating user ${userId}:`, error);
            }
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          
          if (customerId) {
            const users = await firestore.collection("users").where("stripeCustomerId", "==", customerId).get();
            if (!users.empty) {
              await users.docs[0].ref.update({ subscriptionStatus: "active", isPremium: true });
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          if (customerId) {
            const users = await firestore.collection("users").where("stripeCustomerId", "==", customerId).get();
            if (!users.empty) {
              await users.docs[0].ref.update({ subscriptionStatus: "canceled", isPremium: false });
            }
          }
          break;
        }
      }

      res.json({ received: true });
    }
  );

  app.use(express.json());

// ------------------------------------------------------------
// Static asset handling (production)
// ------------------------------------------------------------
// Serve all files from the `public` directory (manifest, icons, .well-known)
const publicPath = path.resolve(__dirname, "public");
app.use(
  express.static(publicPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
      if (filePath.endsWith('manifest.json')) {
        res.setHeader('Content-Type', 'application/manifest+json');
      }
    },
    // Do not serve dotfiles (e.g., .env) by default
    dotfiles: 'ignore',
  })
);

// Serve Digital Asset Links under /.well-known without exposing other hidden files
app.use('/.well-known', express.static(path.join(publicPath, '.well-known'), {
  extensions: ['json'],
  index: false,
  // Explicitly set MIME type for assetlinks.json
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('assetlinks.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  },
}));

// 404 handler for unknown API routes (JSON response)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

  // Mount Secure Teletherapy Clinical Router
  app.use("/api/teletherapy", teletherapyApiRouter);

  // AI Proxy Middleware/Helper
  const callGemini = async (payload: any) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY missing");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: payload.contents,
        generationConfig: payload.generationConfig
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API Error: ${error}`);
    }

    return await response.json();
  };

  // AI Routes
  app.post("/api/ai/analyze-speech", async (req, res) => {
    const { userId, audioBase64, prompt } = req.body;
    if (!userId) return res.status(400).json({ error: "Unauthorized" });

    try {
      await checkAIUsage(userId, 1);
      const data = await callGemini({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: { responseMimeType: "application/json" }
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    const { userId, prompt, model, responseSchema, generationConfig } = req.body;
    if (!userId) return res.status(400).json({ error: "Unauthorized" });

    try {
      await checkAIUsage(userId, 5); // Stories/Images cost more
      const data = await callGemini({
        model: model || "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: generationConfig || { 
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/ai/tts", async (req, res) => {
    const { userId, text } = req.body;
    if (!userId) return res.status(400).json({ error: "Unauthorized" });

    try {
      await checkAIUsage(userId, 1);
      const data = await callGemini({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/ai/image", async (req, res) => {
    const { userId, prompt } = req.body;
    if (!userId) return res.status(400).json({ error: "Unauthorized" });

    try {
      await checkAIUsage(userId, 5);
      const data = await callGemini({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          imageConfig: {
            aspectRatio: "3:2",
          },
        },
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // API Route to create Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    const { userId, userEmail, type } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    try {
      const stripeInstance = getStripe();
      
      let line_items: any[] = [];
      let mode: any = "payment";

      if (type === "subscription") {
        mode = "subscription" as any;
        line_items = [{
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        }];
      } else if (type === "autism_addon") {
        mode = "payment" as any;
        line_items = [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Autism Support Add-on",
              description: "Specialized tools for neurodivergent learners including Visual Timers and Task Boards.",
            },
            unit_amount: 900, // $9.00
          },
          quantity: 1,
        }];
      } else if (type === "credits_100") {
        mode = "payment" as any;
        line_items = [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "100 AI Credits",
              description: "Practice with AI feedback (approximately 100 analysis sessions).",
            },
            unit_amount: 499, // $4.99
          },
          quantity: 1,
        }];
      } else if (type === "credits_1000") {
        mode = "payment" as any;
        line_items = [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "1,000 AI Credits",
              description: "Bulk AI credits for extensive practice.",
            },
            unit_amount: 3999, // $39.99
          },
          quantity: 1,
        }];
      } else {
        // Legacy fallback
        line_items = [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "Bilingual & Brilliant Pro",
              description: "Unlock all premium speech therapy tools and AI features.",
            },
            unit_amount: 999,
          },
          quantity: 1,
        }];
      }

      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode,
        success_url: `${process.env.APP_URL || "http://localhost:3000"}/?success=true`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/?canceled=true`,
        customer_email: userEmail,
        metadata: {
          userId: userId,
          type: type || "pro",
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
