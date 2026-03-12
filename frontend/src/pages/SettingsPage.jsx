import React, { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../api";
import { Save, Check } from "lucide-react";

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--text-2)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize:11, color:"var(--text-3)", marginTop:4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = { width:"100%", padding:"10px 12px", background:"var(--surface-3)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text)", fontSize:13, outline:"none" };

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(settings).catch(console.error);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <div style={{ padding:40, color:"var(--text-3)" }}>Loading settings...</div>;

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <div style={{ padding:"32px 36px", maxWidth:700 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:28, letterSpacing:"-0.02em" }}>Settings</h1>
          <p style={{ color:"var(--text-2)", marginTop:4, fontSize:13 }}>Configure your ICP, schedule, and API connections</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          display:"flex", alignItems:"center", gap:8, padding:"10px 20px",
          background: saved?"rgba(0,229,160,0.15)":saving?"var(--surface-3)":"var(--accent)",
          color: saved?"var(--accent)":saving?"var(--text-2)":"#0D1B2A",
          border: saved?"1px solid rgba(0,229,160,0.3)":"none", borderRadius:"var(--radius)", fontWeight:700, fontSize:13
        }}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> {saving?"Saving...":"Save Settings"}</>}
        </button>
      </div>

      {/* ICP */}
      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24, marginBottom:20 }}>
        <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15, marginBottom:20 }}>Ideal Customer Profile</div>
        <Field label="Target Sectors" hint="Comma-separated. e.g. HealthTech, FinTech, SaaS">
          <input style={inputStyle} value={(settings.sectors||[]).join(", ")}
            onChange={e => update("sectors", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
        </Field>
        <Field label="Target Countries" hint="Comma-separated. e.g. UK, Germany, Netherlands, Sweden, France, Spain">
          <input style={inputStyle} value={(settings.countries||[]).join(", ")}
            onChange={e => update("countries", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Min Employees">
            <input type="number" style={inputStyle} value={settings.employee_min||50} onChange={e => update("employee_min", parseInt(e.target.value))} />
          </Field>
          <Field label="Max Employees">
            <input type="number" style={inputStyle} value={settings.employee_max||75} onChange={e => update("employee_max", parseInt(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Scheduler */}
      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24, marginBottom:20 }}>
        <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15, marginBottom:20 }}>Autonomous Scheduler</div>
        <Field label="New Leads Per Day" hint="How many new companies the AI SDR researches and scripts daily">
          <input type="number" style={inputStyle} value={settings.daily_lead_target||10} onChange={e => update("daily_lead_target", parseInt(e.target.value))} />
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Run Hour (IST 24h)" hint="7 = 7:00 AM IST">
            <input type="number" min={0} max={23} style={inputStyle} value={settings.cron_hour_ist||7} onChange={e => update("cron_hour_ist", parseInt(e.target.value))} />
          </Field>
          <Field label="Run Minute">
            <input type="number" min={0} max={59} style={inputStyle} value={settings.cron_minute_ist||0} onChange={e => update("cron_minute_ist", parseInt(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* API Keys */}
      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24 }}>
        <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15, marginBottom:8 }}>API Connections</div>
        <div style={{ fontSize:12, color:"var(--text-3)", marginBottom:20 }}>Keys are stored in your backend .env file — shown masked here for reference</div>
        <Field label="Instantly API Key" hint="From Instantly dashboard → Settings → API">
          <input style={inputStyle} value={settings.instantly_api_key||""} onChange={e => update("instantly_api_key", e.target.value)} placeholder="sk-****" />
        </Field>
        <Field label="Instantly Campaign ID" hint="The campaign ID to add contacts into automatically">
          <input style={inputStyle} value={settings.instantly_campaign_id||""} onChange={e => update("instantly_campaign_id", e.target.value)} placeholder="campaign_..." />
        </Field>
        <Field label="Vibe Prospecting API Key" hint="From your Explorium / Vibe Prospecting account">
          <input style={inputStyle} value={settings.vibe_api_key||""} onChange={e => update("vibe_api_key", e.target.value)} placeholder="****" />
        </Field>
      </div>
    </div>
  );
}
