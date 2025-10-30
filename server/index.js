import express from 'express';
import cors from 'cors';
import multer from 'multer';
import ExcelJS from 'exceljs';

const app = express();
app.use(cors());
app.use(express.json());

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

// Healthcheck simple
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Levanta el servidor en el puerto 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
