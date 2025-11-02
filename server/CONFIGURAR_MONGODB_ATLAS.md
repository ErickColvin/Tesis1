# 🔧 CONFIGURAR MONGODB ATLAS

## 📋 PASOS PARA CONFIGURAR TU CONEXIÓN

### 1. Obtener tu contraseña de MongoDB Atlas

Si no recuerdas tu contraseña:
1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Inicia sesión con tu cuenta
3. Ve a **Database Access** → **Database Users**
4. Si necesitas cambiar la contraseña, haz click en el usuario y **Edit**

### 2. Configurar Network Access (IMPORTANTE)

Para que tu aplicación pueda conectar:

1. Ve a **Network Access** en MongoDB Atlas
2. Click en **Add IP Address**
3. Opciones:
   - **Allow Access from Anywhere**: `0.0.0.0/0` (para desarrollo)
   - **O tu IP específica**: Tu IP pública actual

### 3. Crear archivo .env

En la carpeta `server/`, crea un archivo `.env`:

```bash
# Copiar el ejemplo
cp .env.example .env
```

O crea manualmente `server/.env` con:

```env
# MongoDB Atlas
# Reemplaza <db_password> con tu contraseña REAL
MONGODB_URI=mongodb+srv://<usuario>:<clave>@cluster0.mzx7obb.mongodb.net/tracelink?retryWrites=true&w=majority

# Server
PORT=3001

# JWT
JWT_SECRET=tu_secret_key_segura_aqui

# CORS
CLIENT_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
```

### 4. Ejemplo de URI completa

```
mongodb+srv://<usuario>:<clave>@cluster0.mzx7obb.mongodb.net/tracelink?retryWrites=true&w=majority
```

**Componentes**:
- `Erick_Colvin`: Tu usuario
- `<clave>`: Tu contraseña (reemplazar)
- `cluster0.mzx7obb.mongodb.net`: Tu cluster
- `tracelink`: Nombre de la base de datos

### 5. Verificar conexión

```bash
cd server
npm start
```

**Si conecta correctamente verás**:
```
✅ MongoDB conectado exitosamente
📍 Base de datos: tracelink
🔗 Host: cluster0-shard-00-00.mzx7obb.mongodb.net
📊 Estado: Conectado
```

**Si hay error**:
```
❌ Error conectando MongoDB:
💡 Verifica:
   1. Que MONGODB_URI en .env sea correcto
   2. Que la contraseña sea correcta
   3. Que tu IP esté en la whitelist de MongoDB Atlas
   4. Que la red permita conexiones a MongoDB Atlas
```

### 6. Probar con Health Check

```bash
curl http://localhost:3001/api/health
```

**Respuesta esperada**:
```json
{
  "ok": true,
  "mongodb": {
    "status": "connected",
    "connected": true,
    "database": "tracelink",
    "host": "cluster0-shard-00-00.mzx7obb.mongodb.net"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## ⚠️ TROUBLESHOOTING

### Error: "Authentication failed"
- Verifica que la contraseña en `.env` sea correcta
- Verifica que el usuario existe en MongoDB Atlas

### Error: "Timeout"
- Verifica Network Access en MongoDB Atlas
- Agrega `0.0.0.0/0` temporalmente para desarrollo

### Error: "MongoNetworkError"
- Verifica tu conexión a Internet
- Verifica que MongoDB Atlas esté activo
- Revisa el estado del cluster en Atlas

### Error: "MongoServerSelectionError"
- El cluster puede estar pausado (gratis se pausa después de inactividad)
- Ve a MongoDB Atlas y "Resume" el cluster

## 🔒 SEGURIDAD

- ✅ **NUNCA** subas `.env` a Git
- ✅ Usa contraseñas fuertes
- ✅ En producción, restringe IPs en Network Access
- ✅ Rota tu JWT_SECRET regularmente

## 📝 NOTAS

- El nombre de la base de datos puede ser diferente a `tracelink`
- Puedes cambiarlo en la URI: `...mongodb.net/TU_DB_NAME?retryWrites...`
- Si usas MongoDB local, la URI es: `mongodb://localhost:27017/tracelink`

