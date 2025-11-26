const express = require("express");
const cors = require("cors");
const app = express();
const mysql = require("mysql2");
const PORT = process.env.PORT || 3000;


// CORS pour localhost ET conteneurs
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:*',
    'http://backend' // Pour tests internes
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// --- MySQL connection with retry ---
let db;

function connectDB() {
  db = mysql.createConnection({
    host: "database",
    user: "tpuser",
    password: "tppass",
    database: "tpdb"
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ Database connection failed, retrying in 5s...");
      setTimeout(connectDB, 5000); // retry after 5s
    } else {
      console.log("✅ Connected to MySQL database!");
    }
  });

  db.on("error", (err) => {
    console.error("⚠️ DB Error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectDB(); // reconnect automatically
    }
  });
}

connectDB();
app.get("/db", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ status: "error", message: "DB not connected" });
    }
    res.json({ status: "ok", message: "DB connection OK" });
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Hello from Backend!",
    timestamp: new Date().toISOString(),
    client: req.get('Origin') || 'unknown',
    success: true
  });
});

app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(results);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend on port ${PORT}`);
});

