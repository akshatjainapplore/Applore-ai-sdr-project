import React, { useState, useEffect } from "react";
import { getProspects, getScripts } from "../api";
import { Copy, Check, Mail, ChevronDown } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background: copied?"rgba(0,229,160,0.15)":"var(--surface-3)", border:"1px solid var(--border)", borderRadius:6, fontSize:12, color: copied?"var(--accent)":"var(--text-2)", cursor:"pointer" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ScriptBlock({ label, content, color = "var(--accent)" }) {
  if (!content) return null;
  const parsed = (() => { try { return typeof content === "string" ? JSON.parse(content) : content; } catch { return null; } })();
  const text = parsed ? `Subject: ${parsed.subject}\n\n${parsed.body}` : content;
  return (
    <div style={{ background:"var(--surface-3)", border:"1px solid var(--border)", borderRadius:"var(--radius)", marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:2, background:color }} />
          <span style={{ fontSize:12, fontWeight:600, color, fontFamily:"var(--font-mono)" }}>{label}</span>
        </div>
        <CopyButton text={text} />
      </div>
      {parsed?.subject && <div style={{ padding:"10px 14px 0", fontSize:12, color:"var(--text-2)" }}>Subject: <span style={{ color:"var(--text)", fontWeight:500 }}>{parsed.subject}</span></div>}
      <pre style={{ padding:14, fontSize:12, color:"var(--text-2)", whiteSpace:"pre-wrap", lineHeight:1.7, fontFamily:"var(--font-body)", margin:0 }}>{parsed?.body || content}</pre>
    </div>
  );
}

export default function Scripts() {
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("email");

  useEffect(() => {
    getProspects({ limit: 100 }).then(ps => {
      const withScripts = ps.filter(p => p.scripts?.length > 0);
      setProspects(withScripts);
      if (withScripts.length > 0) setSelected(withScripts[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setScripts(null);
    getScripts(selected.id).then(setScripts).catch(console.error).finally(() => setLoading(false));
  }, [selected]);

  return (
    <div style={{ padding:"32px 36px", display:"grid", gridTemplateColumns:"280px 1fr", gap:20, height:"calc(100vh - 0px)" }}>
      {/* Sidebar */}
      <div>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:24, letterSpacing:"-0.02em", marginBottom:20 }}>Scripts</h1>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {prospects.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} style={{
              display:"block", width:"100%", textAlign:"left", padding:"12px 14px",
              background: selected?.id===p.id?"rgba(0,229,160,0.1)":"var(--surface-2)",
              border: `1px solid ${selected?.id===p.id?"rgba(0,229,160,0.3)":"var(--border)"}`,
              borderRadius:"var(--radius)", cursor:"pointer", transition:"all 0.15s"
            }}>
              <div style={{ fontSize:13, fontWeight:600, color: selected?.id===p.id?"var(--accent)":"var(--text)" }}>{p.company_name}</div>
              <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>{p.sector} · {p.country}</div>
            </button>
          ))}
          {prospects.length === 0 && <div style={{ color:"var(--text-3)", fontSize:13, padding:16, textAlign:"center" }}>No scripts generated yet</div>}
        </div>
      </div>

      {/* Scripts Panel */}
      <div style={{ overflow:"auto" }}>
        {selected && (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:20 }}>{selected.company_name}</h2>
              <p style={{ color:"var(--text-2)", fontSize:13, marginTop:4 }}>{selected.trigger_signal}</p>
            </div>

            <div style={{ display:"flex", gap:4, marginBottom:20, background:"var(--surface-2)", padding:4, borderRadius:"var(--radius)", width:"fit-content" }}>
              {[["email","Emails (3)"],["linkedin","LinkedIn (4)"]].map(([t,l]) => (
                <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", background: tab===t?"var(--accent)":"transparent", color: tab===t?"#0D1B2A":"var(--text-2)", border:"none", borderRadius:6, fontSize:13, fontWeight: tab===t?700:400, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
              ))}
            </div>

            {loading ? <div style={{ color:"var(--text-3)", fontSize:13 }}>Loading scripts...</div> : scripts ? (
              tab === "email" ? (
                <div>
                  <ScriptBlock label="EMAIL 1 — THE HOOK (Day 1)" content={scripts.email_1} color="var(--accent)" />
                  <ScriptBlock label="EMAIL 2 — PAIN POINT (Day 4)" content={scripts.email_2} color="var(--blue)" />
                  <ScriptBlock label="EMAIL 3 — FINAL NUDGE (Day 9)" content={scripts.email_3} color="var(--amber)" />
                </div>
              ) : (
                <div>
                  <ScriptBlock label="CONNECTION REQUEST NOTE" content={scripts.linkedin_connection_note} color="var(--blue)" />
                  <ScriptBlock label="DM #1 — AFTER CONNECTING (Day 2)" content={scripts.linkedin_dm_1} color="var(--accent)" />
                  <ScriptBlock label="DM #2 — CASE STUDY (Day 6)" content={scripts.linkedin_dm_2} color="var(--amber)" />
                  <ScriptBlock label="DM #3 — FINAL TOUCH (Day 10)" content={scripts.linkedin_dm_3} color="var(--text-2)" />
                </div>
              )
            ) : null}
          </>
        )}
        {!selected && <div style={{ color:"var(--text-3)", fontSize:13, paddingTop:40, textAlign:"center" }}>Select a company to view scripts</div>}
      </div>
    </div>
  );
}
