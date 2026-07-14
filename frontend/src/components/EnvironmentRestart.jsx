import React, { useState, useEffect } from "react";
import { restartEnvironment } from "../services/environmentRestartService";
import { getNamespaces } from "../services/podsService";
import "../styles/environment-restart.css";

const EnvironmentRestart = ({ token }) => {
  const [environments, setEnvironments] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [messages, setMessages] = useState({});
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    try {
      const data = await getNamespaces(token);

      const allowedNamespaces = [
        "siebel-mobile-agl",
        "siebel-mobile-dev",
        "siebel-mobile-ent",
        "siebel-fixed-dev",
        "siebel-fixed-ent",
      ];

      const filteredNamespaces = data.filter((item) =>
        allowedNamespaces.includes(item.id),
      );

      setEnvironments(
        filteredNamespaces.map((item, index) => ({
          id: index + 1,
          name: item.name,
          namespace: item.id,
        })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestart = async (namespace, id, envName) => {
    if (
      !window.confirm(
        `${envName} için restart işlemini başlatmak istediğinize emin misiniz?`,
      )
    )
      return;

    setIsRestarting(true);
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    setMessages((prev) => ({
      ...prev,
      [id]: {
        text: "Restart işlemi başlatıldı, statefulsetler kontrol ediliyor...",
        type: "info",
      },
    }));
    try {
      const response = await restartEnvironment(namespace);
      const data = await response.json();
      if (response.ok && data.success)
        setMessages((prev) => ({
          ...prev,
          [id]: {
            text: data.message || "Ortam başarıyla restart edildi.",
            type: "success",
          },
        }));
      else
        setMessages((prev) => ({
          ...prev,
          [id]: {
            text: `Hata: ${data.error || "Bir sorun oluştu."}`,
            type: "error",
          },
        }));
    } catch (error) {
      setMessages((prev) => ({
        ...prev,
        [id]: { text: `Bağlantı Hatası: ${error.message}`, type: "error" },
      }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
      setIsRestarting(false);
    }
  };
  return (
    <div className="environment-restart">
      <h2 className="environment-restart-title">Ortam Restart Paneli</h2>
      <p className="environment-restart-subtitle">
        Aşağıdaki listeden restart etmek istediğiniz ortamı seçip butona
        tıklayınız.
      </p>
      <div className="environment-restart-list">
        {environments.map((env) => {
          const isLoading = loadingStates[env.id];
          const status = messages[env.id];
          return (
            <div key={env.id} className="environment-restart-row">
              <div className="environment-restart-info">
                <span className="environment-restart-name">{env.name}</span>
              </div>
              <div className="environment-restart-action">
                <button
                  className={
                    isRestarting
                      ? "environment-restart-button environment-restart-button-disabled"
                      : "environment-restart-button"
                  }
                  disabled={isRestarting}
                  onClick={() => handleRestart(env.namespace, env.id, env.name)}
                >
                  {isLoading ? "Restart Ediliyor..." : "Restart"}
                </button>
              </div>
              {status && (
                <div
                  className={`environment-restart-status environment-restart-status-${status.type}`}
                >
                  {status.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default EnvironmentRestart;
