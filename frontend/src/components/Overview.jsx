import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNamespaces,
  getPods,
  getNamespaceMetrics,
} from "../services/podsService";
import { getComponents } from "../services/componentService";
import "../styles/overview.css";

const POD_GROUPS = ["siebel-cgw", "siebel-sai", "siebel-ses"];
const isOnline = (status) => /^(online|running)$/i.test(status || "");

const Overview = ({ token, ortam, onNavigate }) => {
  const [namespaces, setNamespaces] = useState([]);
  const [namespace, setNamespace] = useState("");
  const [pods, setPods] = useState([]);
  const [namespaceMetrics, setNamespaceMetrics] = useState({
    cpuMillicores: 0,
    memoryGi: 0,
  });
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(
    async (selectedNamespace = namespace) => {
      if (!selectedNamespace) return;
      setLoading(true);
      setError("");
      try {
        const [podData, componentData, metricData] = await Promise.all([
          getPods(selectedNamespace, token),
          getComponents(selectedNamespace, token),
          getNamespaceMetrics(selectedNamespace, token),
        ]);
        setPods(Array.isArray(podData) ? podData : []);

        const allowedAliases = ["SES0", "SES1", "SES2"];
        setComponents(
          Array.isArray(componentData?.components)
            ? componentData.components.filter((component) =>
                allowedAliases.includes(component.svName),
              )
            : [],
        );
        setNamespaceMetrics(metricData);
        setLastUpdated(new Date());
      } catch (refreshError) {
        console.error(refreshError);
        setError("Sağlık verileri güncellenemedi. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    },
    [namespace, token],
  );

  useEffect(() => {
    const loadNamespaces = async () => {
      try {
        const data = await getNamespaces(token);
        const available = Array.isArray(data) ? data : [];
        setNamespaces(available);
        if (available[0]) setNamespace(available[0].id);
        else setLoading(false);
      } catch (loadError) {
        console.error(loadError);
        setError("Projeler yüklenemedi.");
        setLoading(false);
      }
    };
    loadNamespaces();
  }, [token]);

  useEffect(() => {
    if (namespace) refresh();
  }, [namespace, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const podStatusStats = useMemo(() => {
    const running = pods.filter((p) => p.status === "Running").length;

    const succeeded = pods.filter((p) => p.status === "Succeeded").length;

    const failed = pods.filter((p) => p.status === "Failed").length;

    const pending = pods.filter((p) => p.status === "Pending").length;

    const maxValue = Math.max(running, succeeded, failed, pending, 1);

    return {
      running,
      succeeded,
      failed,
      pending,
      runningPct: (running / maxValue) * 100,
      succeededPct: (succeeded / maxValue) * 100,
      failedPct: (failed / maxValue) * 100,
      pendingPct: (pending / maxValue) * 100,
    };
  }, [pods]);

  const componentStats = useMemo(() => {
    const online = components.filter(
      (c) => c.status?.toLowerCase() === "online",
    ).length;

    const running = components.filter(
      (c) => c.status?.toLowerCase() === "running",
    ).length;

    const shutdown = components.filter(
      (c) => c.status?.toLowerCase() === "shutdown",
    ).length;

    const total = Math.max(online + running + shutdown, 1);

    return {
      online,
      running,
      shutdown,
      onlinePct: (online / total) * 100,
      runningPct: (running / total) * 100,
      shutdownPct: (shutdown / total) * 100,
    };
  }, [components]);

  const metrics = useMemo(() => {
    const runningPods = pods.filter((pod) => pod.status === "Running").length;

    const onlineComponents = components.filter((component) =>
      isOnline(component.status),
    ).length;

    const podHealth = pods.length > 0 ? (runningPods / pods.length) * 100 : 100;

    const componentHealth =
      components.length > 0
        ? (onlineComponents / components.length) * 100
        : 100;

    // ağırlıklar
    const healthScore = Math.round(podHealth * 0.6 + componentHealth * 0.4);

    const unhealthyPods = pods.filter((pod) => pod.status !== "Running");

    const restartedPods = pods.filter((pod) => (pod.restarts || 0) > 0);

    const offline = components.filter(
      (component) => !isOnline(component.status),
    );

    const issues = [
      ...unhealthyPods.map((pod) => ({
        level: pod.status === "Failed" ? "critical" : "warning",
        title: pod.name,
        detail: `Pod durumu: ${pod.status}`,
        target: "pods",
      })),
      ...restartedPods.map((pod) => ({
        level: "warning",
        title: pod.name,
        detail: `Restart sayısı: ${pod.restarts}`,
        target: "pods",
      })),
      ...offline.map((component) => ({
        level: "critical",
        title: component.alias || component.svName,
        detail: `Component durumu: ${component.status}`,
        target: "components",
      })),
    ];

    return {
      running: runningPods,
      failed: pods.filter((p) => p.status === "Failed").length,
      online: onlineComponents,
      offline,
      issues,
      healthScore,
    };
  }, [pods, components]);

  const healthClass =
    metrics.healthScore >= 90
      ? "healthy"
      : metrics.healthScore >= 50
        ? "warning"
        : "critical";

  return (
    <section className="overview">
      <header className="overview-header">
        <div>
          <p className="overview-eyebrow">SIEBEL OPERATIONS CENTER</p>
          <h1>Genel Bakış</h1>
          <p className="overview-subtitle">
            {ortam === "sabit" ? "SABİT" : "MOBİL"} ortamı için canlı sağlık
            özeti
          </p>
        </div>
        <div className="overview-actions">
          <label>
            <span>PROJE / NAMESPACE</span>
            <select
              value={namespace}
              onChange={(event) => setNamespace(event.target.value)}
            >
              {namespaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => refresh()} disabled={loading}>
            {loading ? "Güncelleniyor..." : "Yenile"}
          </button>
          <div className="overview-live">
            <i /> CANLI · 30 sn
          </div>
        </div>
      </header>
      {error && <div className="overview-error">{error}</div>}
      <div className="overview-updated">
        Son kontrol:{" "}
        {lastUpdated
          ? lastUpdated.toLocaleTimeString("tr-TR")
          : "Bekleniyor..."}
      </div>
      <div className="overview-cards">
        <article className={`overview-card overview-health ${healthClass}`}>
          <span>SYSTEM HEALTH</span>

          <div
            className="health-ring"
            style={{
              "--score": metrics.healthScore,
            }}
          >
            <span>%{metrics.healthScore}</span>
          </div>

          <small>
            {metrics.issues.length
              ? `${metrics.issues.length} aktif uyarı`
              : "Tüm kontroller normal"}
          </small>
        </article>
        <button
          type="button"
          className="overview-card overview-clickable"
          onClick={() => onNavigate("pods")}
        >
          <span>PODS</span>

          <strong>{pods.length}</strong>

          <div className="mini-pod-chart">
            <div className="mini-chart-row">
              <div className="mini-chart-status">
                <span className="status-dot running" />
                <label>Running</label>
              </div>
              <small>{podStatusStats.running}</small>
            </div>

            <div className="mini-chart-row">
              <div className="mini-chart-status">
                <span className="status-dot succeeded" />
                <label>Succeeded</label>
              </div>
              <small>{podStatusStats.succeeded}</small>
            </div>

            <div className="mini-chart-row">
              <div className="mini-chart-status">
                <span className="status-dot failed" />
                <label>Failed</label>
              </div>
              <small>{podStatusStats.failed}</small>
            </div>

            <div className="mini-chart-row">
              <div className="mini-chart-status">
                <span className="status-dot pending" />
                <label>Pending</label>
              </div>
              <small>{podStatusStats.pending}</small>
            </div>
          </div>
        </button>
        <article className="overview-card resource-card circular-resource-card">
          <span>CPU USAGE</span>

          <div
            className={`circular-chart ${
              Math.min(Number(namespaceMetrics.cpuMillicores) / 10, 100) <= 60
                ? "resource-good"
                : Math.min(Number(namespaceMetrics.cpuMillicores) / 10, 100) <=
                    80
                  ? "resource-warning"
                  : "resource-danger"
            }`}
            style={{
              "--progress": `${Math.min(
                Number(namespaceMetrics.cpuMillicores) / 10,
                100,
              )}%`,
            }}
          >
            <div className="circular-chart-inner">
              <strong>{namespaceMetrics.cpuMillicores}m</strong>
              <small>CPU</small>
            </div>
          </div>

          <small>{namespace} - CPU kullanımı</small>
        </article>

        <article className="overview-card resource-card circular-resource-card">
          <span>MEMORY USAGE</span>

          <div
            className={`circular-chart ${
              Math.min(Number(namespaceMetrics.memoryGi) * 10, 100) <= 60
                ? "resource-good"
                : Math.min(Number(namespaceMetrics.memoryGi) * 10, 100) <= 80
                  ? "resource-warning"
                  : "resource-danger"
            }`}
            style={{
              "--progress": `${Math.min(
                Number(namespaceMetrics.memoryGi) * 10,
                100,
              )}%`,
            }}
          >
            <div className="circular-chart-inner">
              <strong>{namespaceMetrics.memoryGi} Gi</strong>
              <small>RAM</small>
            </div>
          </div>

          <small>{namespace} - RAM kullanımı</small>
        </article>
      </div>
      <div className="overview-grid">
        <article className="overview-panel">
          <div className="overview-panel-title">
            <h2>Pod Sağlığı</h2>
            <button type="button" onClick={() => onNavigate("pods")}>
              Tüm podlar →
            </button>
          </div>
          {POD_GROUPS.map((group) => {
            const groupPods = pods.filter((pod) => pod.name.startsWith(group));
            const healthy = groupPods.filter(
              (pod) => pod.status === "Running",
            ).length;
            return (
              <div className="overview-group" key={group}>
                <span>{group.replace("siebel-", "").toUpperCase()}</span>
                <div>
                  <b
                    style={{
                      width: `${groupPods.length ? (healthy / groupPods.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <em>
                  {healthy}/{groupPods.length} Running
                </em>
              </div>
            );
          })}
        </article>
        <article className="overview-panel">
          <div className="overview-panel-title">
            <h2>Component Sağlığı</h2>

            <button type="button" onClick={() => onNavigate("components")}>
              Listeyi aç →
            </button>
          </div>

          <div className="component-histogram">
            <div className="histogram-row">
              <div className="histogram-header">
                <div className="histogram-title">
                  <span className="dot online" />
                  Online
                </div>

                <strong>{componentStats.online}</strong>
              </div>

              <div className="histogram-bar">
                <div
                  className="histogram-fill online"
                  style={{
                    width: `${componentStats.onlinePct}%`,
                  }}
                />
              </div>
            </div>

            <div className="histogram-row">
              <div className="histogram-header">
                <div className="histogram-title">
                  <span className="dot running" />
                  Running
                </div>

                <strong>{componentStats.running}</strong>
              </div>

              <div className="histogram-bar">
                <div
                  className="histogram-fill running"
                  style={{
                    width: `${componentStats.runningPct}%`,
                  }}
                />
              </div>
            </div>

            <div className="histogram-row">
              <div className="histogram-header">
                <div className="histogram-title">
                  <span className="dot shutdown" />
                  Shutdown
                </div>

                <strong>{componentStats.shutdown}</strong>
              </div>

              <div className="histogram-bar">
                <div
                  className="histogram-fill shutdown"
                  style={{
                    width: `${componentStats.shutdownPct}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>
      </div>
      <article className="overview-panel overview-alerts">
        <div className="overview-panel-title">
          <h2>Aktif Uyarılar</h2>
          <span>{metrics.issues.length} açık kayıt</span>
        </div>
        {metrics.issues.length ? (
          metrics.issues.map((issue, index) => (
            <button
              type="button"
              key={`${issue.title}-${index}`}
              className={`overview-alert ${issue.level}`}
              onClick={() => onNavigate(issue.target)}
            >
              <i />{" "}
              <div>
                <b>{issue.title}</b>
                <span>{issue.detail}</span>
              </div>
              <strong>Detayı aç →</strong>
            </button>
          ))
        ) : (
          <div className="overview-empty">
            ✓ Aktif sorun yok. Siebel servisleri sağlıklı görünüyor.
          </div>
        )}
      </article>
    </section>
  );
};

export default Overview;
