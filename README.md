# Gestor Taller

Pequeña API para gestionar clientes, vehículos y órdenes de un taller.

Requisitos
- Node.js 18+
- Instalar dependencias: `npm install`

Comandos
```powershell
npm install
npm start
# o
node index.js
```

Endpoints principales
- `GET /clientes` - listar clientes
- `GET /vehiculos` - listar vehículos
- `GET /ordenes` - listar órdenes (con cliente y vehículo)

Ordenes (CRUD básico extendido)
- `POST /ordenes` - crear orden. Form-data: campos JSON `cliente_id`, `vehiculo_id`, `descripcion`, `servicio`, `total`, `fecha_cita`, `fecha_entrega`, y archivos `images` (hasta 5).
- `GET /ordenes/:id` - ver detalle de una orden
- `PUT /ordenes/:id` - actualizar parcialmente (ej. `{ "status": "listo" }`)
- `DELETE /ordenes/:id` - borrar orden y archivos asociados

Archivos subidos
- Se guardan en la carpeta `uploads/` y se sirven en `/uploads/*`.
- Las rutas a imágenes y QR se guardan en la columna `imagenes` y `qr` de la tabla `ordenes`.

Notas y próximos pasos
- Añadir validación de entradas y control de errores más detallado.
- Implementar endpoints CRUD completos para `clientes` y `vehiculos`.
- Crear una interfaz web para manejar el taller visualmente.
- Añadir autenticación si se requiere multiusuario.

Contacto
- Este README fue generado automáticamente por el asistente.
