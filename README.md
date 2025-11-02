# TRACELINK - Sistema de Trazabilidad Digital

## 📋 Descripción

Sistema completo de trazabilidad para productos y paquetes con:
- ✅ Importación masiva desde Excel
- ✅ Gestión de inventario en tiempo real
- ✅ Alertas automáticas de stock bajo
- ✅ Trazabilidad de estado de paquetes
- ✅ Dashboard de KPIs
- ✅ Autenticación JWT

## 🏗️ Arquitectura

**Frontend**: React + Vite + Tailwind CSS  
**Backend**: Express + MongoDB + Mongoose  
**Autenticación**: JWT + bcrypt

## 🚀 Quick Start

Ver `QUICK_START.md` para instrucciones completas.

```bash
# 1. Iniciar MongoDB
docker run -d -p 27017:27017 --name mongo mongo:latest

# 2. Iniciar backend
cd server
npm install
npm start

# 3. Iniciar frontend
cd my-digital-platform
npm install
npm run dev

# 4. Abrir navegador
# http://localhost:3000
```

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| `QUICK_START.md` | Guía de instalación y primeros pasos |
| `REVISION_TECNICA.md` | Análisis del repositorio y gap analysis |
| `IMPLEMENTACION_EPICA1.md` | Detalles técnicos de la importación |
| `RESUMEN_ENTREGA.md` | Resumen ejecutivo de la entrega |

## 🎯 Estado del Proyecto

### ✅ Implementado
- Épica 1: Importación .xlsx (backend completo)
- Sistema de autenticación JWT
- UI de login mejorada
- Tests de integración básicos
- Health check endpoint

### ⏸️ En progreso
- Migración del frontend a nuevo backend
- Alertas automáticas
- Trazabilidad de paquetes

### 📅 Pendiente
- KPIs dashboard
- Búsquedas avanzadas
- Reportes

## 🔗 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login

### Importación
- `POST /api/imports` - Importar Excel
- `GET /api/imports` - Listar imports
- `GET /api/imports/:id` - Detalle de import

### Administración
- `GET /api/admin/users` - Listar usuarios
- `PATCH /api/admin/users/:id/role` - Cambiar rol

### Health
- `GET /api/health` - Verificar estado

## 🧪 Tests

```bash
cd server
npm test
```

## 📝 Licencia

Proyecto de tesis - Uso educativo

## 🆘 Soporte

Para problemas o preguntas, revisa:
1. `QUICK_START.md` para problemas de instalación
2. Logs del servidor para errores de runtime
3. `server/tests/import.test.js` para ejemplos de uso

