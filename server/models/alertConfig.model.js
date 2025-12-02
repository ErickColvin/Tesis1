// Modelo de configuracion global de alertas y destinatarios.
import mongoose from 'mongoose';

const alertConfigSchema = new mongoose.Schema(
  {
    stockThreshold: { type: Number, default: 10 },
    notifyStatuses: {
      type: [String],
      default: ['pendiente', 'en_preparacion', 'cancelado']
    },
    emailRecipients: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.models.AlertConfig || mongoose.model('AlertConfig', alertConfigSchema);
