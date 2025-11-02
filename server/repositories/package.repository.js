import Package from '../models/package.model.js';

/**
 * Repository para operaciones de Package
 */
export class PackageRepository {
  /**
   * Busca paquete por código
   */
  static async findByCode(code) {
    return await Package.findOne({ code });
  }

  /**
   * Crea un paquete
   */
  static async create(packageData) {
    return await Package.create(packageData);
  }

  /**
   * Upsert: crea o actualiza paquete por código
   */
  static async upsert(code, packageData) {
    const result = await Package.findOneAndUpdate(
      { code },
      packageData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return result;
  }

  /**
   * Upsert múltiple (bulk)
   */
  static async bulkUpsert(packages) {
    const bulkOps = packages.map(pkg => ({
      updateOne: {
        filter: { code: pkg.code },
        update: pkg,
        upsert: true
      }
    }));

    const result = await Package.bulkWrite(bulkOps);
    return {
      created: result.upsertedCount,
      updated: result.modifiedCount
    };
  }

  /**
   * Lista paquetes con filtros
   */
  static async list({ page = 1, limit = 20, search, state, location } = {}) {
    const query = {};
    
    if (search) {
      query.$or = [
        { code: new RegExp(search, 'i') },
        { productSku: new RegExp(search, 'i') }
      ];
    }
    
    if (state) {
      query.state = state;
    }
    
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      Package.find(query).skip(skip).limit(limit).lean(),
      Package.countDocuments(query)
    ]);

    return { items, total, page, limit };
  }

  /**
   * Busca paquete por ID
   */
  static async findById(id) {
    return await Package.findById(id);
  }
}

