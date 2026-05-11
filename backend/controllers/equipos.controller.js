const Equipo = require('../models/equipo.model');
const googleIt = require('google-it');

Equipo.createTable().catch(console.error);

async function obtenerImagen(modelo) {
    try {
        const results = await googleIt({ 
            'query': `${modelo} phone png transparent`,
            'limit': 5,
            'only-urls': true 
        });
        return results[0] || 'https://via.placeholder.com/150'; 
    } catch (error) {
        return 'https://via.placeholder.com/150';
    }
}

exports.getAll = async (req, res, next) => {
    try {
        const { estado, nombre } = req.query;
        const equipos = await Equipo.findAll({ estado, nombre });
        res.status(200).json(equipos);
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const equipo = await Equipo.findById(id);
        
        if (!equipo) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }
        
        res.status(200).json(equipo);
    } catch (error) {
        next(error);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { nombre, marca } = req.body;
        
        const imagenUrl = await obtenerImagen(`${marca} ${nombre}`);
        
        const datosConImagen = {
            ...req.body,
            imagen: imagenUrl
        };

        const insertId = await Equipo.create(datosConImagen);
        const nuevoEquipo = await Equipo.findById(insertId);
        
        res.status(201).json({
            message: 'Equipo creado exitosamente',
            data: nuevoEquipo
        });
    } catch (error) {
        next(error);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const actualizado = await Equipo.update(id, req.body);
        
        if (!actualizado) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }
        
        const equipoActualizado = await Equipo.findById(id);
        res.status(200).json({
            message: 'Equipo actualizado exitosamente',
            data: equipoActualizado
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const eliminado = await Equipo.delete(id);
        
        if (!eliminado) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }
        
        res.status(200).json({ message: 'Equipo eliminado exitosamente' });
    } catch (error) {
        next(error);
    }
};