const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equipos.controller');
const { validateEquipo } = require('../middlewares/validate.middleware');

// GET /api/equipos
router.get('/', equiposController.getAll);

// GET /api/equipos/:id
router.get('/:id', equiposController.getById);

// POST /api/equipos
router.post('/', validateEquipo, equiposController.create);

// PUT /api/equipos/:id
router.put('/:id', validateEquipo, equiposController.update);

// DELETE /api/equipos/:id
router.delete('/:id', equiposController.delete);

module.exports = router;
