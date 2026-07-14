export const restartEnvironment = (namespace) =>
  fetch(`/api/siebel/environment/restart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ namespace }),
  });
