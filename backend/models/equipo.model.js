const db = require('../config/db');

const Equipo = {
    createTable: async () => {
        const query = `
            CREATE TABLE IF NOT EXISTS equipos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                marca VARCHAR(100),
                modelo VARCHAR(100),
                imagen TEXT,
                estado ENUM('disponible', 'prestado') DEFAULT 'disponible',
                prestado_a VARCHAR(255) NULL,
                fecha_prestamo DATETIME NULL,
                fecha_devolucion DATE NULL,
                imagen TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
    },

    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM equipos WHERE 1=1';
        const params = [];

        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }

        if (filters.nombre) {
            query += ' AND nombre LIKE ?';
            params.push(`%${filters.nombre}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM equipos WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (data) => {
<<<<<<< HEAD
        const { nombre, marca, modelo, imagen, estado, prestado_a, fecha_devolucion } = data;
=======
        const { nombre, marca, modelo, estado, prestado_a, fecha_devolucion, imagen } = data;
>>>>>>> 8ae7967ac57e7afd383e520ae1c1a5be7083080c
        let fecha_prestamo = null;
        let fechaDev = null;
        if (estado === 'prestado') {
            fecha_prestamo = new Date();
            fechaDev = fecha_devolucion || null;
        }

        const query = `
<<<<<<< HEAD
            INSERT INTO equipos (nombre, marca, modelo, imagen, estado, prestado_a, fecha_prestamo, fecha_devolucion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            nombre, 
            marca, 
            modelo, 
            imagen || null, 
            estado || 'disponible', 
            prestado_a || null, 
            fecha_prestamo, 
            fechaDev
        ]);
=======
            INSERT INTO equipos (nombre, marca, modelo, estado, prestado_a, fecha_prestamo, fecha_devolucion, imagen) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [nombre, marca, modelo, estado || 'disponible', prestado_a || null, fecha_prestamo, fechaDev, imagen || null]);
>>>>>>> 8ae7967ac57e7afd383e520ae1c1a5be7083080c
        return result.insertId;
    },

    update: async (id, data) => {
<<<<<<< HEAD
        const { nombre, marca, modelo, imagen, estado, prestado_a, fecha_devolucion } = data;
=======
        const { nombre, marca, modelo, estado, prestado_a, fecha_devolucion, imagen } = data;
>>>>>>> 8ae7967ac57e7afd383e520ae1c1a5be7083080c
        let fecha_prestamo = null;
        let fechaDev = null;
        if (estado === 'prestado' && prestado_a) {
            fecha_prestamo = new Date();
            fechaDev = fecha_devolucion || null;
        }

        const query = `
            UPDATE equipos 
            SET nombre = ?, marca = ?, modelo = ?, imagen = ?, estado = ?, prestado_a = ?, 
                fecha_prestamo = IF(? = 'prestado', COALESCE(fecha_prestamo, ?), NULL),
                fecha_devolucion = IF(? = 'prestado', ?, NULL),
                imagen = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [
            nombre, 
            marca, 
            modelo, 
            imagen || null,
            estado, 
            estado === 'prestado' ? prestado_a : null, 
            estado,
            fecha_prestamo,
            estado,
            fechaDev,
            imagen || null,
            id
        ]);
        return result.affectedRows > 0;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM equipos WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Equipo;