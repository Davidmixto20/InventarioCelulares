const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equipos.controller');
const { validateEquipo } = require('../middlewares/validate.middleware');

router.get('/', equiposController.getAll);
router.get('/stats/dashboard', equiposController.getDashboardStats);
router.get('/:id', equiposController.getById);
router.get('/:id/historial', equiposController.getHistorial);

router.post('/', validateEquipo, equiposController.create);

router.put('/:id', validateEquipo, equiposController.update);

router.delete('/:id', equiposController.delete);

module.exports = router;
