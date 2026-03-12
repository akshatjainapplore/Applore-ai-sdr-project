import React, { useState, useEffect } from "react";
import { getPipelineSummary, getHotProspects, getSchedulerLogs, triggerDailyJob } from "../api";
import { Flame, Calendar, Mail, Users, Play, Clock, CheckCircle } from "lucide-react";

function StatCard({ label, value, sub, color = "var(--accent)", icon: Icon }) {
  return (
    <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px 24px", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <span style={{ fontSize:12, color:"var(--text-2)", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-mono)" }}>{label}</span>
        {Icon && <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={15} color={color} /></div>}
      </div>
      <div style={{ fontSize:36, fontFamily:"var(--font-display)", fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

function StageBar({ byStage = {} }) {
  const stages = [
    { key:"researching", label:"Researching", color:"var(--blue)" },
    { key:"scripted", label:"Scripted", color:"var(--accent)" },
    { key:"pushed_to_instantly", label:"In Sequence", color:"#9B59B6" },
    { key:"linkedin_pending", label:"LinkedIn", color:"var(--amber)" },
    { key:"replied", label:"Replied", color:"#F39C12" },
    { key:"meeting_booked", label:"Meeting Booked", color:"#00E5A0" },
  ];
  return (
    <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24 }}>
      <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15, marginBottom:20 }}>Pipeline Stages</div>
      <div style={{ display:"flex", height:8, borderRadius:4, overflow:"hidden", gap:2, marginBottom:16 }}>
        {stages.map(s => <div key={s.key} style={{ flex:byStage[s.key]||0, background:s.color, minWidth:byStage[s.key]?4:0 }} />)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        {stages.map(s => (
          <div key={s.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:11, color:"var(--text-3)" }}>{s.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", fontFamily:"var(--font-display)" }}>{byStage[s.key]||0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [hot, setHot] = useState([]);
  const [logs, setLogs] = useState([]);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    getPipelineSummary().then(setSummary).catch(console.error);
    getHotProspects().then(setHot).catch(console.error);
    getSchedulerLogs().then(setLogs).catch(console.error);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    await triggerDailyJob().catch(console.error);
    setTimeout(() => setTriggering(false), 3000);
  };

  const lastRun = summary?.lastRun;

  return (
    <div style={{ padding:"32px 36px", maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:28, letterSpacing:"-0.02em" }}>Dashboard</h1>
          <p style={{ color:"var(--text-2)", marginTop:4, fontSize:13 }}>Autonomous AI SDR — running 24/7</p>
        </div>
        <button onClick={handleTrigger} disabled={triggering} style={{
          display:"flex", alignItems:"center", gap:8, padding:"10px 18px",
          background: triggering?"var(--surface-3)":"var(--accent)", color: triggering?"var(--text-2)":"#0D1B2A",
          border:"none", borderRadius:"var(--radius)", fontWeight:700, fontSize:13, transition:"all 0.2s"
        }}>
          <Play size={14} />{triggering?"Running...":"Run Now"}
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="Total Prospects" value={summary?.total||0} icon={Users} color="var(--blue)" sub="in pipeline" />
        <StatCard label="Hot Prospects" value={summary?.hotProspects||0} icon={Flame} color="var(--amber)" sub="need action" />
        <StatCard label="Meetings Booked" value={summary?.meetingsBooked||0} icon={Calendar} color="var(--accent)" sub="this month" />
        <StatCard label="Replied" value={summary?.replied||0} icon={Mail} color="#9B59B6" sub="total replies" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
        <StageBar byStage={summary?.byStage} />
        <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:24 }}>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15, marginBottom:20 }}>Scheduler Status</div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"12px 16px", background:"var(--surface-3)", borderRadius:"var(--radius)" }}>
            {lastRun?.status==="completed" ? <CheckCircle size={18} color="var(--accent)" /> : <Clock size={18} color="var(--text-2)" />}
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>Last run: {lastRun ? new Date(lastRun.run_at).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) : "Never"}</div>
              <div style={{ fontSize:12, color:"var(--text-2)" }}>Next: Daily 7:00 AM IST (auto)</div>
            </div>
          </div>
          {logs.slice(0,4).map((log,i) => (
            <div key={log.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i<3?"1px solid var(--border)":"none" }}>
              <span style={{ fontSize:12, color:"var(--text-2)" }}>{new Date(log.run_at).toLocaleDateString("en-IN")}</span>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--text-2)" }}>+{log.leads_discovered} found</span>
                <span style={{ fontSize:12, color:"var(--accent)" }}>{log.leads_pushed_to_instantly} pushed</span>
                <span className={`tag ${log.status==="completed"?"tag-green":log.status==="failed"?"tag-red":"tag-amber"}`}>{log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hot.length > 0 && (
        <div style={{ background:"var(--surface-2)", border:"1px solid rgba(245,166,35,0.3)", borderRadius:"var(--radius-lg)", padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <Flame size={16} color="var(--amber)" />
            <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:15 }}>Hot Prospects — Action Required</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {hot.map(p => (
              <div key={p.id} style={{ background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.15)", borderRadius:"var(--radius)", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{p.company_name}</div>
                  <div style={{ fontSize:12, color:"var(--text-2)", marginTop:2 }}>{p.decision_maker_title} · {p.country}</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {p.email_opens>0 && <span className="tag tag-amber">{p.email_opens} opens</span>}
                  {p.replied && <span className="tag tag-green">Replied</span>}
                  {p.meeting_booked && <span className="tag tag-green">Meeting ✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
