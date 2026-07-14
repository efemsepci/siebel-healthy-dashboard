const express = require('express');
const router = express.Router();

const siebelController =
  require('../controller/siebelController');

router.get(
  '/siebel/components',
  siebelController.getComponents
);

router.post(
  '/siebel/components/restart',
  siebelController.restartComponent
);

router.post(
  '/siebel/environment/restart',
  siebelController.restartEnvironment
);

module.exports = router;