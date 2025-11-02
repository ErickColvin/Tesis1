import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import importRoutes from './routes/import.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracelink';

// Configuración de conexión
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
  socketTimeoutMS: 45000,
};

// Ocultar contraseña en logs
const getLogURI = (uri) => {
  if (uri.includes('@')) {
    return uri.replace(/:[^:@]+@/, ':****@'); // Oculta contraseña
  }
  return uri;
};

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB conectado exitosamente');
    console.log('📍 Base de datos:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('📊 Estado:', mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado');
  })
  .catch(err => {
    console.error('❌ Error conectando MongoDB:');
    console.error('🔗 URI (sin contraseña):', getLogURI(MONGODB_URI));
    console.error('📝 Error:', err.message);
    console.error('\n💡 Verifica:');
    console.error('   1. Que MONGODB_URI en .env sea correcto');
    console.error('   2. Que la contraseña sea correcta');
    console.error('   3. Que tu IP esté en la whitelist de MongoDB Atlas');
    console.error('   4. Que la red permita conexiones a MongoDB Atlas');
    process.exit(1); // Salir si no puede conectar
  });

// Manejar eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error en MongoDB:', err);
});

// Multer en memoria con límite 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Datos en memoria (temporal)
let products = [];
let alerts = [];

/**
 * Helper: normaliza clave del header del excel a nombre simple (trim)
 */
function normalizeKey(k) {
  return String(k ?? '').trim();
}

/**
 * parseBufferToRows
 * - lee buffer de Excel usando exceljs y devuelve array de { sheet, rowNumber, data }
 */
async function parseBufferToRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const result = [];

  workbook.eachSheet((worksheet) => {
    // obtener headers desde la primera fila
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = normalizeKey(cell.value);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // salta header
      const obj = {};
      row.eachCell((cell, colNumber) => {
        const key = headers[colNumber] || `col${colNumber}`;
        let val = cell.value;
        if (val && typeof val === 'object' && 'text' in val) val = val.text;
        obj[key] = val;
      });
      result.push({ sheet: worksheet.name, rowNumber, data: obj });
    });
  });

  return result;
}

/**
 * POST /api/upload
 * Recibe archivo Excel, lo parsea y actualiza `products` y `alerts`.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'file required' });
    }

    const rows = await parseBufferToRows(req.file.buffer);

    // Si no hay filas, devolver 400
    if (rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'empty or invalid excel' });
    }


    const firstSheet = rows[0].sheet;
    const sheetRows = rows.filter(r => r.sheet === firstSheet).map(r => r.data);

    // Mapea filas a nuestro modelo
    products = sheetRows.map((r, idx) => {
      const id = r["ID"] ?? r["Id"] ?? r["id"] ?? `row_${idx + 2}`;
      const nombre = r["Nombre Producto"] ?? r["Nombre"] ?? r["Producto"] ?? '';
      const categoria = r["Categoría"] ?? r["Categoria"] ?? r["Category"] ?? '';
      const stock = Number(r["Stock"] ?? r["stock"] ?? 0) || 0;
      const precioUnitario = Number(r["Precio Unitario"] ?? r["Precio"] ?? r["price"] ?? 0) || 0;
      const fechaRaw = r["Fecha Ingreso"] ?? r["Fecha"] ?? r["Date"];
      const fechaIngreso = (fechaRaw instanceof Date) ? fechaRaw : (fechaRaw ? new Date(fechaRaw) : new Date());

      return {
        id: String(id),
        nombre: String(nombre),
        categoria: String(categoria),
        stock,
        precioUnitario,
        fechaIngreso
      };
    });

    // Genera alertas para stock < 10
    alerts = products
      .filter(p => typeof p.stock === 'number' && p.stock < 10)
      .map(p => ({
        producto: p.nombre,
        stock: p.stock,
        mensaje: `Stock bajo: ${p.nombre}`,
        createdAt: new Date()
      }));

    console.log(`Upload processed: ${products.length} products, ${alerts.length} alerts`);

    return res.json({ ok: true, count: products.length, alertsCount: alerts.length });
  } catch (err) {
    console.error('Error al procesar Excel:', err);
    return res.status(500).json({ ok: false, error: 'Error al procesar Excel', detail: err.message });
  }
});

/** GET /api/products → lista de productos */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/** GET /api/alerts → lista de alertas */
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

// Healthcheck con estado de MongoDB
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    ok: dbState === 1,
    mongodb: {
      status: states[dbState] || 'unknown',
      connected: dbState === 1,
      database: mongoose.connection.name,
      host: mongoose.connection.host
    },
    timestamp: new Date().toISOString()
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de administración
app.use('/api/admin', adminRoutes);

// Rutas de importación (nueva arquitectura)
app.use('/api/imports', importRoutes);

// Rutas legacy (a deprecar): mantener para retrocompatibilidad
app.get('/api/products', (req, res) => {
  res.json(products || []);
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts || []);
});

// Levanta el servidor en el puerto 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
