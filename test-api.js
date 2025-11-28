// Script para probar el endpoint de deliveries
import axios from 'axios';

const API_URL = 'http://localhost:3001';

console.log('🔍 Probando API...\n');

async function testAPI() {
  try {
    // Test 1: Health check
    console.log('1️⃣ Probando /api/health...');
    const health = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health:', health.data);
    console.log('');

    // Test 2: Deliveries endpoint
    console.log('2️⃣ Probando /api/deliveries...');
    const deliveries = await axios.get(`${API_URL}/api/deliveries`);
    console.log('✅ Deliveries response:');
    console.log('   Total:', deliveries.data.total);
    console.log('   Página:', deliveries.data.page);
    console.log('   Entregas:', deliveries.data.deliveries?.length || 0);
    
    if (deliveries.data.deliveries?.length > 0) {
      console.log('\n📦 Primera entrega:');
      console.log(JSON.stringify(deliveries.data.deliveries[0], null, 2));
    } else {
      console.log('⚠️  No hay entregas en la base de datos');
    }

    console.log('\n✅ API funcionando correctamente');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 El servidor no está corriendo en', API_URL);
      console.error('   Ejecuta: cd server && npm start');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testAPI();
