const express = require("express");
const router = express.Router();

const podController = require("../controller/podController");

router.get("/pods", podController.getPods);

router.get("/pods/metrics", podController.getNamespaceMetrics);

module.exports = router;
