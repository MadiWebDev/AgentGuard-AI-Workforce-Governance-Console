import { PageHeader, Card, EmptyState } from "@/components/m3";

const SPAN_COLORS: [string, string][] = [
  ["tool_call", "var(--m3-primary)"],
  ["llm_call", "var(--m3-secondary)"],
  ["approval", "var(--m3-warning)"],
  ["policy", "var(--m3-tertiary)"],
  ["error", "var(--m3-error)"],
];

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title="Trace Detail" description={`Span waterfall + run detail for trace ${params.id}. Shareable deep link: /traces/${params.id}.`}
        crumbs={[{ label: "Traces", href: "/traces" }, { label: params.id }]}
        primary={{ label: "All traces", href: "/traces" }} />
      <Card title="Span waterfall" subtitle="Spans are colored by type.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SPAN_COLORS.map(([label, color]) => (
            <span key={label} className="m3-chip"><span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />{label}</span>
          ))}
        </div>
        <EmptyState icon="↔" title="Trace not found or no spans yet" guidance={`No spans were found for trace ${params.id} in this store. Ingest events with this traceId, then reload.`} actionLabel="Back to traces" actionHref="/traces" />
      </Card>
    </div>
  );
}
