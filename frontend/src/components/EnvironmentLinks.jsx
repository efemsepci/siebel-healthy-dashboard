import React, { useMemo } from "react";
import "../styles/environment-links.css";
import {
  MOBIL_ENVIRONMENT_DATA,
  SABIT_ENVIRONMENT_DATA,
} from "../json/environment-links";

const EnvironmentLinks = ({ ortam }) => {
  const normalizedOrtam = ortam?.toLowerCase();

  const environmentData = useMemo(() => {
    return normalizedOrtam === "mobil"
      ? MOBIL_ENVIRONMENT_DATA
      : SABIT_ENVIRONMENT_DATA;
  }, [normalizedOrtam]);

  return (
    <div className="environment-links">
      <header className="environment-links-header">
        <div>
          <h2 className="environment-links-title">Ortam Linkleri - TESTTTT</h2>

          <p className="environment-links-subtitle">
            {ortam === "mobil"
              ? "Mobil ortam bağlantıları"
              : "Sabit ortam bağlantıları"}
          </p>
        </div>

        <div
          className={`environment-links-badge environment-links-badge-${ortam === "mobil" ? "mobil" : "sabit"}`}
        >
          {ortam.toUpperCase()}
        </div>
      </header>

      <div className="environment-links-grid">
        {environmentData.map((section, index) => (
          <div key={index} className="environment-links-card">
            <div className="environment-links-card-header">
              <h3 className="environment-links-card-title">{section.title}</h3>
            </div>

            <div className="environment-links-list">
              {section.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="environment-links-item"
                >
                  <span>{link.label}</span>

                  <span className="environment-links-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentLinks;
