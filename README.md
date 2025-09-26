# Cat Breeds Backend - Node.js

Backend API desarrollado en Node.js con Express, MongoDB y JWT para gestión de razas de gatos.

## 🌐 API en Producción

**🔗 [https://cats-api.freeloz.com/api-docs](https://cats-api.freeloz.com/api-docs)**

## 🚀 Endpoints

### Autenticación
- `POST /api/users/register` - Registrar usuario
- `POST /api/users/login` - Iniciar sesión

### Razas (🔐 Requiere Bearer token)
- `GET /api/breeds` - Listar todas las razas
- `GET /api/breeds/:id` - Obtener raza específica  
- `GET /api/breeds/search?q=persian` - Buscar razas

### Imágenes (🔐 Requiere Bearer token)
- `GET /api/images?breed_id=abys` - Imágenes por raza

## ⚡ Características

- ✅ Clean Architecture (SOLID)
- ✅ JWT Authentication
- ✅ MongoDB integration
- ✅ TheCatAPI client
- ✅ Swagger documentation
- ✅ Error handling middleware
- ✅ Pruebas unitarias

## 🛠️ Tecnologías

- Node.js 18
- Express.js
- TypeScript
- MongoDB + Mongoose
- JWT
- Swagger
- Jest

## 🚀 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar pruebas
npm test
```

## 🐳 Docker

```bash
# Build imagen
docker build -t cats-backend .

# Ejecutar contenedor
docker run -p 3000:3000 cats-backend
```

---
*Backend - XpertGroup Prueba Técnica*