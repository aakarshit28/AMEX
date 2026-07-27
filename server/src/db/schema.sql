CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traveler_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  traveler_name TEXT DEFAULT 'Amit Sharma',
  employer TEXT DEFAULT 'Delta Corp International',
  preferred_airline TEXT DEFAULT 'Emirates (Skywards Gold)',
  preferred_hotel TEXT DEFAULT 'Marriott (Bonvoy Elite)',
  dietary TEXT DEFAULT 'Vegetarian',
  seat_preference TEXT DEFAULT 'Window / Aisle (row ≤15)',
  amex_card TEXT DEFAULT 'Platinum Business',
  amex_card_number TEXT DEFAULT '3782 •••••• 81005',
  amex_card_tier TEXT DEFAULT 'Platinum Business',
  amex_member_since TEXT DEFAULT '2018',
  amex_verified INTEGER DEFAULT 1,
  amex_verification_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amex_lounge_access TEXT DEFAULT 'Centurion Lounge & Delta Sky Club Priority',
  cost_vs_delay INTEGER DEFAULT 85,
  loyalty_weight INTEGER DEFAULT 60,
  layover_tolerance INTEGER DEFAULT 75,
  hotel_comfort INTEGER DEFAULT 90,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  journey TEXT DEFAULT 'DEL → DXB → LHR',
  resolution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  origin_code TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  transit_code TEXT,
  transit_city TEXT,
  destination_code TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  flight_leg1 TEXT NOT NULL,
  flight_leg2 TEXT,
  hotel_name TEXT,
  ground_transport TEXT,
  meeting_title TEXT,
  status TEXT DEFAULT 'Scheduled',
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
