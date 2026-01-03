// index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require("fs");

const db = require("./database");

// Helpers que trabajan con DB que puede ser sync (sqlite) o async (pg)
async function dbAll(sql, params = []) {
  const res = db.all(sql, params);
  if (res && typeof res.then === 'function') return await res;
  return res;
}
async function dbGet(sql, params = []) {
  const res = db.get(sql, params);
  if (res && typeof res.then === 'function') return await res;
  return res;
}
async function dbRun(sql, params = []) {
  const res = db.run(sql, params);
  if (res && typeof res.then === 'function') return await res;
  return res;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change';

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Formato de token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public"))); // servir UI estática (si existe)
app.use(express.static(path.join(__dirname, "client/dist"))); // Servir Frontend React Build

// API Routes should be above this


// =========================
//      MULTER IMÁGENES
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + Math.random().toString(36).substring(2);
    cb(null, name + path.extname(file.originalname));
  }
});
const upload = multer({ storage });


// =========================
//       HELPERS
// =========================
async function log(accion, detalle = "") {
  await dbRun("INSERT INTO logs (accion, detalle) VALUES (?,?)", [
    accion,
    typeof detalle === "string" ? detalle : JSON.stringify(detalle)
  ]);
}

async function calcularSaldo(ordenId) {
  const ord = await dbGet("SELECT total, anticipo FROM ordenes WHERE id = ?", [ordenId]);
  if (!ord) return;
  const saldo = ord.total - ord.anticipo;
  await dbRun("UPDATE ordenes SET saldo = ? WHERE id = ?", [saldo, ordenId]);
}


// =========================
//       CLIENTES
// =========================

// Auth routes (register / login)
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, nombre } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const exists = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (exists) return res.status(400).json({ error: 'username exists' });
    const hash = await bcrypt.hash(password, 10);
    const result = await dbRun('INSERT INTO users (username, password_hash, nombre) VALUES (?,?,?)', [username, hash, nombre]);
    const user = await dbGet('SELECT id, username, nombre, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/clientes", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM clientes ORDER BY id DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/clientes/:id", async (req, res) => {
  try {
    const row = await dbGet("SELECT * FROM clientes WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/clientes", authenticateToken, async (req, res) => {
  try {
    const { nombre, telefono = null, correo = null } = req.body;
    if (!nombre) return res.status(400).json({ error: "Nombre es requerido" });

    const result = await dbRun(
      "INSERT INTO clientes (nombre, telefono, correo) VALUES (?,?,?)",
      [nombre, telefono, correo]
    );
    const id = result.lastInsertRowid;

    await log("cliente_creado", { id, nombre });

    res.status(201).json(await dbGet("SELECT * FROM clientes WHERE id = ?", [id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/clientes/:id", authenticateToken, async (req, res) => {
  try {
    const ex = await dbGet("SELECT * FROM clientes WHERE id = ?", [req.params.id]);
    if (!ex) return res.status(404).json({ error: "Cliente no encontrado" });

    const { nombre, telefono, correo } = req.body;

    await dbRun(
      `UPDATE clientes 
       SET nombre = COALESCE(?, nombre),
           telefono = COALESCE(?, telefono),
           correo = COALESCE(?, correo)
       WHERE id = ?`,
      [nombre, telefono, correo, req.params.id]
    );

    await log("cliente_editado", req.params.id);

    res.json(await dbGet("SELECT * FROM clientes WHERE id = ?", [req.params.id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/clientes/:id", authenticateToken, async (req, res) => {
  try {
    const ex = await dbGet("SELECT * FROM clientes WHERE id = ?", [req.params.id]);
    if (!ex) return res.status(404).json({ error: "Cliente no encontrado" });

    await dbRun("DELETE FROM clientes WHERE id = ?", [req.params.id]);
    await log("cliente_eliminado", req.params.id);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// =========================
//        VEHÍCULOS
// =========================

app.get("/vehiculos", authenticateToken, async (req, res) => {
  try {
    res.json(await dbAll("SELECT * FROM vehiculos ORDER BY id DESC"));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/vehiculos/:id", async (req, res) => {
  try {
    const row = await dbGet("SELECT * FROM vehiculos WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Vehículo no encontrado" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// proteger vehiculos write routes
app.post("/vehiculos", authenticateToken, async (req, res) => {
  try {
    const { cliente_id, marca = null, modelo = null, placas = null } = req.body;

    if (!cliente_id) return res.status(400).json({ error: "cliente_id requerido" });

    const cliente = await dbGet("SELECT * FROM clientes WHERE id = ?", [cliente_id]);
    if (!cliente) return res.status(400).json({ error: "cliente_id inválido" });

    const result = await dbRun(
      "INSERT INTO vehiculos (cliente_id, marca, modelo, placas) VALUES (?,?,?,?)",
      [cliente_id, marca, modelo, placas]
    );
    const id = result.lastInsertRowid;

    await log("vehiculo_creado", id);

    res.status(201).json(await dbGet("SELECT * FROM vehiculos WHERE id = ?", [id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/vehiculos/:id", authenticateToken, async (req, res) => {
  try {
    const ex = await dbGet("SELECT * FROM vehiculos WHERE id = ?", [req.params.id]);
    if (!ex) return res.status(404).json({ error: "Vehículo no encontrado" });

    const { marca, modelo, placas } = req.body;

    await dbRun(
      `UPDATE vehiculos 
       SET marca = COALESCE(?, marca),
           modelo = COALESCE(?, modelo),
           placas = COALESCE(?, placas)
       WHERE id = ?`,
      [marca, modelo, placas, req.params.id]
    );

    await log("vehiculo_editado", req.params.id);

    res.json(await dbGet("SELECT * FROM vehiculos WHERE id = ?", [req.params.id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/vehiculos/:id", authenticateToken, async (req, res) => {
  try {
    const ex = await dbGet("SELECT * FROM vehiculos WHERE id = ?", [req.params.id]);
    if (!ex) return res.status(404).json({ error: "Vehículo no encontrado" });

    await dbRun("DELETE FROM vehiculos WHERE id = ?", [req.params.id]);
    await log("vehiculo_eliminado", req.params.id);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// =========================
//        ÓRDENES
// =========================

app.get("/ordenes", authenticateToken, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 
        o.*, 
        c.nombre AS cliente,
        v.marca || ' ' || v.modelo AS vehiculo
      FROM ordenes o
      JOIN clientes c ON c.id = o.cliente_id
      JOIN vehiculos v ON v.id = o.vehiculo_id
      ORDER BY o.created_at DESC
    `);

    rows.forEach((r) => {
      if (r.imagenes) {
        try { r.imagenes = JSON.parse(r.imagenes); } catch { r.imagenes = []; }
      }
    });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Crear orden con imágenes y QR
app.post("/ordenes", authenticateToken, upload.array("imagenes", 8), async (req, res) => {
  try {
    const {
      cliente_id,
      vehiculo_id,
      descripcion = "",
      servicio = "",
      total = 0,
      anticipo = 0,
      fecha_cita = null,
      fecha_entrega = null,
      prioridad = "normal",
      tecnico = null
    } = req.body;

    const files = req.files || [];
    const imagenes = files.map(f => "/uploads/" + path.basename(f.path));

    const result = await dbRun(
      `INSERT INTO ordenes 
      (cliente_id, vehiculo_id, descripcion, imagenes, servicio, total, anticipo, saldo,
       fecha_cita, fecha_entrega, qr, status, prioridad, tecnico)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        cliente_id,
        vehiculo_id,
        descripcion,
        JSON.stringify(imagenes),
        servicio,
        total,
        anticipo,
        total - anticipo,
        fecha_cita,
        fecha_entrega,
        "",
        "pendiente",
        prioridad,
        tecnico
      ]
    );
    const id = result.lastInsertRowid;

    // QR de seguimiento
    const url = `http://localhost:${PORT}/ordenes/${id}`;
    const dataUrl = await QRCode.toDataURL(url);
    const base64 = dataUrl.split(",")[1];
    const filename = `qr-${id}.png`;
    const qrPath = path.join(__dirname, "uploads", filename);
    fs.writeFileSync(qrPath, Buffer.from(base64, "base64"));

    await dbRun("UPDATE ordenes SET qr = ? WHERE id = ?", ["/uploads/" + filename, id]);

    await log("orden_creada", id);

    const row = await dbGet("SELECT * FROM ordenes WHERE id = ?", [id]);
    row.imagenes = imagenes;

    res.status(201).json(row);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Detalle orden
app.get("/ordenes/:id", authenticateToken, async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT 
        o.*, 
        c.nombre AS cliente,
        v.marca || ' ' || v.modelo AS vehiculo
      FROM ordenes o
      JOIN clientes c ON c.id = o.cliente_id
      JOIN vehiculos v ON v.id = o.vehiculo_id
      WHERE o.id = ?`,
      [req.params.id]
    );

    if (!row) return res.status(404).json({ error: "Orden no encontrada" });

    if (row.imagenes) {
      try { row.imagenes = JSON.parse(row.imagenes); } catch { row.imagenes = []; }
    }

    res.json(row);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Actualizar orden: status, técnico, prioridad, pagos, etc.
app.put("/ordenes/:id", authenticateToken, async (req, res) => {
  try {
    const ord = await dbGet("SELECT * FROM ordenes WHERE id = ?", [req.params.id]);
    if (!ord) return res.status(404).json({ error: "Orden no encontrada" });

    const {
      status,
      total,
      anticipo,
      fecha_entrega,
      tecnico,
      prioridad
    } = req.body;

    await dbRun(
      `UPDATE ordenes SET 
        status = COALESCE(?, status),
        total = COALESCE(?, total),
        anticipo = COALESCE(?, anticipo),
        fecha_entrega = COALESCE(?, fecha_entrega),
        tecnico = COALESCE(?, tecnico),
        prioridad = COALESCE(?, prioridad)
      WHERE id = ?`,
      [status, total, anticipo, fecha_entrega, tecnico, prioridad, req.params.id]
    );

    await calcularSaldo(req.params.id);

    await log("orden_editada", req.params.id);

    res.json(await dbGet("SELECT * FROM ordenes WHERE id = ?", [req.params.id]));

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// =========================
//        COSTOS
// =========================

app.get("/costos", authenticateToken, async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM costos ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/ordenes/:id/costos", authenticateToken, async (req, res) => {
  try {
    res.json(await dbAll("SELECT * FROM costos WHERE orden_id = ?", [req.params.id]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/ordenes/:id/costos", authenticateToken, async (req, res) => {
  try {
    const { concepto, costo, tipo = "material" } = req.body;

    const result = await dbRun(
      "INSERT INTO costos (orden_id, concepto, costo, tipo) VALUES (?,?,?,?)",
      [req.params.id, concepto, costo, tipo]
    );

    await log("costo_agregado", { orden: req.params.id, concepto, costo });

    res.status(201).json(await dbGet("SELECT * FROM costos WHERE id = ?", [result.lastInsertRowid]));

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// =========================
//       NOTION
// =========================

app.post("/api/notion/webhook", (req, res) => {
  // Verificación de Notion (challenge)
  if (req.body?.challenge) {
    return res.status(200).json({
      challenge: req.body.challenge
    });
  }

  console.log("Evento Notion recibido:", req.body);
  res.sendStatus(200);
});


// =========================
//       HEALTHCHECK
// =========================

app.get("/_health", (req, res) => res.json({ ok: true }));


// =========================
//       INICIAR SERVER
// =========================

// SUBIR IMÁGENES A UNA ORDEN EXISTENTE
app.post("/ordenes/:id/imagenes", authenticateToken, upload.single("imagen"), async (req, res) => {
  try {
    const id = req.params.id;
    if (!req.file) return res.status(400).json({ error: "No se subió ninguna imagen" });

    const orden = await dbGet("SELECT * FROM ordenes WHERE id = ?", [id]);
    
    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    let imagenes = [];
    try {
      imagenes = orden.imagenes ? JSON.parse(orden.imagenes) : [];
    } catch (e) {
      imagenes = [];
    }

    const newUrl = "/uploads/" + req.file.filename;
    imagenes.push(newUrl);

    await dbRun("UPDATE ordenes SET imagenes = ? WHERE id = ?", [JSON.stringify(imagenes), id]);
    await log("subir_imagen", `Orden ${id}: ${req.file.filename}`);

    res.json({ ok: true, imagenes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al subir imagen" });
  }
});

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

// SPA Fallback - Must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});
