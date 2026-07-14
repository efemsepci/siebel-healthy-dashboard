const { exec } = require('../utils/execHelper');

exports.getNamespaces = (token) => {
  return new Promise((resolve, reject) => {

    const cmd =
      `oc get projects -o json --token=${token}`;

    exec(
      cmd,
      { maxBuffer: 1024 * 1024 * 10 },
      (err, stdout) => {

        if (err)
          return reject(new Error('Projeler alınamadı'));

        const data = JSON.parse(stdout);

        resolve(
          data.items.map(p => ({
            id: p.metadata.name,
            name: p.metadata.name
          }))
        );
      }
    );
  });
};