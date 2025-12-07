const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Crear carpeta de uploads si no existe
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// Configuración Multer (para fotos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Base de datos
const db = new Database("taller.db");

// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marca TEXT,
    modelo TEXT,
    placas TEXT,
    cliente TEXT,
    fotos TEXT
  )
`).run();

// ------------------ ENDPOINTS ------------------

// Crear vehículo
app.post("/vehiculos", upload.array("fotos"), (req, res) => {
  const { marca, modelo, placas, cliente } = req.body;
  const fotos = req.files.map((f) => f.filename).join(",");

  const stmt = db.prepare(`
    INSERT INTO vehiculos (marca, modelo, placas, cliente, fotos)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(marca, modelo, placas, cliente, fotos);
  res.json({ id: result.lastInsertRowid, success: true });
});

// Listar vehículos
app.get("/vehiculos", (req, res) => {
  const rows = db.prepare("SELECT * FROM vehiculos").all();
  res.json(rows);
});

// Obtener un vehículo
app.get("/vehiculos/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM vehiculos WHERE id = ?")
    .get(req.params.id);
  res.json(row || {});
});

// Eliminar vehículo
app.delete("/vehiculos/:id", (req, res) => {
  db.prepare("DELETE FROM vehiculos WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Archivos públicos (fotos)
app.use("/uploads", express.static("uploads"));

// Iniciar servidor
app.listen(3001, () => {
  console.log("Servidor activo en http://localhost:3001");
});
