import React, { useState } from "react";
import MainLayout from "./layouts/MainLayout";
import { login } from "./services/authService";
import "./styles/app.css";

const App = () => {
  localStorage.clear();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [ortam, setOrtam] = useState(localStorage.getItem("ortam"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState("mobil");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    const backendOrtam = environment === "mobil" ? "erdek" : "flareon";
    try {
      const res = await login(username, password, backendOrtam);
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setOrtam(environment);
        localStorage.setItem("token", data.token);
        localStorage.setItem("ortam", environment);
      } else setLoginError("Kimlik bilgileri hatalı.");
    } catch (err) {
      console.error(err);
      setLoginError("Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setOrtam(null);
    localStorage.removeItem("token");
    localStorage.removeItem("ortam");
  };

  if (!token)
    return (
      <div className="login-background">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-badge">
              <span className="login-logo-letter">S</span>
            </div>
            <h1 className="login-title">
              SIEBEL <span className="login-orange-highlight">HEALTHY</span>{" "}
              DASHBOARD
            </h1>
            <div className="login-divider" />
            <p className="login-subtitle">Cloud Management Console</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-group">
              <label className="login-label">Ortam</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="login-input"
              >
                <option value="mobil">Mobil</option>
                <option value="sabit">Sabit</option>
              </select>
            </div>
            <div className="login-input-group">
              <label className="login-label">Sicil</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Sicil numaranız"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-group">
              <label className="login-label">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                required
              />
            </div>
            {loginError && <div className="login-error-box">{loginError}</div>}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Bağlanıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <MainLayout
      token={token}
      ortam={ortam}
      username={username}
      setToken={setToken}
      handleLogout={handleLogout}
    />
  );
};

export default App;
