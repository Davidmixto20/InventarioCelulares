const db = require('../config/db');

const Equipo = {
    createTable: async () => {
        const query = `
            CREATE TABLE IF NOT EXISTS equipos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                marca VARCHAR(100),
                modelo VARCHAR(100),
                estado VARCHAR(50) DEFAULT 'disponible',
                prestado_a VARCHAR(255) NULL,
                tipo_documento ENUM('cedula', 'pasaporte') DEFAULT 'cedula',
                cedula_pasaporte VARCHAR(50) NULL,
                fecha_prestamo DATETIME NULL,
                fecha_devolucion DATE NULL,
                imagen TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `;
        await db.query(query);
        try {
            await db.query('ALTER TABLE equipos MODIFY id INT AUTO_INCREMENT;');
        } catch (e) { }

        try {
            await db.query("ALTER TABLE equipos ADD COLUMN cedula_pasaporte VARCHAR(50) NULL");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME' && error.errno !== 1060) {
                throw error;
            }
        }

        try {
            await db.query("ALTER TABLE equipos ADD COLUMN tipo_documento ENUM('cedula', 'pasaporte') DEFAULT 'cedula'");
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME' && error.errno !== 1060) {
                throw error;
            }
        }

        try {
            await db.query("ALTER TABLE equipos MODIFY COLUMN estado VARCHAR(50) DEFAULT 'disponible'");
        } catch (error) { }

        const queryHistorial = `
            CREATE TABLE IF NOT EXISTS historial_equipos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                equipo_id INT NOT NULL,
                accion ENUM('prestamo', 'devolucion', 'mantenimiento') NOT NULL,
                cliente VARCHAR(255) NULL,
                cedula_pasaporte VARCHAR(50) NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                observaciones TEXT NULL,
                FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;
        await db.query(queryHistorial);
    },

    findAll: async (filters = {}) => {
        let query = 'SELECT * FROM equipos WHERE 1=1';
        const params = [];

        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }

        if (filters.nombre) {
            query += ' AND (nombre LIKE ? OR prestado_a LIKE ? OR cedula_pasaporte LIKE ?)';
            params.push(`%${filters.nombre}%`, `%${filters.nombre}%`, `%${filters.nombre}%`);
        }

        if (filters.cedula_pasaporte) {
            query += ' AND cedula_pasaporte = ?';
            params.push(filters.cedula_pasaporte);
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
        const { nombre, marca, modelo, estado, prestado_a, tipo_documento, cedula_pasaporte, fecha_devolucion, imagen } = data;
        
        if (estado === 'prestado' && cedula_pasaporte) {
            const [countResult] = await db.query('SELECT COUNT(*) as count FROM equipos WHERE cedula_pasaporte = ? AND estado = "prestado"', [cedula_pasaporte]);
            if (countResult[0].count >= 5) {
                const error = new Error('El cliente ya tiene el límite máximo de 5 equipos prestados.');
                error.statusCode = 400;
                throw error;
            }
        }

        let fecha_prestamo = null;
        let fechaDev = null;
        if (estado === 'prestado') {
            fecha_prestamo = new Date();
            fechaDev = fecha_devolucion || null;
        }

        const query = `
            INSERT INTO equipos (nombre, marca, modelo, estado, prestado_a, tipo_documento, cedula_pasaporte, fecha_prestamo, fecha_devolucion, imagen) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [nombre, marca, modelo, estado || 'disponible', prestado_a || null, tipo_documento || 'cedula', cedula_pasaporte || null, fecha_prestamo, fechaDev, imagen || null]);
        
        if (estado === 'prestado') {
            await db.query('INSERT INTO historial_equipos (equipo_id, accion, cliente, cedula_pasaporte, observaciones) VALUES (?, ?, ?, ?, ?)', 
                [result.insertId, 'prestamo', prestado_a, cedula_pasaporte, 'Préstamo inicial']);
        }
        
        return result.insertId;
    },

    update: async (id, data) => {
        const { nombre, marca, modelo, estado, prestado_a, tipo_documento, cedula_pasaporte, fecha_devolucion, imagen, observaciones } = data;
        
        if (estado === 'prestado' && cedula_pasaporte) {
            const [countResult] = await db.query('SELECT COUNT(*) as count FROM equipos WHERE cedula_pasaporte = ? AND estado = "prestado" AND id != ?', [cedula_pasaporte, id]);
            if (countResult[0].count >= 5) {
                const error = new Error('El cliente ya tiene el límite máximo de 5 equipos prestados.');
                error.statusCode = 400;
                throw error;
            }
        }

        let fecha_prestamo = null;
        let fechaDev = null;
        if (estado === 'prestado' && prestado_a) {
            fecha_prestamo = new Date();
            fechaDev = fecha_devolucion || null;
        }

        const [current] = await db.query('SELECT estado FROM equipos WHERE id = ?', [id]);
        const previousState = current[0]?.estado;

        const query = `
            UPDATE equipos 
            SET nombre = ?, marca = ?, modelo = ?, estado = ?, prestado_a = ?, tipo_documento = ?, cedula_pasaporte = ?,
                fecha_prestamo = IF(? = 'prestado', COALESCE(fecha_prestamo, ?), NULL),
                fecha_devolucion = IF(? = 'prestado', ?, NULL),
                imagen = ?
            WHERE id = ?
        `;
        const [result] = await db.query(query, [
            nombre, 
            marca, 
            modelo, 
            estado, 
            estado === 'prestado' ? prestado_a : null, 
            estado === 'prestado' ? tipo_documento : 'cedula',
            estado === 'prestado' ? cedula_pasaporte : null,
            estado,
            fecha_prestamo,
            estado,
            fechaDev,
            imagen || null,
            id
        ]);
        
        if (previousState !== estado) {
            let accion = 'mantenimiento';
            if (estado === 'prestado') accion = 'prestamo';
            if (estado === 'disponible') accion = 'devolucion';
            
            await db.query('INSERT INTO historial_equipos (equipo_id, accion, cliente, cedula_pasaporte, observaciones) VALUES (?, ?, ?, ?, ?)', 
                [id, accion, prestado_a || null, cedula_pasaporte || null, observaciones || `Cambio de estado a ${estado}`]);
        }
        
        return result.affectedRows > 0;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM equipos WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    getDashboardStats: async () => {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN estado = 'prestado' THEN 1 ELSE 0 END) as prestados,
                SUM(CASE WHEN estado = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento
            FROM equipos
        `);
        
        const [mostBorrowed] = await db.query(`
            SELECT e.nombre, COUNT(h.id) as count 
            FROM historial_equipos h
            JOIN equipos e ON h.equipo_id = e.id
            WHERE h.accion = 'prestamo'
            GROUP BY e.id
            ORDER BY count DESC
            LIMIT 5
        `);
        
        return { stats: stats[0], mostBorrowed };
    },

    getHistorial: async (equipoId) => {
        const [rows] = await db.query('SELECT * FROM historial_equipos WHERE equipo_id = ? ORDER BY fecha DESC', [equipoId]);
        return rows;
    }
};

module.exports = Equipo;
