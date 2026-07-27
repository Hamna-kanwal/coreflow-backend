const express = require('express');
const router = express.Router();
const liveController = require('../controller/liveController');
const { isAuthenticated} = require("../middleware/isAuthenticated");


router.post('/start', isAuthenticated, liveController.startLive);
router.post('/end', isAuthenticated, liveController.endLive);
router.get('/active', liveController.getActiveLives);

module.exports = router;