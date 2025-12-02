// Servicio de importacion desde Excel para productos y paquetes.
import ExcelJS from 'exceljs';
import { ValidationService } from './validation.service.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { PackageRepository } from '../repositories/package.repository.js';
import Alert from '../models/alert.model.js';
import { notifyLowStock } from './notification.service.js';

const PRODUCT_HEADER_MAP = {
  sku: ['sku', 'codigo', 'codigosku', 'productsku', 'product_sku', 'id', 'codigo_producto', 'item', 'itemcode'],
  nombre: ['nombre', 'nombre_producto', 'producto', 'descripcion', 'descripcion_producto', 'product_name'],
  categoria: ['categoria', 'categoria_producto', 'segmento', 'familia', 'linea', 'category'],
  stock: ['stock', 'cantidad', 'inventario', 'qty', 'stock_actual', 'existencias'],
  minStock: ['min_stock', 'stock_minimo', 'stock_limit', 'stock_min', 'punto_reorden', 'reorder_point'],
  precioUnitario: ['precio_unitario', 'precio', 'precio_venta', 'precio_unit', 'costo', 'costounitario', 'valor_unitario']
};

const PACKAGE_HEADER_MAP = {
  code: ['code', 'codigo', 'identificador', 'paquete', 'package', 'package_code'],
  productSku: ['productsku', 'product_sku', 'sku_producto', 'sku', 'producto_sku'],
  state: ['state', 'estado', 'estatus'],
  location: ['location', 'ubicacion', 'city'],
  notes: ['notes', 'notas', 'detalle', 'comentarios']
};

/**
 * Servicio de importación de Excel
 */
export class ImportService {
  /**
   * Normaliza headers del Excel
   */
  static normalizeKey(k) {
    return String(k ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Parsea buffer Excel a filas estructuradas
   */
  static async parseBufferToRows(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const result = [];

    workbook.eachSheet((worksheet) => {
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        const normalized = this.normalizeKey(cell.value);
        headers[colNumber] = normalized || `col${colNumber}`;
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
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

  static pickValue(row = {}, aliases = []) {
    for (const key of aliases) {
      if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
      const value = row[key];
      if (value === undefined || value === null) continue;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
        continue;
      }
      return value;
    }
    return undefined;
  }

  static normalizeProductRow(row = {}) {
    const normalized = {
      sku: this.pickValue(row, PRODUCT_HEADER_MAP.sku),
      nombre: this.pickValue(row, PRODUCT_HEADER_MAP.nombre),
      categoria: this.pickValue(row, PRODUCT_HEADER_MAP.categoria),
      stock: this.pickValue(row, PRODUCT_HEADER_MAP.stock),
      minStock: this.pickValue(row, PRODUCT_HEADER_MAP.minStock),
      precioUnitario: this.pickValue(row, PRODUCT_HEADER_MAP.precioUnitario)
    };
    return normalized;
  }

  static normalizePackageRow(row = {}) {
    const code = this.pickValue(row, PACKAGE_HEADER_MAP.code);
    const productSku = this.pickValue(row, PACKAGE_HEADER_MAP.productSku);
    const state = (this.pickValue(row, PACKAGE_HEADER_MAP.state) || '').toString().toLowerCase();
    return {
      code: code ? String(code).trim().toUpperCase() : undefined,
      productSku: productSku ? String(productSku).trim() : undefined,
      state: state || undefined,
      location: this.pickValue(row, PACKAGE_HEADER_MAP.location),
      notes: this.pickValue(row, PACKAGE_HEADER_MAP.notes)
    };
  }

  static normalizeRows(rows = [], type = 'products') {
    return rows.map((row) => ({
      ...row,
      data: type === 'packages'
        ? this.normalizePackageRow(row.data || {})
        : this.normalizeProductRow(row.data || {})
    }));
  }

  static async syncLowStockAlerts(products = []) {
    for (const product of products) {
      if (typeof product.stock !== 'number' || typeof product.minStock !== 'number') continue;
      if (product.stock > product.minStock) continue;
      try {
        // Mantiene alertas alineadas despues de importaciones masivas.
        await Alert.findOneAndUpdate(
          { productSku: product.sku },
          {
            producto: product.nombre || product.sku,
            productSku: product.sku,
            stock: product.stock,
            minStock: product.minStock,
            status: 'active',
            mensaje: `Stock bajo: ${product.nombre || product.sku} (${product.stock}/${product.minStock})`
          },
          { upsert: true, new: true }
        );
        await notifyLowStock(product);
      } catch (err) {
        console.error('syncLowStockAlerts error', err.message);
      }
    }
  }

  /**
   * Procesa importación de productos
   */
  static async processProductImport(buffer, userId) {
    const parsedRows = await this.parseBufferToRows(buffer);
    const rows = this.normalizeRows(parsedRows, 'products');
    
    if (rows.length === 0) {
      throw new Error('El archivo Excel está vacío o es inválido');
    }

    const errors = [];
    const validProducts = [];
    const duplicates = ValidationService.detectDuplicates(rows, 'products');

    rows.forEach((row, idx) => {
      const originalRowNum = row.rowNumber;
      const validation = ValidationService.validateProduct(row.data, originalRowNum);
      
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      } else if (duplicates.has(idx)) {
        errors.push({ row: originalRowNum, field: 'sku', message: 'SKU duplicado en el archivo' });
      } else {
        const normalized = {
          ...validation.normalized,
          ...(userId ? { updatedBy: userId } : {})
        };
        validProducts.push(normalized);
      }
    });

    let productsCreated = 0;
    let productsUpdated = 0;
    
    if (validProducts.length > 0) {
      const result = await ProductRepository.bulkUpsert(validProducts);
      productsCreated = result?.created || 0;
      productsUpdated = result?.updated || 0;
      await this.syncLowStockAlerts(validProducts);
    }

    return {
      rowsTotal: rows.length,
      rowsOk: validProducts.length,
      rowsError: rows.length - validProducts.length,
      errors,
      productsCreated,
      productsUpdated
    };
  }

  /**
   * Procesa importación de paquetes
   */
  static async processPackageImport(buffer, userId) {
    const parsedRows = await this.parseBufferToRows(buffer);
    const rows = this.normalizeRows(parsedRows, 'packages');
    
    if (rows.length === 0) {
      throw new Error('El archivo Excel está vacío o es inválido');
    }

    const errors = [];
    const validPackages = [];
    const duplicates = ValidationService.detectDuplicates(rows, 'packages');

    rows.forEach((row, idx) => {
      const originalRowNum = row.rowNumber;
      const validation = ValidationService.validatePackage(row.data, originalRowNum);
      
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      } else if (duplicates.has(idx)) {
        errors.push({ row: originalRowNum, field: 'code', message: 'Código duplicado en el archivo' });
      } else {
        validPackages.push(validation.normalized);
      }
    });

    let packagesCreated = 0;
    let packagesUpdated = 0;
    
    if (validPackages.length > 0) {
      const result = await PackageRepository.bulkUpsert(validPackages);
      packagesCreated = result?.created || 0;
      packagesUpdated = result?.updated || 0;
    }

    return {
      rowsTotal: rows.length,
      rowsOk: validPackages.length,
      rowsError: rows.length - validPackages.length,
      errors,
      packagesCreated,
      packagesUpdated
    };
  }

  /**
   * Determina el tipo de importación basado en headers
   */
  static detectImportType(buffer) {
    // En una versión más sofisticada, podría analizar los headers
    // Por ahora, asumimos que los headers indican el tipo
    // Retornamos 'auto' para que el controller decida
    return 'auto';
  }
}

