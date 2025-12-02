// Paquetes individuales asociados a productos y su estado logistico.
import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  productSku: { type: String, required: true, ref: 'Product', trim: true },
  state: { 
    type: String, 
    enum: ['created', 'in_transit', 'delivered', 'rejected'], 
    default: 'created',
    required: true
  },
  location: { type: String, trim: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.models.Package || mongoose.model('Package', packageSchema);

