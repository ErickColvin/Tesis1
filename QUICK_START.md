# 🚀 QUICK START - TRACELINK

## Pre-requisitos

- Node.js 18+
- MongoDB (local o Docker)
- Git

## Instalación Rápida

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd TESIS1
```

### 2. Configurar MongoDB

**Opción A: Docker (recomendado)**
```bash
docker run -d -p 27017:27017 --name mongo mongo:latest
```

**Opción B: MongoDB local**
```bash
# Instalar MongoDB desde mongodb.com
# Iniciar servicio
mongod
```

### 3. Instalar dependencias

**Backend**
```bash
cd server
npm install
```

**Frontend**
```bash
cd ../my-digital-platform
npm install
```

### 4. Configurar variables de entorno

**Backend** (`server/.env`):
```bash
cd server
cp .env.example .env
# Editar .env si es necesario
```

Contenido mínimo:
```
MONGODB_URI=mongodb://localhost:27017/tracelink
PORT=3001
JWT_SECRET=dev_secret_key
CLIENT_ORIGIN=http://localhost:3000
```

### 5. Iniciar servicios

**Terminal 1 - Backend:**
```bash
cd server
npm start
# Esperar: "✅ MongoDB conectado a: mongodb://localhost:27017/tracelink"
# Esperar: "API escuchando en http://localhost:3001"
```

**Terminal 2 - Frontend:**
```bash
cd my-digital-platform
npm run dev
# Abrir navegador en http://localhost:3000
```

## ✅ Verificar instalación

### Backend health check
```bash
curl http://localhost:3001/api/health
# Debe retornar: {"ok":true}
```

### Frontend
Abrir navegador: `http://localhost:3000`
- Debe mostrar pantalla de login
- Registrarse o iniciar sesión

## 🧪 Ejecutar tests

```bash
cd server
npm test
```

Deberías ver:
```
 ✓ debería rechazar request sin archivo
 ✓ debería listar imports (inicialmente vacío)
 ✓ debería retornar 404 para ID inexistente
```

## 📤 Probar importación

Crear archivo Excel (`test-products.xlsx`):

| sku | nombre | categoria | stock | minStock | precioUnitario |
|-----|--------|-----------|-------|----------|----------------|
| SKU001 | Producto 1 | Categoría A | 100 | 10 | 25.50 |
| SKU002 | Producto 2 | Categoría B | 50 | 5 | 15.00 |

Luego:
```bash
curl -X POST http://localhost:3001/api/imports \
  -F "file=@test-products.xlsx" \
  -F "type=products"
```

Respuesta esperada:
```json
{
  "ok": true,
  "importId": "...",
  "summary": {
    "rowsOk": 2,
    "rowsError": 0,
    "productsCreated": 2,
    "productsUpdated": 0
  },
  "errors": []
}
```

## 🐛 Solución de problemas

### MongoDB no conecta
```bash
# Verificar que MongoDB está corriendo
docker ps | grep mongo
# O
ps aux | grep mongod

# Intentar reconectar
docker restart mongo
```

### Puerto 3001 ocupado
```bash
# Cambiar PORT en server/.env
PORT=3002
```

### Puerto 3000 ocupado
```bash
# Vite usará otro puerto automáticamente
# Verificar en terminal del frontend
```

### Dependencias no instaladas
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

## 📁 Estructura útil

```
TESIS1/
├── server/                    # Backend
│   ├── models/               # Schemas MongoDB
│   ├── controllers/          # Lógica de endpoints
│   ├── services/             # Validación y lógica
│   ├── repositories/         # Acceso a DB
│   ├── routes/               # Definición de rutas
│   ├── tests/                # Tests de integración
│   └── index.js              # Entry point
│
└── my-digital-platform/      # Frontend
    ├── src/
    │   ├── pages/            # Páginas principales
    │   ├── components/       # Componentes reutilizables
    │   ├── services/         # API client
    │   └── App.jsx           # Router y auth
    └── vite.config.mjs       # Proxy /api → 3001
```

## 📚 Documentación adicional

- `REVISION_TECNICA.md` - Análisis del repositorio
- `IMPLEMENTACION_EPICA1.md` - Detalles técnicos Épica 1
- `RESUMEN_ENTREGA.md` - Resumen ejecutivo

## 🆘 Ayuda

Si tienes problemas:
1. Verifica logs en ambos terminales (backend y frontend)
2. Verifica que MongoDB está corriendo
3. Revisa `.env` en server/
4. Ejecuta `npm install` en ambos directorios
5. Revisa `server/tests/import.test.js` para ejemplos de uso

