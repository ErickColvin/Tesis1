// Script de diagnóstico para verificar conexión
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracelink';

console.log('🔍 Verificando conexión a MongoDB...');
console.log('📍 URI (sin contraseña):', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ MongoDB conectado exitosamente');
    console.log('📊 Base de datos:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);
    
    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Colecciones disponibles:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Contar deliveries
    const Delivery = mongoose.connection.collection('deliveries');
    const count = await Delivery.countDocuments();
    console.log('\n📦 Deliveries en la base de datos:', count);
    
    if (count > 0) {
      const sample = await Delivery.findOne();
      console.log('\n🔍 Ejemplo de delivery:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    console.log('\n✅ Diagnóstico completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error conectando a MongoDB:');
    console.error('📝 Mensaje:', err.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que MONGODB_URI en .env sea correcto');
    console.error('   2. Verifica que la contraseña sea correcta');
    console.error('   3. Verifica que tu IP esté en la whitelist de MongoDB Atlas');
    console.error('   4. Verifica tu conexión a internet');
    process.exit(1);
  });
