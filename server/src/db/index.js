const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../atlas.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;
let SQL = null;

async function initDb() {
  SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-style persistence (sql.js writes when we call export)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.run(schema);

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
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
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
