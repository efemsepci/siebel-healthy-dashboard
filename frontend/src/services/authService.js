export const login = (username, password, ortam) =>
  fetch(`/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, ortam }),
  });
