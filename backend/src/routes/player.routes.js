const router = require('express').Router();
const ctrl = require('../controllers/player.controller');
const auth = require('../middleware/auth');

router.get('/',       auth, ctrl.getAll);
router.get('/filters', auth, ctrl.getFilters);
router.get('/:id',    auth, ctrl.getOne);
router.post('/',      auth, ctrl.create);
router.put('/:id',    auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
