import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, index: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  categoria: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  minStock: { type: Number, required: true, min: 0, default: 10 },
  precioUnitario: { type: Number, required: true, min: 0, default: 0 }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);

