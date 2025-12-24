// database.js
// Unified DB wrapper: uses PostgreSQL when DATABASE_URL is set, otherwise SQLite (better-sqlite3).
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  // Postgres mode
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  client.connect().then(async () => {
    console.log('Connected to Postgres');
    await initPostgresSchema();
  }).catch((e) => {
    console.error('Error connecting to Postgres:', e.message);
    process.exit(1);
  });

  async function initPostgresSchema() {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS clientes (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          telefono TEXT,
          correo TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          nombre TEXT,
          role TEXT DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehiculos (
          id SERIAL PRIMARY KEY,
          cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
          marca TEXT,
          modelo TEXT,
          placas TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS ordenes (
          id SERIAL PRIMARY KEY,
          cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
          vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
          descripcion TEXT,
          imagenes TEXT,
          servicio TEXT,
          total NUMERIC DEFAULT 0,
          anticipo NUMERIC DEFAULT 0,
          saldo NUMERIC DEFAULT 0,
          status TEXT DEFAULT 'pendiente',
          fecha_cita TIMESTAMP,
          fecha_entrega TIMESTAMP,
          qr TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
       await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          accion TEXT,
          detalle TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Postgres schema initialized');
    } catch (e) {
      console.error('Error initializing Postgres schema:', e);
    }
  }

  function convertPlaceholders(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => "$" + (++i));
  }

  async function all(sql, params = []) {
    const q = convertPlaceholders(sql);
    const res = await client.query(q, params);
    return res.rows;
  }

  async function get(sql, params = []) {
    const q = convertPlaceholders(sql);
    const res = await client.query(q, params);
    return res.rows[0] || null;
  }

  async function run(sql, params = []) {
    const isInsert = /^\s*INSERT\s+/i.test(sql);
    let q = sql;
    if (isInsert && !/RETURNING\s+/i.test(sql)) {
      q = sql + ' RETURNING id';
      q = convertPlaceholders(q);
      const res = await client.query(q, params);
      return { lastInsertRowid: res.rows[0] ? res.rows[0].id : null };
    }
    q = convertPlaceholders(q);
    const res = await client.query(q, params);
    return res;
  }

  module.exports = { client, all, get, run };

} else {
  // SQLite mode
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, 'taller.db');
  const needInit = !fs.existsSync(dbPath);
  const db = new Database(dbPath);

  const all = (sql, params = []) => db.prepare(sql).all(params);
  const get = (sql, params = []) => db.prepare(sql).get(params);
  const run = (sql, params = []) => db.prepare(sql).run(params);

  if (needInit) {
    // initialize schema on first run
    db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  marca TEXT,
  modelo TEXT,
  placas TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  vehiculo_id INTEGER NOT NULL,
  descripcion TEXT,
  imagenes TEXT,
  servicio TEXT,
  total REAL DEFAULT 0,
  anticipo REAL DEFAULT 0,
  saldo REAL DEFAULT 0,
  fecha_cita TEXT,
  fecha_entrega TEXT,
  qr TEXT,
  status TEXT DEFAULT 'pendiente',
  prioridad TEXT DEFAULT 'normal',
  tecnico TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS costos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  concepto TEXT NOT NULL,
  costo REAL NOT NULL,
  tipo TEXT CHECK(tipo IN ('material','mano_obra','externo')) DEFAULT 'material',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accion TEXT NOT NULL,
  usuario TEXT DEFAULT 'sistema',
  detalle TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_veh_cliente ON vehiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orden_cliente ON ordenes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orden_estado ON ordenes(status);
CREATE INDEX IF NOT EXISTS idx_costos_orden ON costos(orden_id);
    `);

    console.log("🔥 Base de datos SQLite inicializada:", dbPath);
  }

  module.exports = { db, all, get, run };
}
