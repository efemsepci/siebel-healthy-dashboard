const { exec, execAsync } = require("../utils/execHelper");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getComponents(namespace) {
  const safeNs = namespace.replace(/[^a-zA-Z0-9-]/g, "");

  const srvrmgrCmd = `oc exec siebel-ses-0 -n ${safeNs} -- /bin/sh -c "cd /siebel/mde/siebsrvr/ && . ./siebenv.sh && srvrmgr /e ENT /g cgw-ent.turktelekom.com.tr:8888 /u SADMIN /p SADMIN /c 'list comp show SV_NAME,CC_ALIAS,CP_DISP_RUN_STATE'"`;

  return new Promise((resolve, reject) => {
    exec(
      srvrmgrCmd,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(stderr || error.message));
        }

        if (!stdout || stdout.trim() === "") {
          return resolve({
            warning: "stdout boş döndü",
            stderr,
          });
        }

        const lines = stdout
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        const components = lines
          .filter(
            (line) => !line.startsWith("SV_NAME") && !line.startsWith("---"),
          )
          .map((line) => {
            const parts = line.split(/\s+/);

            if (parts.length < 3) return null;

            const svName = parts[0];
            const alias = parts[1];
            const status = parts.slice(2).join(" ");

            return {
              svName,
              alias,
              status,
              raw: line,
            };
          })
          .filter(Boolean);

        resolve({
          count: components.length,
          components,
        });
      },
    );
  });
}

async function restartComponent(namespace, alias, status) {
  if (status !== "Online") {
    throw new Error(
      `Sadece Online durumundaki componentler restart edilebilir. Mevcut durum: ${status}`,
    );
  }

  const safeNs = namespace.replace(/[^a-zA-Z0-9-]/g, "");

  const safeAlias = alias.replace(/[^a-zA-Z0-9_]/g, "");

  const baseCmd = `oc exec siebel-ses-0 -n ${safeNs} -- /bin/sh -c "cd /siebel/mde/siebsrvr/ && . ./siebenv.sh && srvrmgr /e ENT /g cgw-ent.turktelekom.com.tr:8888 /u SADMIN /p SADMIN /c`;

  const killCmd = `${baseCmd} 'kill comp ${safeAlias}'"`;

  const startCmd = `${baseCmd} 'startup comp ${safeAlias}'"`;

  const killResult = await execAsync(killCmd, {
    maxBuffer: 1024 * 1024 * 10,
  });

  await wait(3000);

  const startResult = await execAsync(startCmd, {
    maxBuffer: 1024 * 1024 * 10,
  });

  return {
    success: true,
    message: `${safeAlias} başarıyla restart edildi`,
    killOutput: killResult.stdout,
    startOutput: startResult.stdout,
  };
}

async function run(cmd) {
  console.log(cmd);

  return await execAsync(cmd, {
    maxBuffer: 1024 * 1024 * 10,
  });
}

async function waitForReplicas(namespace, stsName, replicaCount) {
  while (true) {
    const { stdout } = await run(
      `oc get sts ${stsName} -n ${namespace} -o json`,
    );

    const data = JSON.parse(stdout);

    const ready = data.status.readyReplicas || 0;

    console.log(`${stsName} ReadyReplicas=${ready}`);

    if (ready === replicaCount) {
      break;
    }

    await wait(5000);
  }
}

async function restartEnvironment(namespace) {
  const safeNs = namespace.replace(/[^a-zA-Z0-9-]/g, "");

  console.log("===== ENVIRONMENT RESTART START =====");

  // SAI DOWN
  // await run(`oc scale sts siebel-sai --replicas=0 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-sai", 0);

  // SES DOWN
  // await run(`oc scale sts siebel-ses --replicas=0 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-ses", 0);

  // CGW DOWN
  // await run(`oc scale sts siebel-cgw --replicas=0 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-cgw", 0);

  console.log("Tüm StatefulSetler durduruldu.");

  // CGW UP
  // await run(`oc scale sts siebel-cgw --replicas=3 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-cgw", 3);

  // SES UP
  // await run(`oc scale sts siebel-ses --replicas=3 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-ses", 3);

  // SAI UP
  // await run(`oc scale sts siebel-sai --replicas=3 -n ${safeNs}`);
  await waitForReplicas(safeNs, "siebel-sai", 3);

  console.log("===== ENVIRONMENT RESTART FINISH =====");

  return {
    success: true,
    message: "Ortam başarıyla restart edildi.",
  };
}

module.exports = {
  getComponents,
  restartComponent,
  restartEnvironment,
};
