// frontend/src/pages/FlowchartDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function FlowchartDashboard() {
  const nav = useNavigate();
  const { courseId } = useParams(); // optional — if opened from a course page
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/api/flowcharts").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  async function createEmpty() {
    setErr("");
    if (!name.trim()) return setErr("Please enter a name");
    try {
      const r = await api.post("/api/flowcharts", { name, courseId });
      nav(`/flowchart/${r.data.id}`);
    } catch (e) {
      setErr(e?.response?.data?.error || "Create failed");
    }
  }

  async function generateNew() {
    setErr("");
    if (!prompt.trim()) return setErr("Please enter a description");
    setLoading(true);
    try {
      const r = await api.post("/api/flowcharts/generate", {
        prompt,
        name: name || `AI Flow ${new Date().toLocaleString()}`,
        courseId,
      });
      nav(`/flowchart/${r.data.id}`);
    } catch (e) {
      setErr(e?.response?.data?.error || "Generate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav("/")} style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", background: "white" }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🗺️ Flowcharts</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, alignItems: "start" }}>
        {/* Create panel */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Create New</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Name must be unique per account.</div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14 }}
              placeholder="Flowchart name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={createEmpty}
              style={{ padding: "9px 0", background: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              Create empty
            </button>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, fontSize: 13, color: "#64748b" }}>AI Generate</div>
            <textarea
              style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, minHeight: 90, resize: "vertical" }}
              placeholder="Describe the process… e.g. 'user login and password reset flow'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={generateNew}
              disabled={loading}
              style={{ padding: "9px 0", background: loading ? "#93c5fd" : "#1d4ed8", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "default" : "pointer", fontSize: 14 }}
            >
              {loading ? "Generating…" : "✨ Generate with AI"}
            </button>

            {err && <div style={{ color: "#b91c1c", fontSize: 13 }}>{err}</div>}
          </div>
        </div>

        {/* List panel */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Your Flowcharts</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{items.length} total</div>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {items.length === 0 && (
              <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>
                No flowcharts yet — create one on the left.
              </div>
            )}
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => nav(`/flowchart/${it.id}`)}
                style={{ textAlign: "left", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", background: "white", transition: "border-color 0.15s" }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Updated: {new Date(it.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}