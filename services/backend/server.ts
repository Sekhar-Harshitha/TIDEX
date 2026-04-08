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
const databaseUrl = (process.env.DATABASE_URL || "").trim();
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:19006"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Backend startup aborted to prevent mock/fallback mode.",
  );
}

const useSsl = !/localhost|127\.0\.0\.1/i.test(databaseUrl);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "50mb" }));

const parseRole = (role: string | undefined): string => {
  if (!role) return "Citizen";
  const normalized = role.toLowerCase();
  if (normalized === "admin") return "Admin";
  if (
    normalized === "electrical officer" ||
    normalized === "electrical_officer"
  ) {
    return "Electrical Officer";
  }
  return "Citizen";
};

const parseReportStatus = (status: string | undefined): string => {
  if (!status) return "Pending";
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "Verified";
  if (normalized === "suspicious") return "Suspicious";
  if (normalized === "fake") return "Fake";
  if (normalized === "action taken" || normalized === "action_taken") {
    return "Action Taken";
  }
  return "Pending";
};

const normalizeUser = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: parseRole(row.role),
  strikes: row.strikes || 0,
  isBanned: (row.strikes || 0) >= 3,
  profile_image_url: row.profile_image_url,
  created_at: row.created_at,
  last_login: row.last_login,
});

const normalizeReport = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name || "Unknown User",
  category: row.category,
  description: row.description,
  location: {
    latitude: Number(row.lat ?? 0),
    longitude: Number(row.lng ?? 0),
  },
  timestamp: new Date(row.timestamp).getTime(),
  status: parseReportStatus(row.status),
  mediaUrl: row.media_url,
  aiConfidence: row.ai_confidence,
  aiReasoning: row.ai_reasoning,
  priorityScore: row.priority_score,
  priorityLevel: row.priority_level,
});

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

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", mode: "database" });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ status: "error", mode: "database" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role, strikes, profile_image_url, created_at, last_login",
      [name, email, hashedPassword, phone],
    );

    const user = normalizeUser(result.rows[0]);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user, token });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ user: normalizeUser(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/profile", authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, strikes, profile_image_url, last_login, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(normalizeUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/profile", authenticateToken, async (req: any, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone, role, strikes, profile_image_url, created_at, last_login",
      [name, email, phone, req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(normalizeUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/profile/role", authenticateToken, async (req: any, res) => {
  const { role } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, phone, role, strikes, profile_image_url, created_at, last_login",
      [parseRole(role), req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(normalizeUser(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/upload-photo", authenticateToken, async (req: any, res) => {
  const { photoBase64 } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET profile_image_url = $1 WHERE id = $2 RETURNING profile_image_url",
      [photoBase64, req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile_image_url = result.rows[0].profile_image_url;
    res.json({ profile_image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/change-password", authenticateToken, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(401).json({ error: "Incorrect old password" });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedNewPassword,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/otp/send", authenticateToken, async (req: any, res) => {
  const { type, value } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await pool.query(
      "INSERT INTO otp_verifications (user_id, type, value, code, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, type, value, code, expiresAt],
    );
    console.log(`OTP for ${type} (${value}): ${code}`);
    res.json({ success: true, message: `OTP sent to ${value}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/otp/verify", authenticateToken, async (req: any, res) => {
  const { type, value, code } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM otp_verifications WHERE user_id = $1 AND type = $2 AND value = $3 AND code = $4 AND expires_at > NOW() AND verified = FALSE",
      [req.user.id, type, value, code],
    );

    const verified = result.rows.length > 0;
    if (verified) {
      await pool.query(
        "UPDATE otp_verifications SET verified = TRUE WHERE id = $1",
        [result.rows[0].id],
      );
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

app.get("/api/users", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, strikes, profile_image_url, created_at, last_login FROM users ORDER BY created_at DESC",
    );
    res.json(result.rows.map(normalizeUser));
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.patch("/api/users/:id/strikes", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { delta } = req.body;

  try {
    const increment = Number(delta || 1);
    const result = await pool.query(
      "UPDATE users SET strikes = GREATEST(0, strikes + $1) WHERE id = $2 RETURNING id, name, email, phone, role, strikes, profile_image_url, created_at, last_login",
      [increment, id],
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(normalizeUser(result.rows[0]));
  } catch (err) {
    console.error("Failed to update strikes:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/reports", authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reports r
       LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.timestamp DESC`,
    );
    res.json(result.rows.map(normalizeReport));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/reports", authenticateToken, async (req: any, res) => {
  const { category, description, location, mediaUrl, status, aiReasoning } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO reports (user_id, category, description, lat, lng, media_url, status, ai_reasoning)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        category,
        description,
        location?.latitude ?? null,
        location?.longitude ?? null,
        mediaUrl ?? null,
        status ?? "Pending",
        aiReasoning ?? null,
      ],
    );

    const reportRow = result.rows[0];
    const userResult = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [req.user.id],
    );
    reportRow.user_name = userResult.rows[0]?.name || "Unknown User";

    res.status(201).json(normalizeReport(reportRow));
  } catch (err) {
    console.error("Failed to create report:", err);
    res.status(500).json({ error: "Failed to create report" });
  }
});

app.post("/api/sos", async (req, res) => {
  const { id, userId, latitude, longitude, timestamp, source } = req.body ?? {};

  if (
    !id ||
    !userId ||
    latitude === undefined ||
    longitude === undefined ||
    !timestamp
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: id, userId, latitude, longitude, timestamp",
    });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const ts = Number(timestamp);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(ts)) {
    return res
      .status(400)
      .json({ error: "Invalid latitude/longitude/timestamp" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sos_messages (message_id, user_id, lat, lng, ts, source)
       VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6)
       ON CONFLICT (message_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING id, message_id AS "messageId", user_id AS "userId", lat AS latitude, lng AS longitude, EXTRACT(EPOCH FROM ts) * 1000 AS timestamp, source, received_at AS "receivedAt"`,
      [id, userId, lat, lng, ts, source || "bluetooth-mesh"],
    );

    return res.status(201).json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to ingest SOS message" });
  }
});

app.get("/api/sos/recent", async (req: any, res) => {
  const rawLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 20;

  try {
    const result = await pool.query(
      `SELECT message_id AS "messageId", user_id AS "userId", lat AS latitude, lng AS longitude,
              EXTRACT(EPOCH FROM ts) * 1000 AS timestamp, source, received_at AS "receivedAt"
       FROM sos_messages
       ORDER BY received_at DESC
       LIMIT $1`,
      [limit],
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch SOS messages" });
  }
});

app.use((err: any, req: any, res: any, _next: any) => {
  console.error(`[ERR] ${req.method} ${req.originalUrl}`, err);
  const message = err?.message || "Internal server error";
  res.status(500).json({ error: message });
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'Citizen',
        strikes INTEGER DEFAULT 0,
        profile_image_url TEXT,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        category TEXT NOT NULL,
        description TEXT,
        lat DOUBLE PRECISION,
        lng DOUBLE PRECISION,
        media_url TEXT,
        status TEXT DEFAULT 'Pending',
        ai_confidence DOUBLE PRECISION,
        ai_reasoning TEXT,
        priority_score DOUBLE PRECISION,
        priority_level TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    console.log("Database verified and tables initialized.");

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Backend API running on http://localhost:${port}`);
    });

    server.on("error", (err) => {
      console.error("Server failed to start:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Backend startup failed:", err);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

startServer();
