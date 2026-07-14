export const getNamespaces = async (token) => {
  const response = await fetch(`/api/namespaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const getComponents = async (namespace, token) => {
  const response = await fetch(
    `/api/siebel/components?namespace=${namespace}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    },
  );
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json"))
    throw new Error("Sunucudan JSON yerine geÃ§ersiz bir yanÄ±t dÃ¶ndÃ¼");
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "BileÅŸenler alÄ±namadÄ±");
  return data;
};

export const restartComponent = async (namespace, alias, status) => {
  const response = await fetch(`/api/siebel/components/restart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ namespace, alias, status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Restart baÅŸarÄ±sÄ±z");
  return data;
};
