import React, { useState, useEffect } from "react";
import { getProspects, getScripts, updateProspect } from "../api";
import { Copy, Check, ExternalLink, CheckCircle } from "lucide-react";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false),1500); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background: copied?"rgba(0,229,160,0.12)":"var(--surface-3)", border:"1px solid var(--border)", borderRadius:6, fontSize:12, color: copied?"var(--accent)":"var(--text-2)", cursor:"pointer", whiteSpace:"nowrap" }}>
      {copied ? <Check size={11} /> : <Copy size={11} />} {copied?"Copied!":"Copy"}
    </button>
  );
}

function LinkedInCard({ prospect, scripts, onDone }) {
  const [done, setDone] = useState(prospect.status === "meeting_booked");
  const liUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(prospect.linkedin_search_query || prospect.decision_maker_title + " " + prospect.company_name)}`;

  const messages = scripts ? [
    { label:"🤝 Connection Request Note", text: scripts.linkedin_connection_note },
    { label:"💬 DM #1 — After Connecting", text: scripts.linkedin_dm_1 },
    { label:"📎 DM #2 — Case Study", text: scripts.linkedin_dm_2 },
    { label:"👋 DM #3 — Final Touch", text: scripts.linkedin_dm_3 },
  ] : [];

  return (
    <div style={{ background:"var(--surface-2)", border:`1px solid ${done?"rgba(0,229,160,0.3)":"var(--border)"}`, borderRadius:"var(--radius-lg)", padding:20, opacity: done?0.6:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{prospect.company_name}</div>
          <div style={{ fontSize:12, color:"var(--text-2)", marginTop:3 }}>{prospect.decision_maker_title} · {prospect.country}</div>
          {prospect.trigger_signal && <div style={{ fontSize:11, color:"var(--text-3)", marginTop:4, fontStyle:"italic" }}>{prospect.trigger_signal.slice(0,100)}...</div>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <a href={liUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"rgba(74,144,226,0.1)", border:"1px solid rgba(74,144,226,0.2)", borderRadius:6, fontSize:12, color:"var(--blue)" }}>
            <ExternalLink size={11} /> Find on LinkedIn
          </a>
          <button onClick={() => { setDone(true); onDone(prospect.id); }}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:6, fontSize:12, color:"var(--accent)", cursor:"pointer" }}>
            <CheckCircle size={11} /> Done
          </button>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {messages.map((m, i) => m.text ? (
          <div key={i} style={{ background:"var(--surface-3)", borderRadius:"var(--radius)", padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:"var(--text-3)", marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:12, color:"var(--text-2)", lineHeight:1.6 }}>{m.text.slice(0,120)}{m.text.length>120?"...":""}</div>
            </div>
            <CopyBtn text={m.text} />
          </div>
        ) : null)}
      </div>
    </div>
  );
}

export default function LinkedIn() {
  const [prospects, setProspects] = useState([]);
  const [scriptsMap, setScriptsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProspects({ status:"linkedin_pending", limit:50 }).then(async ps => {
      setProspects(ps);
      const map = {};
      await Promise.all(ps.map(p => getScripts(p.id).then(s => { map[p.id] = s; }).catch(() => {})));
      setScriptsMap(map);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDone = (id) => {
    updateProspect(id, { status:"pushed_to_instantly" }).catch(console.error);
    setProspects(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding:"32px 36px", maxWidth:860 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:28, letterSpacing:"-0.02em" }}>LinkedIn Pack</h1>
        <p style={{ color:"var(--text-2)", marginTop:4, fontSize:13 }}>Pre-written messages — copy, paste, send. Under 10 mins per prospect.</p>
      </div>
      {loading ? <div style={{ color:"var(--text-3)", fontSize:13 }}>Loading...</div> :
       prospects.length === 0 ? <div style={{ color:"var(--text-3)", fontSize:13, padding:"40px 0", textAlign:"center" }}>No LinkedIn actions pending — check back after the daily job runs</div> :
       <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
         {prospects.map(p => <LinkedInCard key={p.id} prospect={p} scripts={scriptsMap[p.id]} onDone={handleDone} />)}
       </div>}
    </div>
  );
}
