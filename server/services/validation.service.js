/**
 * Servicio de validación para imports
 * Valida rows de Excel según tipo (products/packages)
 */

export class ValidationService {
  /**
   * Valida una fila de producto
   */
  static validateProduct(row, rowNumber) {
    const errors = [];
    
    // SKU obligatorio y único
    if (!row.sku || !row.sku.trim()) {
      errors.push({ row: rowNumber, field: 'sku', message: 'SKU es obligatorio' });
    }
    
    // Nombre obligatorio
    if (!row.nombre || !row.nombre.trim()) {
      errors.push({ row: rowNumber, field: 'nombre', message: 'Nombre es obligatorio' });
    }
    
    // Categoría obligatoria
    if (!row.categoria || !row.categoria.trim()) {
      errors.push({ row: rowNumber, field: 'categoria', message: 'Categoría es obligatoria' });
    }
    
    // Stock debe ser número válido ≥ 0
    const stock = Number(row.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push({ row: rowNumber, field: 'stock', message: 'Stock debe ser número ≥ 0' });
    }
    
    // Precio debe ser número válido ≥ 0
    const precioUnitario = Number(row.precioUnitario);
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      errors.push({ row: rowNumber, field: 'precioUnitario', message: 'Precio debe ser número ≥ 0' });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      normalized: errors.length === 0 ? {
        sku: String(row.sku).trim(),
        nombre: String(row.nombre).trim(),
        categoria: String(row.categoria).trim(),
        stock: stock || 0,
        minStock: Number(row.minStock) || 10,
        precioUnitario: precioUnitario || 0
      } : null
    };
  }

  /**
   * Valida una fila de paquete
   */
  static validatePackage(row, rowNumber) {
    const errors = [];
    
    if (!row.code || !row.code.trim()) {
      errors.push({ row: rowNumber, field: 'code', message: 'Código es obligatorio' });
    }
    
    if (!row.productSku || !row.productSku.trim()) {
      errors.push({ row: rowNumber, field: 'productSku', message: 'Product SKU es obligatorio' });
    }
    
    const validStates = ['created', 'in_transit', 'delivered', 'rejected'];
    if (row.state && !validStates.includes(row.state)) {
      errors.push({ row: rowNumber, field: 'state', message: `Estado debe ser: ${validStates.join(', ')}` });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      normalized: errors.length === 0 ? {
        code: String(row.code).trim().toUpperCase(),
        productSku: String(row.productSku).trim(),
        state: row.state || 'created',
        location: row.location ? String(row.location).trim() : undefined,
        notes: row.notes ? String(row.notes).trim() : undefined
      } : null
    };
  }

  /**
   * Detecta duplicados por SKU (productos) o code (paquetes)
   */
  static detectDuplicates(rows, type = 'products') {
    const key = type === 'products' ? 'sku' : 'code';
    const seen = new Set();
    const duplicates = new Set();
    
    // Recoge los indices que repiten la clave primaria en el archivo cargado.
    rows.forEach((row, idx) => {
      const value = row?.data?.[key];
      if (value && seen.has(value)) {
        duplicates.add(idx);
      } else if (value) {
        seen.add(value);
      }
    });
    
    return duplicates;
  }
}

