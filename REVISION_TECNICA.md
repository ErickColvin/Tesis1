# 📋 REVISIÓN TÉCNICA - TRACELINK

## 🗺️ MAPA DEL REPOSITORIO

```
TESIS1/
├── my-digital-platform/          # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx               # Router + JWT auth + route protection
│   │   ├── main.jsx              # Entry point
│   │   ├── services/
│   │   │   └── api.js            # Axios instance + setAuthToken
│   │   ├── context/
│   │   │   ├── DataContext.jsx   # Context definition
│   │   │   └── DataProvider.jsx  # Global state (products, alerts)
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Dashboard básico
│   │   │   ├── Login.jsx         # Auth UI mejorada
│   │   │   ├── Register.jsx      # Registro
│   │   │   ├── ImportExcel.jsx   # Upload de Excel
│   │   │   ├── DataTable.jsx     # Vista de productos
│   │   │   └── AdminDashboard.jsx # Admin panel
│   │   └── components/
│   │       └── Navbar.jsx        # Navegación
│   ├── vite.config.mjs           # ✅ Proxy /api → localhost:3001
│   ├── tailwind.config.js        # ✅ Configurado
│   └── package.json              # React 18, React Router 6, Axios, Tailwind
│
└── server/                       # Backend Express + MongoDB
    ├── index.js                  # Entry point + datos en memoria
    ├── controllers/
    │   ├── auth.controller.js    # Login/Register
    │   └── admin.controller.js   # List/Update users
    ├── models/
    │   └── user.model.js         # ✅ Schema User
    ├── middleware/
    │   └── auth.js               # JWT validation
    ├── routes/
    │   ├── auth.routes.js        # POST /login, /register
    │   └── admin.routes.js       # GET /users, PATCH /role
    └── package.json              # ✅ Express, Mongoose, JWT, Multer
```

## 📊 ENTRY POINTS

| Componente | Archivo | Puerto | Descripción |
|------------|---------|--------|-------------|
| Frontend | `src/main.jsx` | 3000 | React app con Vite |
| Backend | `server/index.js` | 3001 | Express + MongoDB |

## 🔍 DEPENDENCIAS CLAVE

### Frontend
- ✅ React 18.3, React Router 6
- ✅ Axios (instalado)
- ✅ Tailwind CSS + PostCSS
- ✅ Vite proxy configurado

### Backend
- ✅ Express 4.18
- ✅ Mongoose 8.19
- ✅ JWT, bcrypt
- ✅ Multer, ExcelJS
- ✅ CORS, dotenv

## ⚠️ GAP ANALYSIS vs ÉPICAS

### ❌ FALTANTES CRÍTICOS

#### Épica 1 - Importación .xlsx
- ❌ **Modelos**: products, packages, imports (no existen)
- ❌ **Archivo .env**: no existe
- ❌ **Endpoint POST /api/imports**: inexistente
- ❌ **Validación**: sin schema de validación
- ❌ **Upsert**: datos en memoria, no persistidos
- ❌ **Tests**: 0 tests
- ⚠️ **Endpoint temporal**: POST /api/upload existe pero usa memoria

#### Épica 2 - Alertas
- ❌ **Modelo Alert**: no existe
- ❌ **Índice status**: n/a
- ⚠️ Alertas en memoria temporal

#### Épica 3 - Trazabilidad
- ❌ **Modelo Package**: no existe
- ❌ **Modelo Event**: no existe
- ❌ **Endpoint PATCH /packages/:code/state**: no existe
- ❌ **Transiciones**: sin validación

#### Épica 4 - Búsqueda/Filtros
- ❌ **Paginación**: parcial (solo frontend)
- ❌ **Índices MongoDB**: no definidos
- ❌ **Validación rendimiento**: no hecha

#### Épica 5 - KPIs
- ❌ **Endpoint GET /api/kpis**: no existe
- ❌ **Funciones puras**: no hay cálculo de métricas

### ✅ EXISTENTE

- ✅ Auth flow completo (JWT + middleware)
- ✅ Proxy Vite funcional
- ✅ Estructura básica de rutas
- ✅ UI de Login mejorada
- ✅ Upload básico de Excel (memoria)
- ✅ Tailwind + dark theme

## 🎯 ARQUITECTURA REQUERIDA

```
controller → service → repository → mongoose model
```

**Ejemplo para imports:**
```
import.controller.js → imports.service.js → products.repository.js + Product model
                                    ↓
                            validación + upsert + import log
```

## 📝 ESTÁNDARES

- ✅ **Código**: Controller → Service → Repository
- ❌ **Tests**: falta configuración Jest + supertest
- ❌ **.env**: falta archivo de ejemplo
- ⚠️ **Documentación**: comentarios básicos
- ❌ **Seed scripts**: no hay

---

## 🚀 PRIMERA ENTREGA: ÉPICA 1

**Objetivo**: Migrar `/api/upload` temporal → `/api/imports` con persistencia MongoDB.

### Cambios Propuestos

1. ✅ Crear `.env.example`
2. Crear modelos: Product, Package, Import
3. Arquitectura: controller → service → repository
4. Endpoint POST /api/imports con validación
5. Test de integración básico

### Archivos a Crear/Modificar

```
server/
├── .env.example
├── .env
├── models/
│   ├── product.model.js      [NUEVO]
│   ├── package.model.js      [NUEVO]
│   └── import.model.js       [NUEVO]
├── controllers/
│   └── import.controller.js  [NUEVO]
├── services/
│   ├── import.service.js     [NUEVO]
│   └── validation.service.js [NUEVO]
├── repositories/
│   ├── product.repository.js [NUEVO]
│   └── package.repository.js [NUEVO]
├── routes/
│   └── import.routes.js      [NUEVO]
└── tests/
    └── import.test.js        [NUEVO]
```

### Validación Esperada

**Campos obligatorios por tipo:**

**Products:**
- `sku` (string, unique, indexed)
- `nombre` (string)
- `categoria` (string)
- `stock` (number ≥ 0)
- `minStock` (number ≥ 0, default: 10)
- `precioUnitario` (number ≥ 0)

**Packages:**
- `code` (string, unique, indexed)
- `productSku` (ref Product)
- `state` (enum: 'created'|'in_transit'|'delivered'|'rejected')
- `location` (string)
- `createdAt` (Date)

**Imports:**
- `fileName` (string)
- `rowsOk` (number)
- `rowsError` (number)
- `errors` ([string])
- `user` (ref User)
- `createdAt` (Date)

---

**Estado**: Listo para implementar Épica 1 con diffs.

