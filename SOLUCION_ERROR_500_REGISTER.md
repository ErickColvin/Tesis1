# 🔧 SOLUCIÓN: Error 500 al Registrar Usuario

## ✅ CAMBIOS APLICADOS

He mejorado el manejo de errores para que muestre mensajes más específicos. Ahora deberías ver el error real en lugar de solo "Error 500".

## 🔍 PASOS PARA DIAGNOSTICAR

### 1. Verificar que el servidor esté corriendo

```bash
cd server
npm run dev
```

**Asegúrate de ver**:
```
✅ MongoDB conectado exitosamente
📍 Base de datos: tracelink
📊 Estado: Conectado
API escuchando en http://localhost:3001
```

### 2. Intentar registrar un usuario

Cuando hagas click en "Crear cuenta", **mira la terminal del servidor**. Deberías ver un mensaje de error específico como:

```
register error: [error details]
Error details: {
  name: '...',
  message: '...',
  code: ...
}
```

### 3. Errores comunes y soluciones

#### Error: "MongoDB no está conectado"
**Solución**: Verifica que MongoDB Atlas esté conectado. Revisa `server/.env` y asegúrate de que `MONGODB_URI` sea correcto.

#### Error: "ValidationError"
**Causa**: El modelo de usuario rechaza los datos
**Solución**: Verifica que email y password sean válidos

#### Error: "E11000 duplicate key"
**Causa**: El email ya existe
**Solución**: Usa un email diferente o inicia sesión

#### Error: "connection timeout"
**Causa**: MongoDB Atlas no responde
**Solución**: 
- Verifica Network Access en MongoDB Atlas
- Asegúrate de que el cluster esté activo (no pausado)

### 4. Verificar conexión directamente

```bash
curl http://localhost:3001/api/health
```

**Respuesta esperada**:
```json
{
  "ok": true,
  "mongodb": {
    "status": "connected",
    "connected": true
  }
}
```

Si `connected: false`, hay un problema con MongoDB.

### 5. Probar registro con curl

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

Esto te dará el error exacto en la terminal.

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Servidor corriendo (`npm run dev`)
- [ ] MongoDB conectado (ver logs del servidor)
- [ ] Health check responde `"connected": true`
- [ ] `/api/health` funciona correctamente
- [ ] Intenté registrar y vi el error específico en la terminal

## 🐛 SI SIGUE FALLANDO

**Compárteme**:
1. El mensaje exacto que aparece en la terminal del servidor cuando intentas registrar
2. La respuesta del endpoint `/api/health`
3. El email que estás intentando usar

Con esa información podré identificar el problema exacto.

## 💡 MEJORAS APLICADAS

1. ✅ Logs más detallados en el servidor
2. ✅ Mensajes de error más específicos
3. ✅ Verificación de conexión MongoDB antes de registrar
4. ✅ Manejo de errores de Mongoose mejorado
5. ✅ Frontend muestra errores más descriptivos

---

**Intenta registrar nuevamente y revisa la terminal del servidor para ver el error específico** 🔍

