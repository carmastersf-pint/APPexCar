const request = require('supertest');

const base = 'http://localhost:3000';

describe('API básica - integración', () => {
  let clienteId;
  let vehiculoId;
  let ordenId;

  test('Crear cliente', async () => {
    const res = await request(base)
      .post('/clientes')
      .send({ nombre: 'Cliente Test', telefono: '000', correo: 't@test.com' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    clienteId = res.body.id;
  }, 10000);

  test('Crear vehiculo', async () => {
    const res = await request(base)
      .post('/vehiculos')
      .send({ cliente_id: clienteId, marca: 'Toyota', modelo: 'Corolla', placas: 'ABC123' })
      .set('Accept', 'application/json');
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    vehiculoId = res.body.id;
  }, 10000);

  test('Crear orden sin imagenes', async () => {
    const res = await request(base)
      .post('/ordenes')
      .field('cliente_id', clienteId)
      .field('vehiculo_id', vehiculoId)
      .field('descripcion', 'Revisión general')
      .field('servicio', 'Mantenimiento')
      .field('total', 120.5);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id');
    ordenId = res.body.id;
  }, 15000);

  test('Subir imagen a la orden', async () => {
    const res = await request(base)
      .post(`/ordenes/${ordenId}/imagenes`)
      .attach('imagen', 'tests/assets/test-image.png');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('imagenes');
    expect(Array.isArray(res.body.imagenes)).toBe(true);
  }, 15000);
});
