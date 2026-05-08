const db = require('../config/db');

const Equipo = {
    // Inicializar tabla si no existe
    createTable: async () => {
        const query = `
            CREATE TABLE IF NOT EXISTS equipos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                marca VARCHAR(100),
                modelo VARCHAR(100),
                estado ENUM('disponible', 'prestado') DEFAULT 'disponible',
                prestado_a VARCHAR(255) NULL,
                fecha_prestamo DATETIME NULL,
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
        const { nombre, marca, modelo, estado, prestado_a } = data;
        let fecha_prestamo = null;
        if (estado === 'prestado') {
            fecha_prestamo = new Date();
        }

        const query = `
            INSERT INTO equipos (nombre, marca, modelo, estado, prestado_a, fecha_prestamo) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [nombre, marca, modelo, estado || 'disponible', prestado_a || null, fecha_prestamo]);
        return result.insertId;
    },

    update: async (id, data) => {
        const { nombre, marca, modelo, estado, prestado_a } = data;
        let fecha_prestamo = null;
        if (estado === 'prestado' && prestado_a) {
            // si cambia a prestado actualizamos fecha
            fecha_prestamo = new Date();
        }

        const query = `
            UPDATE equipos 
            SET nombre = ?, marca = ?, modelo = ?, estado = ?, prestado_a = ?, fecha_prestamo = IF(? = 'prestado', COALESCE(fecha_prestamo, ?), NULL)
            WHERE id = ?
        `;
        const [result] = await db.query(query, [
            nombre, 
            marca, 
            modelo, 
            estado, 
            estado === 'prestado' ? prestado_a : null, 
            estado,
            fecha_prestamo,
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
