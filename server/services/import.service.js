import ExcelJS from 'exceljs';
import { ValidationService } from './validation.service.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { PackageRepository } from '../repositories/package.repository.js';

/**
 * Servicio de importación de Excel
 */
export class ImportService {
  /**
   * Normaliza headers del Excel
   */
  static normalizeKey(k) {
    return String(k ?? '').trim();
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
        headers[colNumber] = this.normalizeKey(cell.value);
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

  /**
   * Procesa importación de productos
   */
  static async processProductImport(buffer, userId) {
    const rows = await this.parseBufferToRows(buffer);
    
    if (rows.length === 0) {
      throw new Error('El archivo Excel está vacío o es inválido');
    }

    const errors = [];
    const validProducts = [];
    const duplicates = ValidationService.detectDuplicates(rows, 'products');

    // Validar cada fila
    rows.forEach((row, idx) => {
      const originalRowNum = row.rowNumber;
      const validation = ValidationService.validateProduct(row.data, originalRowNum);
      
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      } else if (duplicates.has(idx)) {
        errors.push({ row: originalRowNum, field: 'sku', message: 'SKU duplicado en el archivo' });
      } else {
        validProducts.push(validation.normalized);
      }
    });

    // Upsert productos válidos
    let productsCreated = 0;
    let productsUpdated = 0;
    
    if (validProducts.length > 0) {
      const result = await ProductRepository.bulkUpsert(validProducts);
      productsCreated = result.created;
      productsUpdated = result.updated;
    }

    return {
      rowsOk: validProducts.length,
      rowsError: errors.length,
      errors,
      productsCreated,
      productsUpdated
    };
  }

  /**
   * Procesa importación de paquetes
   */
  static async processPackageImport(buffer, userId) {
    const rows = await this.parseBufferToRows(buffer);
    
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
      packagesCreated = result.created;
      packagesUpdated = result.updated;
    }

    return {
      rowsOk: validPackages.length,
      rowsError: errors.length,
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

