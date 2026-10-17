"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/m3";

function DensitySetting() {
  const [density, setDensity] = useState("comfortable");
  useEffect(() => { setDensity(localStorage.getItem("ag-density") ?? "comfortable"); }, []);
  function set(d: string) {
    localStorage.setItem("ag-density", d);
    document.documentElement.dataset.density = d;
    setDensity(d);
  }
  return (
    <div>
      <p className="m3-body-md" style={{ marginTop: 0 }}>Density changes spacing across the console and persists on this device.</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className={`m3-btn ${density === "comfortable" ? "m3-btn-filled" : "m3-btn-outlined"}`} onClick={() => set("comfortable")}>Comfortable</button>
        <button type="button" className={`m3-btn ${density === "compact" ? "m3-btn-filled" : "m3-btn-outlined"}`} onClick={() => set("compact")}>Compact</button>
      </div>
      <p className="m3-body-md" role="status">Current density: {density}</p>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <PageHeader title="Settings — Security" description="Two-factor authentication, session policy, and display density. Changes here are audit-logged." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
      <Card title="Display density"><DensitySetting /></Card>
      <Card title="Security controls"><p className="m3-body-md" style={{ margin: 0 }}>Two-factor authentication and session timeout are enforced server-side in production.</p></Card>
      <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)" }}>Demo UI — mutations call authorize() on the server in production.</p>
    </div>
  );
}
