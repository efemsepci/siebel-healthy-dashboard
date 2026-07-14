import React, { useState } from "react";
import PodsDashboard from "../components/PodsDashboard";
import ComponentList from "../components/ComponentList";
import EnvironmentLinks from "../components/EnvironmentLinks";
import EnvironmentRestart from "../components/EnvironmentRestart";
import "../styles/main-layout.css";

const MainLayout = ({ token, ortam, username, setToken }) => {
  const [activeMenu, setActiveMenu] = useState("pods");
  const [selectedPod, setSelectedPod] = useState(null);
  const selectMenu = (menu) => {
    setActiveMenu(menu);
    setSelectedPod(null);
  };
  return (
    <div className="main-layout">
      <aside className="main-sidebar">
        <div className="main-brand">
          <div className="main-logo">S</div>
          <span className="main-brand-text">
            SIEBEL <span className="main-brand-highlight">HEALTHY</span>
          </span>
        </div>
        <nav className="main-nav">
          <div
            className={
              activeMenu === "pods"
                ? "main-nav-item main-nav-item-active"
                : "main-nav-item"
            }
            onClick={() => selectMenu("pods")}
          >
            ⬢ Pod Statüsü
          </div>
          <div
            className={
              activeMenu === "components"
                ? "main-nav-item main-nav-item-active"
                : "main-nav-item"
            }
            onClick={() => selectMenu("components")}
          >
            ⚙ Component Listesi
          </div>
          <div
            className={
              activeMenu === "environment-links"
                ? "main-nav-item main-nav-item-active"
                : "main-nav-item"
            }
            onClick={() => selectMenu("environment-links")}
          >
            🔗 Ortam Linkleri
          </div>
          <div
            className={
              activeMenu === "environment-restart"
                ? "main-nav-item main-nav-item-active"
                : "main-nav-item"
            }
            onClick={() => selectMenu("environment-restart")}
          >
            🔄 Ortam Restart
          </div>
        </nav>
        <div className="main-footer">
          <div className="main-user">
            <div className="main-user-dot" />
            <span>{username}</span>
          </div>
          <button onClick={() => setToken(null)} className="main-logout">
            Oturumu Kapat
          </button>
        </div>
      </aside>
      <main className="main-content">
        {activeMenu === "pods" ? (
          selectedPod ? (
            <PodDetail pod={selectedPod} onBack={() => setSelectedPod(null)} />
          ) : (
            <PodsDashboard token={token} onSelectPod={setSelectedPod} />
          )
        ) : activeMenu === "components" ? (
          <ComponentList token={token} />
        ) : activeMenu === "environment-links" ? (
          <EnvironmentLinks token={token} ortam={ortam} />
        ) : (
          <EnvironmentRestart token={token} />
        )}
      </main>
    </div>
  );
};

const PodDetail = ({ pod, onBack }) => (
  <div className="pod-detail">
    <button onClick={onBack} className="pod-detail-back">
      ← Geri Dön
    </button>
    <div className="pod-detail-card">
      <h2 className="pod-detail-title">{pod.name}</h2>
      <div className="pod-detail-row">
        <strong>Durum:</strong>
        <span>{pod.status}</span>
      </div>
      <div className="pod-detail-row">
        <strong>Restart Sayısı:</strong>
        <span>{pod.restarts}</span>
      </div>
    </div>
  </div>
);
export default MainLayout;
