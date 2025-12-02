// Eventos de auditoria para paquetes y productos.
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  ref: { type: String, required: true, index: true }, // Package code or Product SKU
  type: { 
    type: String, 
    enum: ['package_state_change', 'stock_update', 'product_created'], 
    required: true 
  },
  from: { type: String }, // Estado/valor anterior
  to: { type: String }, // Estado/valor nuevo
  location: { type: String, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Índice compuesto para búsquedas de timeline
eventSchema.index({ ref: 1, createdAt: -1 });

export default mongoose.models.Event || mongoose.model('Event', eventSchema);

