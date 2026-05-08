exports.validateEquipo = (req, res, next) => {
    const { nombre, estado } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ message: 'El campo nombre es obligatorio' });
    }

    if (estado && !['disponible', 'prestado'].includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser disponible o prestado' });
    }

    if (estado === 'prestado' && (!req.body.prestado_a || req.body.prestado_a.trim() === '')) {
        return res.status(400).json({ message: 'Debe indicar a quién se presta el equipo' });
    }

    next();
};
