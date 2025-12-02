// Repository para encapsular queries de productos.
import Product from '../models/product.model.js';

/**
 * Repository para operaciones de Product
 */
export class ProductRepository {
  /**
   * Busca producto por SKU
   */
  static async findBySku(sku) {
    return await Product.findOne({ sku });
  }

  /**
   * Crea un producto
   */
  static async create(productData) {
    return await Product.create(productData);
  }

  /**
   * Upsert: crea o actualiza producto por SKU
   */
  static async upsert(sku, productData) {
    const result = await Product.findOneAndUpdate(
      { sku },
      productData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return result;
  }

  /**
   * Upsert múltiple (bulk)
   */
  static async bulkUpsert(products) {
    const bulkOps = products.map(product => ({
      updateOne: {
        filter: { sku: product.sku },
        update: product,
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(bulkOps);
    return {
      created: result.upsertedCount,
      updated: result.modifiedCount
    };
  }

  /**
   * Lista productos con paginación
   */
  static async list({ page = 1, limit = 20, search, categoria } = {}) {
    const query = {};
    
    if (search) {
      query.$or = [
        { sku: new RegExp(search, 'i') },
        { nombre: new RegExp(search, 'i') }
      ];
    }
    
    if (categoria) {
      query.categoria = categoria;
    }

    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);

    return { items, total, page, limit };
  }

  /**
   * Busca producto por ID
   */
  static async findById(id) {
    return await Product.findById(id);
  }
}

