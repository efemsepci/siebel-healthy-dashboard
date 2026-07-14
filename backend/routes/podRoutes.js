const express = require('express');
const router = express.Router();

const podController =
  require('../controller/podController');

router.get('/pods', podController.getPods);

module.exports = router;