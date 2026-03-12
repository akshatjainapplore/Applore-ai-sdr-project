import React, { useState, useEffect } from "react";
import { getProspects, updateProspect, deleteProspect } from "../api";
import { Search, ExternalLink, Trash2, CheckCircle, Flame, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  researching: "var(--blue)", scripted: "#9B59B6", pushed_to_instantly: "var(--accent)",
  linkedin_pending: "var(--amber)", replied: "#F39C12", meeting_booked: "var(--accent)", dead: "var(--text-3)"
};
const STATUS_LABELS = {
  researching:"Researching", scripted:"Scripted", pushed_to_instantly:"In Sequence",
  linkedin_pending:"LinkedIn Pending", replied:"Replied", meeting_booked:"Meeting Booked", dead:"Dead"
};

function ProspectRow({ prospect, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[prospect.status] || "var(--text-2)";

  return (
    <>
      <tr style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }} onClick={() => setExpanded(!expanded)}>
        <td style={{ padding:"14px 16px" }}>
          <div style={{ fontWeight:600, fontSize:13 }}>{prospect.company_name}</div>
          <div style={{ fontSize:11, color:"var(--text-2)", marginTop:2 }}>{prospect.website}</div>
        </td>
        <td style={{ padding:"14px 16px" }}><span className="tag tag-blue">{prospect.sector}</span></td>
        <td style={{ padding:"14px 16px", fontSize:13, color:"var(--text-2)" }}>{prospect.country}</td>
        <td style={{ padding:"14px 16px", fontSize:13 }}>{prospect.decision_maker_title || "—"}</td>
        <td style={{ padding:"14px 16px" }}>
          <span style={{ fontSize:11, fontWeight:600, color, background:`${color}18`, padding:"3px 8px", borderRadius:4 }}>
            {STATUS_LABELS[prospect.status] || prospect.status}
          </span>
        </td>
        <td style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", gap:6 }}>
            {prospect.is_hot && <Flame size={14} color="var(--amber)" />}
            {prospect.meeting_booked && <CheckCircle size={14} color="var(--accent)" />}
          </div>
        </td>
        <td style={{ padding:"14px 16px", textAlign:"right" }}>
          {expanded ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </td>
      </tr>
      {expanded && (
        <tr style={{ background:"var(--surface-3)" }}>
          <td colSpan={7} style={{ padding:"16px 20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div>
                <div style={{ fontSize:11, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Company Brief</div>
                <div style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.7 }}>{prospect.company_brief || "Research in progress..."}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--text-3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.05em" }}>Trigger Signal</div>
                <div style={{ fontSize:13, color:"var(--text-2)", lineHeight:1.7, marginBottom:12 }}>{prospect.trigger_signal || "—"}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {prospect.linkedin_search_query && (
                    <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(prospect.linkedin_search_query)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--blue)", padding:"4px 10px", background:"rgba(74,144,226,0.1)", borderRadius:6 }}>
                      <ExternalLink size={11} /> Find on LinkedIn
                    </a>
                  )}
                  <button onClick={e => { e.stopPropagation(); onUpdate(prospect.id, { is_hot: !prospect.is_hot }); }}
                    style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--amber)", padding:"4px 10px", background:"rgba(245,166,35,0.1)", border:"none", borderRadius:6 }}>
                    <Flame size={11} /> {prospect.is_hot ? "Unmark Hot" : "Mark Hot"}
                  </button>
                  <button onClick={e => { e.stopPropagation(); onUpdate(prospect.id, { meeting_booked: true, status:"meeting_booked" }); }}
                    style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"var(--accent)", padding:"4px 10px", background:"rgba(0,229,160,0.1)", border:"none", borderRadius:6 }}>
                    <CheckCircle size={11} /> Book Meeting
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ProspectQueue() {
  const [prospects, setProspects] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getProspects({ search, status: statusFilter || undefined })
      .then(setProspects).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const handleUpdate = async (id, data) => {
    await updateProspect(id, data).catch(console.error);
    setProspects(ps => ps.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const statuses = ["", "researching", "scripted", "pushed_to_instantly", "linkedin_pending", "replied", "meeting_booked", "dead"];

  return (
    <div style={{ padding:"32px 36px" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:28, letterSpacing:"-0.02em" }}>Prospect Queue</h1>
        <p style={{ color:"var(--text-2)", marginTop:4, fontSize:13 }}>All companies the AI SDR is working on</p>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <div style={{ position:"relative", flex:1 }}>
          <Search size={14} color="var(--text-3)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
            style={{ width:"100%", padding:"10px 12px 10px 36px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text)", fontSize:13, outline:"none" }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:"10px 14px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius)", color:"var(--text)", fontSize:13, outline:"none" }}>
          {statuses.map(s => <option key={s} value={s}>{s ? STATUS_LABELS[s] : "All Statuses"}</option>)}
        </select>
      </div>

      <div style={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"var(--surface-3)", borderBottom:"1px solid var(--border)" }}>
              {["Company", "Sector", "Country", "Decision Maker", "Status", "Flags", ""].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"var(--text-3)" }}>Loading prospects...</td></tr>
            ) : prospects.length === 0 ? (
              <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"var(--text-3)" }}>No prospects yet — run the daily job to get started</td></tr>
            ) : prospects.map(p => (
              <ProspectRow key={p.id} prospect={p} onUpdate={handleUpdate} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
