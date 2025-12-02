// Pruebas de integracion para importaciones de Excel (productos y paquetes).
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import importRoutes from '../routes/import.routes.js';
import Product from '../models/product.model.js';
import Alert from '../models/alert.model.js';
import Import from '../models/import.model.js';

jest.setTimeout(60000);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/imports', importRoutes);

let mongoServer;

const uploader = (buffer, type = 'products', filename = 'test.xlsx') => {
  return request(app)
    .post('/api/imports')
    .field('type', type)
    .attach('file', buffer, {
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
};

async function buildWorkbookBuffer(headers = [], rows = []) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Hoja 1');
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('POST /api/imports', () => {
  test('rechaza requests sin archivo', async () => {
    const res = await request(app).post('/api/imports');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain('Archivo requerido');
  });

  test('rechaza archivos no Excel', async () => {
    const res = await request(app)
      .post('/api/imports')
      .attach('file', Buffer.from('not excel'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(500);
  });

  test('importa productos con cabeceras normalizadas', async () => {
    const buffer = await buildWorkbookBuffer(
      ['SKU', 'Nombre Producto', 'Categoría', 'Stock', 'Stock mínimo', 'Precio Unitario'],
      [
        ['SKU-100', 'Balanza Digital', 'Hardware', 25, 5, 120.5],
        ['SKU-200', 'Kit Mantenimiento', 'Servicios', 8, 3, 35]
      ]
    );

    const res = await uploader(buffer, 'products', 'productos.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.summary.rowsOk).toBe(2);
    expect(await Product.countDocuments()).toBe(2);
    expect(await Import.countDocuments()).toBe(1);
  });

  test('detecta filas duplicadas por SKU', async () => {
    const buffer = await buildWorkbookBuffer(
      ['SKU', 'Nombre Producto', 'Categoría', 'Stock', 'Stock mínimo', 'Precio Unitario'],
      [
        ['SKU-300', 'Router A', 'Networking', 10, 3, 50],
        ['SKU-300', 'Router B', 'Networking', 12, 4, 55]
      ]
    );

    const res = await uploader(buffer, 'products', 'duplicados.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.summary.rowsOk).toBe(1);
    expect(res.body.errors[0].message).toContain('SKU duplicado');
    expect(await Product.countDocuments()).toBe(1);
  });

  test('crea alerta cuando stock está por debajo del mínimo', async () => {
    const buffer = await buildWorkbookBuffer(
      ['SKU', 'Nombre', 'Categoría', 'Stock', 'Stock límite', 'Precio'],
      [['SKU-400', 'Batería respaldo', 'Energía', 2, 5, 90]]
    );

    const res = await uploader(buffer, 'products', 'alerta.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.summary.rowsOk).toBe(1);
    const alerts = await Alert.find({});
    expect(alerts.length).toBe(1);
    expect(alerts[0].productSku).toBe('SKU-400');
  });

  test('importa paquetes válidos', async () => {
    await Product.create({
      sku: 'SKU-500',
      nombre: 'Tracker',
      categoria: 'IoT',
      stock: 30,
      minStock: 5,
      precioUnitario: 150
    });

    const buffer = await buildWorkbookBuffer(
      ['Código', 'Product SKU', 'Estado', 'Ubicación'],
      [
        ['PKG-001', 'SKU-500', 'in_transit', 'Lima'],
        ['PKG-002', 'SKU-500', 'delivered', 'Cusco']
      ]
    );

    const res = await uploader(buffer, 'packages', 'paquetes.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.summary.rowsOk).toBe(2);
    expect(res.body.summary.packagesCreated).toBeGreaterThanOrEqual(2);
  });

  test('rechaza archivos vacíos', async () => {
    const buffer = await buildWorkbookBuffer(['SKU', 'Nombre'], []);
    const res = await uploader(buffer, 'products', 'vacio.xlsx');
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Error al procesar');
  });
});

describe('Import logs', () => {
  test('lista imports después de una carga', async () => {
    const buffer = await buildWorkbookBuffer(
      ['SKU', 'Nombre', 'Categoría', 'Stock', 'Stock mínimo', 'Precio'],
      [['SKU-600', 'Switch', 'Networking', 5, 2, 80]]
    );
    await uploader(buffer, 'products', 'productos.xlsx');

    const res = await request(app).get('/api/imports?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.imports[0]).toHaveProperty('fileName');
  });

  test('obtiene detalle por ID cuando existe', async () => {
    const buffer = await buildWorkbookBuffer(
      ['SKU', 'Nombre', 'Categoría', 'Stock', 'Stock mínimo', 'Precio'],
      [['SKU-700', 'Gateway', 'IoT', 7, 2, 300]]
    );
    const uploadRes = await uploader(buffer, 'products', 'detalle.xlsx');
    const importId = uploadRes.body.importId;
    const res = await request(app).get(`/api/imports/${importId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rowsOk', 1);
  });

  test('retorna 404 cuando el ID no existe', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/imports/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
