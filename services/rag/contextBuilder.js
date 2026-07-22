/**
 * YantraMitra Platform — RAG Context Builder Service
 * Ranks, fuses, and formats retrieved evidence from vector chunks, live telemetry,
 * and similar incidents into a single compact context window with explicit citation tags.
 */

function buildFusedRAGContext(hybridResult, options = {}) {
  const { queryText, intent, vectorChunks, dbContext, similarIncidents } = hybridResult;
  const sections = [];
  const sources = [];

  // Section 1: Query Intent & Scope
  sections.push(`## INTENT & SCOPE\nQuery Intent: ${intent.primaryIntent.toUpperCase()} (Confidence: ${Math.round(intent.confidence * 100)}%)`);

  // Section 2: Knowledge Base Document Chunks (Vector + BM25)
  if (vectorChunks && vectorChunks.length > 0) {
    const chunkLines = vectorChunks.map((c, idx) => {
      const sourceRef = `[Doc: ${c.docName}, Sec: ${c.section}, Pg: ${c.page || 1}]`;
      sources.push({
        id: c.id,
        name: c.docName,
        type: c.docType,
        section: c.section,
        page: c.page || 1,
        ref: sourceRef
      });
      return `### Source ${idx + 1}: ${sourceRef}\n${c.text}`;
    });
    sections.push(`## RETRIEVED KNOWLEDGE BASE EXCERPTS\n${chunkLines.join('\n\n')}`);
  }

  // Section 3: Similar Historical Incidents
  if (similarIncidents && similarIncidents.incidents && similarIncidents.incidents.length > 0) {
    const incLines = similarIncidents.incidents.map(inc => {
      const sourceRef = `[Incident: #${inc.id.slice(-8).toUpperCase()} - ${inc.title}]`;
      sources.push({
        id: inc.id,
        name: inc.title,
        type: 'Incident History',
        section: inc.stage,
        ref: sourceRef
      });
      return `- ${sourceRef}: Machine: ${inc.machineName}, Severity: ${inc.severity}, Stage: ${inc.stage}, Root Cause: "${inc.rootCause}"`;
    });
    sections.push(`## SIMILAR HISTORICAL INCIDENTS & LESSONS LEARNED\n${incLines.join('\n')}`);
  }

  // Section 4: Live PostgreSQL Telemetry Snapshot
  if (dbContext) {
    const { plants, machines, alarms, workOrders } = dbContext;
    const plantStr = (plants || []).slice(0, 5).map(p => `- ${p.name} (${p.location}): OEE ${p.oee || 'N/A'}%`).join('\n');
    const machineStr = (machines || []).slice(0, 10).map(m => `- ${m.name} (${m.plant?.name || 'Plant'}): Status ${m.status}, Health ${m.health}%, Failure Prob ${m.failureProbability || 0}%, RUL ${m.remainingUsefulLife || 0}h`).join('\n');
    const alarmStr = (alarms || []).slice(0, 5).map(a => `- [${a.severity.toUpperCase()}] ${a.title} on ${a.machine?.name}: ${a.message}`).join('\n');

    sections.push(`## LIVE TELEMETRY & DATABASE STATE\n### Facilities:\n${plantStr || 'No data'}\n\n### Key Machines:\n${machineStr || 'No data'}\n\n### Active Alarms:\n${alarmStr || 'None'}`);

    sources.push({
      id: 'db-live-snapshot',
      name: 'PostgreSQL Live Telemetry & Alarm Stream',
      type: 'Database',
      ref: '[Database: Live Telemetry & Alarms]'
    });
  }

  // Section 5: Grounding Instructions & Citation Rules
  const instructions = `## CITATION & GROUNDING RULES
1. Base your answer strictly on the retrieved knowledge excerpts, historical incidents, and live database telemetry provided above.
2. Whenever stating a factual procedure, fault root cause, temperature threshold, or metric limit, ALWAYS reference the exact source using bracketed citations like [Doc: Manual Name, Sec 2.1] or [Incident: #ID] or [Database: Live Telemetry].
3. Never invent or hallucinate unsupported citations.
4. Provide structured, actionable steps with headings, bullet points, and tables where applicable.`;

  sections.push(instructions);

  return {
    systemPrompt: sections.join('\n\n'),
    sources,
    intent: intent.primaryIntent
  };
}

module.exports = {
  buildFusedRAGContext
};
