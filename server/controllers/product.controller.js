import { ProductRepository } from '../repositories/product.repository.js';
import Product from '../models/product.model.js';
import Alert from '../models/alert.model.js';

/**
 * POST /api/products
 * Crea uno o más productos
 */
export async function createProducts(req, res) {
  try {
    const { products } = req.body; // Array de productos

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Debe enviar un array de productos' });
    }

    if (products.length > 5) {
      return res.status(400).json({ message: 'Máximo 5 productos a la vez' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      
      // Validaciones
      if (!p.producto || !p.categoria || p.stock === undefined || p.stock_limit === undefined || p.precio === undefined) {
        errors.push({
          index: i,
          message: 'Faltan campos requeridos: producto, categoria, stock, stock_limit, precio'
        });
        continue;
      }

      // Generar SKU único si no viene
      const sku = p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const productData = {
        sku: sku.toUpperCase(),
        nombre: String(p.producto).trim(),
        categoria: String(p.categoria).trim(),
        stock: Number(p.stock) || 0,
        minStock: Number(p.stock_limit) || 10,
        precioUnitario: Number(p.precio) || 0
      };

      try {
        const product = await ProductRepository.upsert(sku.toUpperCase(), productData);
        results.push(product);

        // Crear alerta si stock <= minStock
        if (product.stock <= product.minStock) {
          await Alert.findOneAndUpdate(
            { productSku: product.sku },
            {
              producto: product.nombre,
              productSku: product.sku,
              stock: product.stock,
              minStock: product.minStock,
              status: 'active',
              mensaje: `Stock bajo: ${product.nombre} (${product.stock}/${product.minStock})`
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        errors.push({
          index: i,
          message: err.message || 'Error al crear producto',
          producto: p.producto
        });
      }
    }

    return res.status(201).json({
      ok: true,
      created: results.length,
      errors: errors.length,
      products: results,
      errorDetails: errors
    });
  } catch (err) {
    console.error('Error creando productos:', err);
    return res.status(500).json({ message: 'Error al crear productos', error: err.message });
  }
}

/**
 * GET /api/products
 * Lista productos con paginación
 */
export async function listProducts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const categoria = req.query.categoria;

    const result = await ProductRepository.list({ page, limit, search, categoria });

    return res.json(result);
  } catch (err) {
    console.error('Error listando productos:', err);
    return res.status(500).json({ message: 'Error al listar productos' });
  }
}

/**
 * PATCH /api/products/:sku
 * Actualiza un producto por SKU
 */
export async function updateProduct(req, res) {
  try {
    const { sku } = req.params;
    const updateData = req.body;

    // Buscar producto existente
    let product = await Product.findOne({ sku: sku.toUpperCase() });
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Solo permitir actualizar campos específicos
    const allowedFields = ['nombre', 'categoria', 'stock', 'minStock', 'precioUnitario'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Actualizar producto
    Object.assign(product, filteredData);
    product = await product.save();

    // Actualizar alerta si cambió stock o minStock
    if (filteredData.stock !== undefined || filteredData.minStock !== undefined) {
      const finalStock = filteredData.stock !== undefined ? filteredData.stock : product.stock;
      const finalMinStock = filteredData.minStock !== undefined ? filteredData.minStock : product.minStock;

      if (finalStock <= finalMinStock) {
        await Alert.findOneAndUpdate(
          { productSku: product.sku },
          {
            producto: product.nombre,
            productSku: product.sku,
            stock: finalStock,
            minStock: finalMinStock,
            status: 'active',
            mensaje: `Stock bajo: ${product.nombre} (${finalStock}/${finalMinStock})`
          },
          { upsert: true, new: true }
        );
      } else {
        // Resolver alerta si stock supera el límite
        await Alert.updateMany(
          { productSku: product.sku, status: 'active' },
          { status: 'resolved', resolvedAt: new Date() }
        );
      }
    }

    return res.json(product);
  } catch (err) {
    console.error('Error actualizando producto:', err);
    return res.status(500).json({ message: 'Error al actualizar producto' });
  }
}

