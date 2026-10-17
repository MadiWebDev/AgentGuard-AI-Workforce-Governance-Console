
export default function Page({ params }: { params: { id: string } }) {
  return (<div><h1 style={{ fontSize: 28 }}>Approve — mobile</h1><p style={{ color: "#475569", marginTop: 8 }}>Approval {params.id}. A comment is mandatory on mobile approval. Offline decisions queue locally and sync on reconnect; if already decided, the existing decision wins and is never overwritten.</p><form><label>Comment (required)<br /><textarea required rows={3} style={{ width: "100%" }} /></label><br /><button type="submit">Approve</button></form></div>);
}
