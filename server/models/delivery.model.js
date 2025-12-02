// Modelo de entregas/shipments para trazabilidad.
import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true }, // ID único del delivery
  nombrePersona: { type: String, required: true, trim: true },
  nombreProductos: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true, min: 1 },
  status: { 
    type: String, 
    enum: ['pendiente', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'], 
    default: 'pendiente',
    required: true,
    index: true
  },
  direccion: { type: String, required: true, trim: true },
  fechaEntregaEstimada: { type: Date, required: true },
  notas: { type: String, trim: true },
  plataforma: { 
    type: String, 
    enum: ['delivery', 'mercadolibre', 'otro'], 
    default: 'delivery' 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índice para búsquedas rápidas por status
deliverySchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);




