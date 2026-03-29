const express = require('express');
const { registerCompany, login, refresh } = require('./auth.controller');

const router = express.Router();

router.post('/register-company', registerCompany);
router.post('/login', login);
router.post('/refresh', refresh);

module.exports = router;
