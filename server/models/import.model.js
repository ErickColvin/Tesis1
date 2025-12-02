// Registro historico de importaciones con conteos y errores.
import mongoose from 'mongoose';

const importSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  rowsTotal: { type: Number, required: true, default: 0 },
  rowsOk: { type: Number, required: true, default: 0 },
  rowsError: { type: Number, required: true, default: 0 },
  importErrors: [{ 
    row: Number, 
    field: String, 
    message: String 
  }],
  productsCreated: { type: Number, default: 0 },
  productsUpdated: { type: Number, default: 0 },
  packagesCreated: { type: Number, default: 0 },
  packagesUpdated: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, suppressReservedKeysWarning: true });

export default mongoose.models.Import || mongoose.model('Import', importSchema);
