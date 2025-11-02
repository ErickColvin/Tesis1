import request from 'supertest';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import importRoutes from '../routes/import.routes.js';

/**
 * Test de integración para endpoints de importación
 * 
 * Prerequisitos:
 * - MongoDB corriendo en localhost:27017
 * - BD de test: tracelink_test
 */

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/imports', importRoutes);

describe('POST /api/imports', () => {
  const TEST_DB = 'mongodb://localhost:27017/tracelink_test';

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_DB);
      console.log('✅ Test DB conectada');
    } catch (err) {
      console.error('❌ Error conectando test DB:', err);
    }
  });

  afterAll(async () => {
    try {
      // Limpiar base de datos
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    } catch (err) {
      console.error('Error cerrando conexión:', err);
    }
  });

  test('debería rechazar request sin archivo', async () => {
    const res = await request(app)
      .post('/api/imports')
      .send();
    
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Archivo requerido');
  });

  test('debería rechazar archivo que no es Excel', async () => {
    const res = await request(app)
      .post('/api/imports')
      .attach('file', Buffer.from('not excel'), 'test.txt');
    
    expect(res.status).toBe(500);
  });

  // Nota: Para testear con un archivo Excel real, necesitaríamos un fixture
  // Por ahora el test básico valida que el endpoint existe y valida archivos
});

describe('GET /api/imports', () => {
  test('debería listar imports (inicialmente vacío)', async () => {
    const res = await request(app)
      .get('/api/imports');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('imports');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.imports)).toBe(true);
  });
});

describe('GET /api/imports/:id', () => {
  test('debería retornar 404 para ID inexistente', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/imports/${fakeId}`);
    
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});

