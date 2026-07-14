const namespaceService = require('../service/namespaceService');

exports.getNamespaces = async (req, res) => {

  try {

    const token = req.headers.authorization?.replace(
      'Bearer ',
      ''
    );

    const namespaces =
      await namespaceService.getNamespaces(token);

    res.json(namespaces);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
};