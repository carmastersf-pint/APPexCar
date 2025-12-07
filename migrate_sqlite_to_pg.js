// migrate_sqlite_to_pg.js
// Script para migrar datos de SQLite (taller.db) a Postgres usando DATABASE_URL
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'taller.db');
if (!fs.existsSync(dbPath)) { console.error('taller.db no encontrado'); process.exit(1); }
const sqlite = new Database(dbPath);

const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pg.connect();

  // Creamos tablas en Postgres (esquema simplificado)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT,
      correo TEXT
    );
    CREATE TABLE IF NOT EXISTS vehiculos (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      marca TEXT,
      modelo TEXT,
      placas TEXT
    );
    CREATE TABLE IF NOT EXISTS ordenes (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      vehiculo_id INTEGER NOT NULL,
      descripcion TEXT,
      imagenes TEXT,
      servicio TEXT,
      total NUMERIC,
      anticipo NUMERIC,
      saldo NUMERIC,
      fecha_cita TEXT,
      fecha_entrega TEXT,
      qr TEXT,
      status TEXT DEFAULT 'pendiente',
      prioridad TEXT,
      tecnico TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS costos (
      id SERIAL PRIMARY KEY,
      orden_id INTEGER,
      concepto TEXT,
      costo NUMERIC,
      tipo TEXT
    );
  `);

  // Copiar clientes
  const sClientes = sqlite.prepare('SELECT * FROM clientes').all();
  for (const c of sClientes) {
    await pg.query('INSERT INTO clientes (id,nombre,telefono,correo) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', [c.id, c.nombre, c.telefono, c.correo]);
  }

  // Copiar vehiculos
  const sVeh = sqlite.prepare('SELECT * FROM vehiculos').all();
  for (const v of sVeh) {
    await pg.query('INSERT INTO vehiculos (id,cliente_id,marca,modelo,placas) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [v.id, v.cliente_id, v.marca, v.modelo, v.placas]);
  }

  // Copiar ordenes
  const sOrd = sqlite.prepare('SELECT * FROM ordenes').all();
  for (const o of sOrd) {
    await pg.query(
      `INSERT INTO ordenes (id,cliente_id,vehiculo_id,descripcion,imagenes,servicio,total,anticipo,saldo,fecha_cita,fecha_entrega,qr,status,prioridad,tecnico,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT DO NOTHING`,
      [o.id,o.cliente_id,o.vehiculo_id,o.descripcion,o.imagenes,o.servicio,o.total,o.anticipo,o.saldo,o.fecha_cita,o.fecha_entrega,o.qr,o.status,o.prioridad,o.tecnico,o.created_at]
    );
  }

  // Copiar costos
  try {
    const sCost = sqlite.prepare('SELECT * FROM costos').all();
    for (const c of sCost) {
      await pg.query('INSERT INTO costos (id,orden_id,concepto,costo,tipo) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [c.id,c.orden_id,c.concepto,c.costo,c.tipo]);
    }
  } catch (e) { /* tabla costos puede no existir */ }

  console.log('Migración completada');
  await pg.end();
}

run().catch(err => { console.error(err); process.exit(1); });
