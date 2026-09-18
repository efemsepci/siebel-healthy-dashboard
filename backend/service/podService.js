const { exec } = require("../utils/execHelper");

exports.getPods = (token, namespace) => {
  return new Promise((resolve, reject) => {
    const cmd = `oc get pods -n ${namespace} --token=${token} -o json`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) return reject(new Error("Podlar alınamadı"));

      const data = JSON.parse(stdout);

      resolve(
        data.items.map((pod) => ({
          name: pod.metadata.name,
          status: pod.status.phase || "Unknown",
          // A pod may contain more than one container; the dashboard needs
          // the total number of restarts across all of them.
          restarts: (pod.status.containerStatuses || []).reduce(
            (total, container) => total + (container.restartCount || 0),
            0,
          ),
        })),
      );
    });
  });
};
exports.getPodMetrics = (token, namespace) => {
  return new Promise((resolve, reject) => {
    const cmd = `oc adm top pods -n ${namespace} --token=${token} --no-headers`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) {
        return reject(new Error("Pod metrikleri alınamadı"));
      }

      const lines = stdout.trim().split("\n").filter(Boolean);

      const pods = lines.map((line) => {
        const parts = line.trim().split(/\s+/);

        return {
          name: parts[0],
          cpu: parts[1], // örn: 52m
          memory: parts[2], // örn: 384Mi
        };
      });

      resolve(pods);
    });
  });
};

exports.getNamespaceMetrics = (token, namespace) => {
  return new Promise((resolve, reject) => {
    const cmd = `oc adm top pods -n ${namespace} --token=${token} --no-headers`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) {
        return reject(new Error("Metrikler alınamadı"));
      }

      const lines = stdout.trim().split("\n").filter(Boolean);

      let totalCpu = 0;
      let totalMemory = 0;

      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);

        const cpu = parts[1];
        const memory = parts[2];

        if (cpu.endsWith("m")) {
          totalCpu += Number(cpu.replace("m", ""));
        }

        if (memory.endsWith("Mi")) {
          totalMemory += Number(memory.replace("Mi", ""));
        }
      });

      resolve({
        cpuMillicores: totalCpu,
        memoryMi: totalMemory,
        memoryGi: (totalMemory / 1024).toFixed(2),
      });
    });
  });
};
