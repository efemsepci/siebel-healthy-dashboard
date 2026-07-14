const siebelService = require('../service/siebelService');

exports.getComponents = async (req, res) => {
  try {

    const { namespace } = req.query;

    const result =
      await siebelService.getComponents(namespace);

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};

exports.restartComponent = async (req, res) => {
  try {

    const {
      namespace,
      alias,
      status
    } = req.body;

    const result =
      await siebelService.restartComponent(
        namespace,
        alias,
        status
      );

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};

exports.restartEnvironment = async (req, res) => {
  try {

    const { namespace } = req.body;

    const result =
      await siebelService.restartEnvironment(
        namespace
      );

    res.json(result);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};