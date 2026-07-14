const { exec } = require('../utils/execHelper');

exports.getPods = (token, namespace) => {

  return new Promise((resolve, reject) => {

    const cmd =
      `oc get pods -n ${namespace} --token=${token} -o json`;

    exec(
      cmd,
      { maxBuffer: 1024 * 1024 * 10 },
      (err, stdout) => {

        if (err)
          return reject(new Error('Podlar alınamadı'));

        const data = JSON.parse(stdout);

        resolve(
          data.items.map(pod => ({
            name: pod.metadata.name,
            status: pod.status.phase
          }))
        );
      }
    );
  });
};