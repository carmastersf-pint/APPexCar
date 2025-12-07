// database_pg.js - wrapper para Postgres (usa DATABASE_URL si está presente)
const { Client } = require('pg');
const { all: sqliteAll, get: sqliteGet, run: sqliteRun } = require('./database');
const url = process.env.DATABASE_URL;

let client = null;
if (url) {
  client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  client.connect();
}

const query = async (text, params=[]) => {
  if (!client) throw new Error('Postgres no configurado');
  const res = await client.query(text, params);
  return res;
};

module.exports = { client, query, sqliteAll, sqliteGet, sqliteRun };
