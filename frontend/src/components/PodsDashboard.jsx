import React, { useCallback, useEffect, useState } from "react";
import { getNamespaces, getPods } from "../services/podsService";
import "../styles/pods-dashboard.css";

const ALLOWED_GROUPS = ["siebel-cgw", "siebel-sai", "siebel-ses"];
const STATUS_FILTERS = ["All", "Running", "Succeeded", "Failed"];

const PodsDashboard = ({ token }) => {
  const [namespaces, setNamespaces] = useState([]);
  const [allPods, setAllPods] = useState([]);
  const [filteredPods, setFilteredPods] = useState([]);
  const [currentNS, setCurrentNS] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const fetchNamespaces = useCallback(async () => {
    try {
      const res = await getNamespaces(token);
      setNamespaces(res);
      if (res.length > 0 && !currentNS) setCurrentNS(res[0].id);
    } catch (err) {
      console.error(err);
      setNamespaces([]);
    }
  }, [token, currentNS]);
  const fetchPods = useCallback(async () => {
    if (!currentNS) return;
    setLoading(true);
    try {
      const res = await getPods(currentNS, token);
      setAllPods(Array.isArray(res) ? res : []);
      setActiveGroup("All");
      setActiveStatus("All");
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      setAllPods([]);
    } finally {
      setLoading(false);
    }
  }, [currentNS, token]);
  useEffect(() => {
    if (token) fetchNamespaces();
  }, [token, fetchNamespaces]);
  useEffect(() => {
    if (currentNS) fetchPods();
  }, [currentNS, fetchPods]);
  useEffect(() => {
    let pods = allPods;
    if (activeGroup !== "All")
      pods = pods.filter((pod) => pod.name.startsWith(activeGroup));
    if (activeStatus !== "All")
      pods = pods.filter((pod) => pod.status === activeStatus);
    setFilteredPods(pods);
  }, [allPods, activeGroup, activeStatus]);
  const groupFilteredPods =
    activeGroup === "All"
      ? allPods
      : allPods.filter((pod) => pod.name.startsWith(activeGroup));
  return (
    <div className="pods-dashboard">
      <header className="pods-dashboard-header">
        <h2 className="pods-dashboard-title">Pod Status</h2>
        <div className="pods-dashboard-controls">
          <select
            className="pods-dashboard-select"
            value={currentNS}
            onChange={(e) => setCurrentNS(e.target.value)}
          >
            {namespaces.map((ns) => (
              <option key={ns.id} value={ns.id}>
                {ns.name}
              </option>
            ))}
          </select>
          <select
            className="pods-dashboard-select pods-dashboard-select-group"
            value={activeGroup}
            onChange={(e) => setActiveGroup(e.target.value)}
          >
            {["All", ...ALLOWED_GROUPS].map((group) => (
              <option key={group} value={group}>
                {group} (
                {group === "All"
                  ? allPods.length
                  : allPods.filter((pod) => pod.name.startsWith(group)).length}
                )
              </option>
            ))}
          </select>
          <select
            className="pods-dashboard-select pods-dashboard-select-status"
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status} (
                {status === "All"
                  ? groupFilteredPods.length
                  : groupFilteredPods.filter((pod) => pod.status === status)
                      .length}
                )
              </option>
            ))}
          </select>
          <div className="pods-dashboard-refresh">
            <button
              onClick={fetchPods}
              disabled={loading}
              className="pods-dashboard-refresh-button"
            >
              {loading ? "..." : "Yenile"}
            </button>
            {lastRefresh && (
              <span className="pods-dashboard-refresh-time">
                Son Güncelleme: {lastRefresh}
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="pods-dashboard-table-card">
        <table className="pods-dashboard-table">
          <thead>
            <tr>
              <th>POD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPods.length > 0 ? (
              filteredPods.map((pod, index) => (
                <tr key={index}>
                  <td className="pods-dashboard-name">{pod.name}</td>
                  <td>
                    <span
                      className={`pods-dashboard-badge pods-dashboard-badge-${pod.status.toLowerCase()}`}
                    >
                      {pod.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="pods-dashboard-empty">
                  Seçili kriterlere uygun pod bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PodsDashboard;
