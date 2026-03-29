const express = require('express');
const { createUser, listUsers, updateUser, sendPassword } = require('./user.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', listUsers);
router.post('/', requireRole(['admin']), createUser);
router.post('/:id/send-password', requireRole(['admin']), sendPassword);
router.put('/:id', requireRole(['admin']), updateUser);

module.exports = router;
