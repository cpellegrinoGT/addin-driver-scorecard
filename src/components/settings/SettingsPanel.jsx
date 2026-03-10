import { useState } from "react";
import GeneralTab from "./GeneralTab.jsx";
import RulesTab from "./RulesTab.jsx";
import ThresholdsTab from "./ThresholdsTab.jsx";
import ColorsTab from "./ColorsTab.jsx";
import SavedViewsTab from "./SavedViewsTab.jsx";

const TABS = [
  { id: "general", label: "General" },
  { id: "rules", label: "Rules" },
  { id: "thresholds", label: "Thresholds" },
  { id: "colors", label: "Colors" },
  { id: "views", label: "Saved Views" },
];

export default function SettingsPanel({
  settings,
  onUpdate,
  allRules,
  safetyCenterAvailable,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <>
      <div
        className="scorecard-settings-overlay"
        onClick={onClose}
      />
      <div className="scorecard-settings-panel">
        <div className="scorecard-settings-header">
          <h2>Settings</h2>
          <button className="scorecard-settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="scorecard-settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`scorecard-settings-tab ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="scorecard-settings-body">
          {activeTab === "general" && (
            <GeneralTab
              settings={settings}
              onUpdate={onUpdate}
              safetyCenterAvailable={safetyCenterAvailable}
            />
          )}
          {activeTab === "rules" && (
            <RulesTab
              settings={settings}
              onUpdate={onUpdate}
              allRules={allRules}
            />
          )}
          {activeTab === "thresholds" && (
            <ThresholdsTab settings={settings} onUpdate={onUpdate} />
          )}
          {activeTab === "colors" && (
            <ColorsTab
              settings={settings}
              onUpdate={onUpdate}
              allRules={allRules}
            />
          )}
          {activeTab === "views" && (
            <SavedViewsTab settings={settings} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </>
  );
}
