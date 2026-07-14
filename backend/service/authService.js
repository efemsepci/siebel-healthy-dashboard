const { exec } = require('../utils/execHelper');

exports.login = (username, password, ortam) => {
  return new Promise((resolve, reject) => {

    const safeUser = username.replace(/[^a-zA-Z0-9]/g, '');
    const safePass = password.replace(/[`$\\]/g, '');

    const loginCmd =
      `oc login -u ${safeUser} -p ${safePass} https://api.${ortam}.paas.turktelekom.intra:6443 --insecure-skip-tls-verify`;

    exec(loginCmd, (err) => {
      if (err) return reject(new Error('Login failed'));

      exec('oc whoami -t', (err2, token) => {
        if (err2) return reject(new Error('Token alınamadı'));

        resolve(token.trim());
      });
    });
  });
};