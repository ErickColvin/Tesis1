import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    marketplaceOrderId: { type: String, required: true, index: true },
    producto: { type: String, required: true },
    sku: { type: String },
    cantidad: { type: Number, required: true, min: 1 },
    motivo: { type: String, required: true },
    estadoProducto: {
      type: String,
      enum: ['sin_abrir', 'sellado', 'usado', 'danado'],
      default: 'sin_abrir'
    },
    resultado: {
      type: String,
      enum: ['reingresado', 'para_revision', 'descartado'],
      default: 'para_revision'
    },
    comentarios: { type: String },
    customerEmail: { type: String },
    fechaRecoleccion: { type: Date },
    recibidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

returnSchema.index({ createdAt: -1 });

export default mongoose.models.Return || mongoose.model('Return', returnSchema);
