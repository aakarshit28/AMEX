const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production');
const DB_PATH = isServerless ? path.join('/tmp', 'atlas.db') : path.join(__dirname, '../../atlas.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const DEFAULT_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traveler_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  traveler_name TEXT,
  employer TEXT,
  preferred_airline TEXT,
  preferred_hotel TEXT,
  dietary TEXT,
  seat_preference TEXT,
  cost_vs_delay INTEGER DEFAULT 85,
  loyalty_weight INTEGER DEFAULT 60,
  layover_tolerance INTEGER DEFAULT 75,
  hotel_comfort INTEGER DEFAULT 90,
  amex_card_number TEXT DEFAULT '3782 •••••• 81005',
  amex_card_tier TEXT DEFAULT 'Platinum Business',
  amex_member_since TEXT DEFAULT '2018',
  amex_verified INTEGER DEFAULT 1,
  amex_verification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amex_lounge_access TEXT DEFAULT 'Centurion Lounge & Delta Sky Club Priority',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS journeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  origin_city TEXT,
  origin_code TEXT,
  transit_city TEXT,
  transit_code TEXT,
  destination_city TEXT,
  destination_code TEXT,
  flight_leg1 TEXT,
  flight_leg2 TEXT,
  hotel_name TEXT,
  ground_transport TEXT,
  meeting_title TEXT,
  status TEXT DEFAULT 'Scheduled',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_type TEXT NOT NULL,
  step_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-style persistence (sql.js writes when we call export)
  let schema = DEFAULT_SCHEMA;
  if (fs.existsSync(SCHEMA_PATH)) {
    try { schema = fs.readFileSync(SCHEMA_PATH, 'utf8'); } catch {}
  }
  try {
    db.run(schema);
  } catch (e) {
    console.warn('[DB Schema Init Warning]:', e.message);
  }

  // Safe migrations for card verification columns
  const migrationCols = [
    { name: 'amex_card_number', type: "TEXT DEFAULT '3782 •••••• 81005'" },
    { name: 'amex_card_tier', type: "TEXT DEFAULT 'Platinum Business'" },
    { name: 'amex_member_since', type: "TEXT DEFAULT '2018'" },
    { name: 'amex_verified', type: 'INTEGER DEFAULT 1' },
    { name: 'amex_verification_date', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
    { name: 'amex_lounge_access', type: "TEXT DEFAULT 'Centurion Lounge & Delta Sky Club Priority'" }
  ];

  for (const col of migrationCols) {
    try {
      db.run(`ALTER TABLE traveler_profiles ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column already exists, ignore
    }
  }
  saveDb();

  console.log('[DB] sql.js database initialized at:', DB_PATH);
  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    // Ignore write errors on read-only environments
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// Wrapper that provides a better-sqlite3-like sync API
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return db;
}

function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function dbAll(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function dbExec(sql) {
  db.run(sql);
  saveDb();
}

// Mimic better-sqlite3 prepare interface for routes
function prepare(sql) {
  return {
    run: (...args) => {
      const params = args.flat();
      db.run(sql, params);
      let lastId = null;
      try {
        const res = db.exec('SELECT last_insert_rowid() as id');
        if (res && res[0] && res[0].values && res[0].values[0]) {
          lastId = res[0].values[0][0];
        }
      } catch (e) {}
      saveDb();
      return { lastInsertRowid: lastId };
    },
    get: (...args) => {
      const params = args.flat();
      return dbGet(sql, params);
    },
    all: (...args) => {
      const params = args.flat();
      return dbAll(sql, params);
    }
  };
}

module.exports = { initDb, getDb, saveDb, dbRun, dbGet, dbAll, dbExec, prepare };
