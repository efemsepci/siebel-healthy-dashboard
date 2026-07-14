export const getNamespaces = async (token) => {
  const response = await fetch(`/api/namespaces`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Namespace listesi alınamadı");
  }

  return response.json();
};

export const getPods = async (namespace, token) => {
  const response = await fetch(`/api/pods?namespace=${namespace}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Pod listesi alınamadı");
  }

  return response.json();
};
