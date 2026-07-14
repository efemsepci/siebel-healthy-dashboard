import React, { useEffect, useMemo, useState } from "react";
import "../styles/component-list.css";

import {
  getNamespaces,
  getComponents,
  restartComponent,
} from "../services/componentService";

const ComponentList = ({ token }) => {
  const [namespaces, setNamespaces] = useState([]);
  const [currentNS, setCurrentNS] = useState("");
  const [components, setComponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restartingComponents, setRestartingComponents] = useState({});
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (!token) return;

    loadNamespaces();
  }, [token]);

  const loadNamespaces = async () => {
    try {
      const data = await getNamespaces(token);

      if (Array.isArray(data)) {
        setNamespaces(data);
      }
    } catch {
      setError("Projeler yüklenemedi.");
    }
  };

  const handleNSChange = (namespace) => {
    setCurrentNS(namespace);
    setComponents([]);
    setSearchTerm("");
  };

  const fetchComponents = async () => {
    if (!currentNS) return;

    setLoading(true);
    setError("");
    setComponents([]);

    try {
      const data = await getComponents(currentNS, token);

      const allowedAliases = ["SES0", "SES1", "SES2"];

      const filteredComponents = data.components
        .filter((component) => allowedAliases.includes(component.svName))
        .map((component) => ({
          alias: component.svName,
          name: component.alias,
          status: component.status,
        }));

      setComponents(filteredComponents);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredComponents = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return components;
    }

    return components.filter((component) =>
      component.name?.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [components, searchTerm]);

  const handleRestart = async (alias, status) => {
    if (!currentNS) return;

    if (status !== "Online") {
      alert(`Bu component restart edilemez. Durum: ${status}`);
      return;
    }

    const confirmed = window.confirm(
      `Component (${alias}) restart edilecek. Devam etmek istiyor musunuz?`,
    );

    if (!confirmed) return;

    setRestartingComponents((prev) => ({
      ...prev,
      [alias]: true,
    }));

    setError("");

    try {
      await restartComponent(currentNS, alias, status);

      alert(`${alias} başarıyla restart edildi ✅`);

      await fetchComponents();
    } catch (err) {
      console.error(err);
      setError(err.message || "Bir hata oluştu");
    } finally {
      setRestartingComponents((prev) => ({
        ...prev,
        [alias]: false,
      }));
    }
  };

  const getBadgeClass = (status) =>
    status === "Online" || status === "Running"
      ? "status-online"
      : "status-offline";

  return (
    <div className="component-list-container">
      <h2 className="component-list-title">⚙ Siebel Component Manager</h2>

      <div className="component-list-filter-bar">
        <div className="component-list-group">
          <label className="component-list-label">PROJE</label>

          <select
            className="component-list-select"
            value={currentNS}
            onChange={(event) => handleNSChange(event.target.value)}
          >
            <option value="">-- Proje Seçin --</option>

            {namespaces.map((namespace) => (
              <option key={namespace.id} value={namespace.id}>
                {namespace.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="component-list-search-btn"
          onClick={fetchComponents}
          disabled={loading}
        >
          {loading ? "Sorgulanıyor..." : "Bileşenleri Getir"}
        </button>

        <div className="component-list-group">
          <label className="component-list-label">COMPONENT ARA</label>

          <input
            type="search"
            className="component-list-search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Component adı..."
          />
        </div>
      </div>

      {error && <div className="component-list-error">{error}</div>}

      <div className="component-list-card">
        <table className="component-list-table">
          <thead>
            <tr className="component-list-thead">
              <th className="pod-column">POD</th>
              <th className="name-column">Component Name</th>
              <th className="status-column">Status</th>
              <th className="restart-column">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredComponents.map((component, index) => {
              const isRestarting = restartingComponents[component.name];

              return (
                <tr key={index} className="component-list-row">
                  <td className="component-list-td-bold">{component.alias}</td>

                  <td className="component-list-td">{component.name}</td>

                  <td className="component-list-td-center">
                    <span
                      className={`status-badge ${getBadgeClass(
                        component.status,
                      )}`}
                    >
                      {component.status}
                    </span>
                  </td>

                  <td className="component-list-td-center">
                    <div className="action-menu">
                      <button
                        className="action-menu-button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === component.name ? null : component.name,
                          )
                        }
                        disabled={isRestarting}
                      >
                        ⋮
                      </button>

                      {openMenu === component.name && (
                        <div className="action-menu-dropdown">
                          <button
                            className="action-menu-item"
                            onClick={() => {
                              setOpenMenu(null);

                              handleRestart(component.name, component.status);
                            }}
                            disabled={
                              isRestarting || component.status !== "Online"
                            }
                          >
                            Restart
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredComponents.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="component-list-empty">
                  {searchTerm
                    ? "Aramanıza uygun component bulunamadı."
                    : "Seçim yapıp sorgulamayı başlatın."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComponentList;
