const express = require('express');
const router = express.Router();

const namespaceController =
  require('../controller/namespaceController');

router.get(
  '/namespaces',
  namespaceController.getNamespaces
);

module.exports = router;