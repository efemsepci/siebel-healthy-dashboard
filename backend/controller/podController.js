const podService = require('../service/podService');

exports.getPods = async (req, res) => {

  try {

    const token =
      req.headers.authorization?.replace(
        'Bearer ',
        ''
      );

    const namespace =
      req.query.namespace || 'default';

    const pods =
      await podService.getPods(
        token,
        namespace
      );

    res.json(pods);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};