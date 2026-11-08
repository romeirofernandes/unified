import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import UnifiedFeedback from "./components/UnifiedFeedback";
import "./index.css";

const apiUrl = "https://local-demo.invalid";
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, options) => {
  if (String(input).startsWith(apiUrl)) {
    await new Promise(resolve => setTimeout(resolve, options?.method === "POST" ? 700 : 100));
    return new Response(JSON.stringify(options?.method === "POST" ? { id: "demo" } : {
      appearance: { preset: "unified", launcher: JSON.parse(localStorage.getItem("unified-demo-launcher") || "{}") },
      name: "Help us improve",
      theme: "light",
      fields: [
        { _id: "message", type: "textarea", label: "What could we do better?", required: true },
        { _id: "email", type: "email", label: "Your email", required: false },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return originalFetch(input, options);
};

export function Demo() {
  const [launcher, setLauncher] = useState(() => JSON.parse(localStorage.getItem("unified-demo-launcher") || "{}"));
  const [theme, setTheme] = useState("light");
  const [version, setVersion] = useState(0);
  function configure(patch) {
    const next = { ...launcher, ...patch };
    localStorage.setItem("unified-demo-launcher", JSON.stringify(next));
    setLauncher(next);
    setVersion(value => value + 1);
  }
  function restore() {
    localStorage.removeItem(`unified-feedback:dismissed:${apiUrl}:local-demo`);
    setVersion(value => value + 1);
  }
  return <main style={{ minHeight: "100vh", background: theme === "dark" ? "#151515" : "#f7f7f5", color: theme === "dark" ? "#eee" : "#181818", boxSizing: "border-box", padding: "80px 28px", fontFamily: "system-ui, sans-serif" }}>
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontSize: 13, color: "#888" }}>COMPONENT MATE · LOCAL DEMO</p>
      <h1 style={{ fontSize: 40, lineHeight: 1.15, margin: "24px 0" }}>Try the feedback widget.</h1>
      <p style={{ lineHeight: 1.7, marginBottom: 32 }}>Open the widget in the bottom corner. Drag it to the red delete area to remove it, then refresh to check that it stays removed.</p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <label>Launcher <select value={launcher.style || "pill"} onChange={event => configure({ style: event.target.value })} style={{ marginLeft: 8, padding: 8, color: "#181818", background: "white" }}>{["pill", "rounded", "icon", "text", "tab"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Icon <select value={launcher.icon || "chat"} onChange={event => configure({ icon: event.target.value })} style={{ marginLeft: 8, padding: 8, color: "#181818", background: "white" }}>{["chat", "mail", "star", "none"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Label <input value={launcher.label || "Feedback"} maxLength={32} onChange={event => configure({ label: event.target.value })} style={{ width: 140, padding: 8, marginLeft: 8, color: "#181818", background: "white", border: "1px solid #ddd", borderRadius: 6 }} /></label>
        <label>Button color <input type="color" value={launcher.colors?.[theme]?.background || "#5575b4"} onChange={event => configure({ colors: { ...launcher.colors, [theme]: { ...launcher.colors?.[theme], background: event.target.value } } })} style={{ verticalAlign: "middle", marginLeft: 8 }} /></label>
        <label>Text color <input type="color" value={launcher.colors?.[theme]?.text || "#ffffff"} onChange={event => configure({ colors: { ...launcher.colors, [theme]: { ...launcher.colors?.[theme], text: event.target.value } } })} style={{ verticalAlign: "middle", marginLeft: 8 }} /></label>
        <label>Theme <select value={theme} onChange={event => setTheme(event.target.value)} style={{ marginLeft: 8, padding: 8, color: "#181818", background: "white" }}><option>light</option><option>dark</option></select></label>
        <button onClick={restore} style={{ padding: "9px 14px", border: "1px solid #aaa", borderRadius: 8, background: "white", color: "#181818", cursor: "pointer" }}>Restore widget</button>
      </div>
      <p style={{ marginTop: 32, fontSize: 13, color: "#888" }}>Demo responses stay here. Nothing is sent to your backend.</p>
    </div>
    <UnifiedFeedback key={version} projectId="local-demo" apiUrl={apiUrl} theme={theme} />
  </main>;
}

document.body.style.margin = "0";
createRoot(document.getElementById("root")).render(<StrictMode><Demo /></StrictMode>);
