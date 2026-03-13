import React, { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Linkedin, Settings, Zap, ChevronRight, Activity, Download
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import ProspectQueue from "./pages/ProspectQueue";
import Scripts from "./pages/Scripts";
import LinkedIn from "./pages/LinkedIn";
import SettingsPage from "./pages/SettingsPage";
import ImportLeads from "./pages/ImportLeads";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/import", icon: Download, label: "Import Leads" },
  { to: "/queue", icon: Users, label: "Prospect Queue" },
  { to: "/scripts", icon: FileText, label: "Scripts" },
  { to: "/linkedin", icon: Linkedin, label: "LinkedIn Pack" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function Sidebar() {
  const loc = useLocation();
  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "var(--surface)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
      flexShrink: 0, position: "sticky", top: 0, height: "100vh"
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), var(--accent-dim))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Zap size={16} color="#0D1B2A" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--text)", letterSpacing: "-0.01em" }}>APPLORE</div>
            <div style={{ fontSize: 10, color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>AI SDR</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 0", flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 20px", margin: "2px 8px", borderRadius: 8,
              color: active ? "var(--accent)" : "var(--text-2)",
              background: active ? "rgba(0,229,160,0.08)" : "transparent",
              fontWeight: active ? 600 : 400, fontSize: 13,
              transition: "all 0.15s",
            }}>
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
            </NavLink>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
            boxShadow: "0 0 6px var(--accent)", animation: "pulse 2s infinite"
          }} />
          <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>AUTONOMOUS · LIVE</span>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "auto", background: "var(--navy)" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<ImportLeads />} />
            <Route path="/queue" element={<ProspectQueue />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/linkedin" element={<LinkedIn />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
