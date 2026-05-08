# Inventario de Equipos Celulares Prestados

Este proyecto consiste en un sistema de gestión de inventario para registrar y controlar equipos celulares que se prestan. Está desarrollado utilizando una arquitectura moderna que separa el Frontend y el Backend en servicios independientes.

## Arquitectura

- **Backend:** Desarrollado con Node.js y Express. Se conecta a una base de datos MySQL (gestionada a través de Aiven) y expone una API REST con operaciones CRUD completas.
- **Frontend:** Desarrollado con HTML, CSS, JavaScript Vanilla y Bootstrap 5 para una interfaz responsiva, limpia y de una sola página (SPA).

## Requisitos Previos

- Node.js (v14 o superior)
- MySQL Server (Local o en Aiven)

## Configuración y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd InventarioEquipos
```

### 2. Configurar y Ejecutar el Backend
1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Crea un archivo `.env` en el directorio `backend` con el siguiente contenido (ajusta los valores según tu base de datos MySQL):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=inventario_equipos
   DB_PORT=3306
   PORT=3000
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
   *Nota: El servidor creará automáticamente la tabla `equipos` en tu base de datos si no existe.*

### 3. Ejecutar el Frontend
1. Navega al directorio del frontend:
   ```bash
   cd ../frontend
   ```
2. Puedes abrir el archivo `index.html` directamente en tu navegador o usar un servidor estático (como Live Server en VSCode o `npx serve`).

## Despliegue en Render

Para desplegar este proyecto en Render:

### Backend (Web Service)
1. Crea un nuevo **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Establece el **Root Directory** a `backend`.
4. El comando de build será: `npm install`
5. El comando de inicio será: `npm start`
6. Añade las variables de entorno (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) apuntando a tu base de datos en Aiven.

### Frontend (Static Site)
1. Crea un nuevo **Static Site**.
2. Conecta el mismo repositorio de GitHub.
3. Establece el **Root Directory** a `frontend` o configura el directorio de publicación a `frontend`.
4. En `frontend/js/app.js`, recuerda actualizar la constante `API_URL` con la URL del Web Service de Render de tu Backend antes de subir los cambios.

## Estructura de Endpoints de la API

- `GET /api/equipos` - Listar todos los equipos (Soporta query params `?nombre=` y `?estado=`)
- `GET /api/equipos/:id` - Obtener un equipo específico
- `POST /api/equipos` - Registrar un nuevo equipo
- `PUT /api/equipos/:id` - Actualizar información de un equipo
- `DELETE /api/equipos/:id` - Eliminar un equipo
