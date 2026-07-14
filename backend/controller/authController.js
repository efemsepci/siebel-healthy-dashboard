const authService = require('../service/authService');

exports.login = async (req, res) => {
  try {

    const { username, password, ortam } = req.body;

    const token = await authService.login(
      username,
      password,
      ortam
    );

    res.json({ token });

  } catch (err) {

    res.status(401).json({
      error: err.message
    });

  }
};