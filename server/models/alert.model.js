// Modelo de alertas de stock asociadas a productos.
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  producto: { type: String, required: true }, // Nombre del producto
  productSku: { type: String, required: true, ref: 'Product' },
  stock: { type: Number, required: true },
  minStock: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'dismissed'], 
    default: 'active',
    required: true
  },
  mensaje: { type: String, required: true },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índice para filtrar alertas activas rápidamente
alertSchema.index({ status: 1 });

export default mongoose.models.Alert || mongoose.model('Alert', alertSchema);

