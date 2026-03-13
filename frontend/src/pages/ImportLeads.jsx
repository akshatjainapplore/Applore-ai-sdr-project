import React, { useState, useEffect } from "react";
import { Download, Upload, Zap, Check, AlertCircle, Loader2 } from "lucide-react";

export default function ImportLeads() {
  const [method, setMethod] = useState("api"); // 'api' or 'csv'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [campaignId, setCampaignId] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  const handleApiImport = async () => {
    setLoading(true);
    setResults(null);
    setError(null);
    try {
      // 1. Fetch leads from Instantly (via our backend helper)
      const listRes = await fetch(`${API_BASE}/instantly/leads?campaignId=${campaignId}`);
      if (!listRes.ok) throw new Error("Failed to fetch leads from Instantly");
      const leadsData = await listRes.json();
      
      // Filter for leads with email
      const validLeads = leadsData.filter(l => l.email).map(l => ({
        email: l.email,
        firstName: l.first_name,
        lastName: l.last_name,
        companyName: l.company_name,
        website: l.website
      }));

      if (validLeads.length === 0) throw new Error("No leads with verified emails found in this campaign.");

      // 2. Submit to our import endpoint
      const importRes = await fetch(`${API_BASE}/prospects/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: validLeads })
      });
      
      const data = await importRes.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split("\n").map(r => r.split(","));
        const headers = rows[0].map(h => h.trim().toLowerCase());
        
        const emailIdx = headers.indexOf("email");
        const fnameIdx = headers.indexOf("first_name");
        const lnameIdx = headers.indexOf("last_name");
        const compIdx = headers.indexOf("company_name");
        const webIdx = headers.indexOf("website");

        if (emailIdx === -1 || compIdx === -1) {
          throw new Error("CSV must contain at least 'email' and 'company_name' columns.");
        }

        const leads = rows.slice(1).filter(r => r[emailIdx]).map(r => ({
          email: r[emailIdx]?.trim(),
          firstName: r[fnameIdx]?.trim(),
          lastName: r[lnameIdx]?.trim(),
          companyName: r[compIdx]?.trim(),
          website: r[webIdx]?.trim()
        }));

        const importRes = await fetch(`${API_BASE}/prospects/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads })
        });
        
        const data = await importRes.json();
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text)", marginBottom: 12 }}>
          Import Leads
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: 16 }}>
          Pull verified leads from Instantly to start the AI SDR enrichment pipeline.
        </p>
      </header>

      <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
        <button 
          onClick={() => setMethod("api")}
          style={{
            flex: 1, padding: "20px", borderRadius: 16, border: "2px solid",
            borderColor: method === "api" ? "var(--accent)" : "var(--border)",
            background: method === "api" ? "rgba(0,229,160,0.05)" : "var(--surface)",
            color: "var(--text)", textAlign: "left", cursor: "pointer", transition: "all 0.2s"
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Zap size={20} color={method === "api" ? "var(--accent)" : "var(--text-2)"} />
            <span style={{ fontWeight: 600 }}>Instantly API</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-2)" }}>Fetch directly from your active campaigns.</p>
        </button>

        <button 
          onClick={() => setMethod("csv")}
          style={{
            flex: 1, padding: "20px", borderRadius: 16, border: "2px solid",
            borderColor: method === "csv" ? "var(--accent)" : "var(--border)",
            background: method === "csv" ? "rgba(0,229,160,0.05)" : "var(--surface)",
            color: "var(--text)", textAlign: "left", cursor: "pointer", transition: "all 0.2s"
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Upload size={20} color={method === "csv" ? "var(--accent)" : "var(--text-2)"} />
            <span style={{ fontWeight: 600 }}>CSV Upload</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-2)" }}>Upload an export file from Instantly.</p>
        </button>
      </div>

      <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", padding: 40 }}>
        {method === "api" ? (
          <div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>Campaign ID</label>
              <input 
                type="text" 
                placeholder="e.g. a037c44a-70f3-4279-8c5c-414fc2951806"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10, background: "var(--navy)",
                  border: "1px solid var(--border)", color: "var(--text)", outline: "none"
                }}
              />
            </div>
            <button 
              onClick={handleApiImport}
              disabled={loading || !campaignId}
              style={{
                width: "100%", padding: "14px", borderRadius: 12, background: "var(--accent)",
                color: "var(--navy)", fontWeight: 700, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: loading || !campaignId ? 0.6 : 1
              }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {loading ? "Importing..." : "Fetch & Process Leads"}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Upload size={40} color="var(--text-3)" style={{ marginBottom: 16 }} />
            <p style={{ color: "var(--text-2)", marginBottom: 24 }}>Select your Instantly export CSV</p>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCsvUpload}
              style={{ display: "none" }}
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload"
              style={{
                padding: "12px 24px", borderRadius: 10, border: "1px solid var(--accent)",
                color: "var(--accent)", cursor: "pointer", fontWeight: 600
              }}>
              Choose File
            </label>
          </div>
        )}

        {results && (
          <div style={{ marginTop: 40, padding: 24, borderRadius: 16, background: "rgba(0,229,160,0.1)", border: "1px solid var(--accent)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Check size={20} color="var(--accent)" />
              <h3 style={{ fontWeight: 600, color: "var(--text)" }}>Import Successful!</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Imported</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{results.imported}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Duplicates Skipped</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-2)" }}>{results.skipped}</div>
              </div>
            </div>
            {results.errors?.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 12, color: "#ff4d4d", marginBottom: 8 }}>Errors:</div>
                {results.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: "var(--text-2)" }}>• {e}</div>)}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "rgba(255,77,77,0.1)", border: "1px solid #ff4d4d", display: "flex", gap: 12 }}>
            <AlertCircle size={18} color="#ff4d4d" />
            <span style={{ fontSize: 13, color: "#ff4d4d" }}>{error}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 40, color: "var(--text-3)", fontSize: 12, textAlign: "center" }}>
        Note: Imported leads will automatically start the AI research and sequence generation pipeline.
      </div>
    </div>
  );
}
