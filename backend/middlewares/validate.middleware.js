exports.validateEquipo = (req, res, next) => {
    const { nombre, estado, prestado_a, fecha_devolucion } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ message: 'El campo nombre es obligatorio' });
    }

    if (estado && !['disponible', 'prestado'].includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser disponible o prestado' });
    }

    if (estado === 'prestado') {
        if (!prestado_a || prestado_a.trim() === '') {
            return res.status(400).json({ message: 'Debe indicar a quién se presta el equipo' });
        }
        if (!fecha_devolucion || fecha_devolucion.trim() === '') {
            return res.status(400).json({ message: 'Debe indicar la fecha límite de devolución' });
        }
    }

    next();
};
