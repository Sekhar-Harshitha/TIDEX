import express from "express";
import cors from "cors";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "tidex-super-secret-key";
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:19006"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "50mb" }));

// Database Connection
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

// In-memory fallback for demo purposes if DB is not available
const mockDb = {
  users: [] as any[],
  reports: [] as any[],
  otps: [] as any[],
  sosMessages: [] as any[],
};

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: Date.now(),
    db: !!pool ? 'postgres' : 'memory'
  });
});

// 1. Auth: Sign Up
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (pool) {
      const result = await pool.query(
        "INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, phone",
        [name, email, hashedPassword, phone],
      );
      user = result.rows[0];
    } else {
      user = {
        id: `u-${Date.now()}`,
        name,
        email,
        password: hashedPassword,
        phone,
        role: "CITIZEN",
        strikes: 0,
      };
      mockDb.users.push(user);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user, token });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user;
    if (pool) {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      user = result.rows[0];
    } else {
      user = mockDb.users.find((u) => u.email === email);
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_image_url: user.profile_image_url,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Profile: Get Profile
app.get("/api/profile", authenticateToken, async (req: any, res) => {
  try {
    let user;
    if (pool) {
      const result = await pool.query(
        "SELECT id, name, email, phone, role, strikes, profile_image_url, last_login, created_at FROM users WHERE id = $1",
        [req.user.id],
      );
      user = result.rows[0];
    } else {
      user = mockDb.users.find((u) => u.id === req.user.id);
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 4. Profile: Update Profile
app.put("/api/profile", authenticateToken, async (req: any, res) => {
  const { name, email, phone } = req.body;
  try {
    let user;
    if (pool) {
      const result = await pool.query(
        "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone",
        [name, email, phone, req.user.id],
      );
      user = result.rows[0];
    } else {
      const idx = mockDb.users.findIndex((u) => u.id === req.user.id);
      if (idx !== -1) {
        mockDb.users[idx] = { ...mockDb.users[idx], name, email, phone };
        user = mockDb.users[idx];
      }
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 4.1 Profile: Update Role
app.put("/api/profile/role", authenticateToken, async (req: any, res) => {
  const { role } = req.body;
  try {
    let user;
    if (pool) {
      const result = await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, req.user.id],
      );
      user = result.rows[0];
    } else {
      const idx = mockDb.users.findIndex((u) => u.id === req.user.id);
      if (idx !== -1) {
        mockDb.users[idx].role = role;
        user = mockDb.users[idx];
      }
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Profile: Upload Photo (Base64)
app.post("/api/upload-photo", authenticateToken, async (req: any, res) => {
  const { photoBase64 } = req.body;
  try {
    let profile_image_url;
    if (pool) {
      const result = await pool.query(
        "UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING profile_image_url",
        [photoBase64, req.user.id],
      );
      profile_image_url = result.rows[0].profile_image_url;
    } else {
      const idx = mockDb.users.findIndex((u) => u.id === req.user.id);
      if (idx !== -1) {
        mockDb.users[idx].profile_image_url = photoBase64;
        profile_image_url = photoBase64;
      }
    }
    res.json({ profile_image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 6. Profile: Change Password
app.post("/api/change-password", authenticateToken, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    let user;
    if (pool) {
      const result = await pool.query(
        "SELECT password FROM users WHERE id = $1",
        [req.user.id],
      );
      user = result.rows[0];
    } else {
      user = mockDb.users.find((u) => u.id === req.user.id);
    }

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ error: "Incorrect old password" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    if (pool) {
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
        hashedNewPassword,
        req.user.id,
      ]);
    } else {
      const idx = mockDb.users.findIndex((u) => u.id === req.user.id);
      if (idx !== -1) mockDb.users[idx].password = hashedNewPassword;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 7. OTP Simulation
app.post("/api/otp/send", authenticateToken, async (req: any, res) => {
  const { type, value } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  try {
    if (pool) {
      await pool.query(
        "INSERT INTO otp_verifications (user_id, type, value, code, expires_at) VALUES ($1, $2, $3, $4, $5)",
        [req.user.id, type, value, code, expiresAt],
      );
    } else {
      mockDb.otps.push({
        user_id: req.user.id,
        type,
        value,
        code,
        expires_at: expiresAt,
        verified: false,
      });
    }
    console.log(`OTP for ${type} (${value}): ${code}`); // Log for simulation
    res.json({ success: true, message: `OTP sent to ${value}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/otp/verify", authenticateToken, async (req: any, res) => {
  const { type, value, code } = req.body;
  try {
    let verified = false;
    if (pool) {
      const result = await pool.query(
        "SELECT * FROM otp_verifications WHERE user_id = $1 AND type = $2 AND value = $3 AND code = $4 AND expires_at > NOW() AND verified = FALSE",
        [req.user.id, type, value, code],
      );
      if (result.rows.length > 0) {
        await pool.query(
          "UPDATE otp_verifications SET verified = TRUE WHERE id = $1",
          [result.rows[0].id],
        );
        verified = true;
      }
    } else {
      const otp = mockDb.otps.find(
        (o) =>
          o.user_id === req.user.id &&
          o.type === type &&
          o.value === value &&
          o.code === code &&
          o.expires_at > new Date() &&
          !o.verified,
      );
      if (otp) {
        otp.verified = true;
        verified = true;
      }
    }

    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Existing Reports Logic ---
app.get("/api/reports", async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query(
        "SELECT * FROM reports ORDER BY timestamp DESC",
      );
      res.json(result.rows);
    } else {
      res.json(mockDb.reports);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- SOS Mesh Ingestion ---
app.post('/api/sos', async (req, res) => {
  const { id, userId, latitude, longitude, timestamp, source } = req.body ?? {};

  if (!id || !userId || latitude === undefined || longitude === undefined || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields: id, userId, latitude, longitude, timestamp' });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const ts = Number(timestamp);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(ts)) {
    return res.status(400).json({ error: 'Invalid latitude/longitude/timestamp' });
  }

  try {
    if (pool) {
      const result = await pool.query(
        `INSERT INTO sos_messages (message_id, user_id, lat, lng, ts, source)
         VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6)
         ON CONFLICT (message_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING id, message_id AS "messageId", user_id AS "userId", lat AS latitude, lng AS longitude, EXTRACT(EPOCH FROM ts) * 1000 AS timestamp, source, received_at AS "receivedAt"`,
        [id, userId, lat, lng, ts, source || 'bluetooth-mesh']
      );

      return res.status(201).json({ success: true, record: result.rows[0] });
    }

    const existing = mockDb.sosMessages.find((m) => m.messageId === id);
    if (!existing) {
      mockDb.sosMessages.push({
        id: `sos-${Date.now()}`,
        messageId: id,
        userId,
        latitude: lat,
        longitude: lng,
        timestamp: ts,
        source: source || 'bluetooth-mesh',
        receivedAt: Date.now()
      });
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to ingest SOS message' });
  }
});

app.get('/api/sos/recent', async (req, res) => {
  const rawLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

  try {
    if (pool) {
      const result = await pool.query(
        `SELECT message_id AS "messageId", user_id AS "userId", lat AS latitude, lng AS longitude,
                EXTRACT(EPOCH FROM ts) * 1000 AS timestamp, source, received_at AS "receivedAt"
         FROM sos_messages
         ORDER BY received_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.json(result.rows);
    }

    return res.json(
      [...mockDb.sosMessages]
        .sort((a, b) => b.receivedAt - a.receivedAt)
        .slice(0, limit)
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch SOS messages' });
  }
});

async function startServer() {
  // Initialize Database Tables if Pool exists
  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'CITIZEN',
            strikes INTEGER DEFAULT 0,
            profile_image_url TEXT,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            verified BOOLEAN DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          category TEXT NOT NULL,
          description TEXT,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          media_url TEXT,
          status TEXT DEFAULT 'PENDING',
          ai_confidence DOUBLE PRECISION,
          ai_reasoning TEXT,
          priority_score DOUBLE PRECISION,
          priority_level TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sos_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          ts TIMESTAMP WITH TIME ZONE NOT NULL,
          source TEXT DEFAULT 'bluetooth-mesh',
          received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("Database tables initialized.");
    } catch (err) {
      console.error("Failed to initialize database tables:", err);
    }
  } else {
    console.warn(
      "DATABASE_URL is not set. Running in mock data mode for demo.",
    );
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend API running on http://localhost:${port}`);
  });
}

startServer();
