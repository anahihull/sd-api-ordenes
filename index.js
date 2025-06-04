// api-ordenes/index.js

// ----------------------------------------
// 1. DEPENDENCIAS
// ----------------------------------------
const express = require("express");
const { v4: uuidv4 } = require("uuid");

// ----------------------------------------
// 2. DATOS EN MEMORIA (con órdenes precargadas)
// ----------------------------------------
/**
 * Órdenes precargadas:
 *  - id: "101", usuarioId: "1",   producto: "Teclado", cantidad: 2
 *  - id: "102", usuarioId: "2",   producto: "Mouse",   cantidad: 1
 */
const ordenes = [
  { id: "101", usuarioId: "1", producto: "Teclado", cantidad: 2 },
  { id: "102", usuarioId: "2", producto: "Mouse",   cantidad: 1 },
];

// ----------------------------------------
// 3. CREACIÓN DEL SERVIDOR
// ----------------------------------------
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ----------------------------------------
// 4. RUTAS CRUD PARA Órdenes
// ----------------------------------------

// 4.1) GET /api/ordenes
//      → Devuelve todas las órdenes (incluidas las precargadas)
app.get("/api/ordenes", (req, res) => {
  return res.json(ordenes);
});

// 4.2) GET /api/ordenes/:id
//      → Devuelve una orden por su id
app.get("/api/ordenes/:id", (req, res) => {
  const { id } = req.params;
  const orden = ordenes.find((o) => o.id === id);
  if (!orden) {
    return res.status(404).json({ mensaje: "Orden no encontrada." });
  }
  return res.json(orden);
});

// 4.3) POST /api/ordenes
//      → Crea una orden nueva (body = { usuarioId, producto, cantidad })
app.post("/api/ordenes", (req, res) => {
  const { usuarioId, producto, cantidad } = req.body;
  if (!usuarioId || !producto || typeof cantidad !== "number") {
    return res
      .status(400)
      .json({ mensaje: "Faltan campos 'usuarioId', 'producto' o 'cantidad' inválido." });
  }
  const nuevaOrden = { id: uuidv4(), usuarioId, producto, cantidad };
  ordenes.push(nuevaOrden);
  return res.status(201).json(nuevaOrden);
});

// 4.4) PUT /api/ordenes/:id
//      → Actualiza una orden existente (body puede tener { producto?, cantidad? })
app.put("/api/ordenes/:id", (req, res) => {
  const { id } = req.params;
  const { producto, cantidad } = req.body;
  const orden = ordenes.find((o) => o.id === id);
  if (!orden) {
    return res.status(404).json({ mensaje: "Orden no encontrada para actualizar." });
  }
  if (producto !== undefined) orden.producto = producto;
  if (cantidad !== undefined) orden.cantidad = cantidad;
  return res.json(orden);
});

// 4.5) DELETE /api/ordenes/:id
//      → Elimina una orden por id
app.delete("/api/ordenes/:id", (req, res) => {
  const { id } = req.params;
  const idx = ordenes.findIndex((o) => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ mensaje: "Orden no encontrada para eliminar." });
  }
  ordenes.splice(idx, 1);
  return res.status(204).send();
});

// ----------------------------------------
// 5. RUTA RAÍZ
// ----------------------------------------
app.get("/", (_req, res) => {
  res.send("API-Órdenes 🟢  (puerto 4000) - órdenes precargadas disponibles.");
});

// ----------------------------------------
// 6. ARRANCAR EL SERVIDOR
// ----------------------------------------
app.listen(PORT, () => {
  console.log(`API-Órdenes corriendo en http://localhost:${PORT}`);  
});
