/**
 * YantraMitra Platform — Central Industrial Agent Orchestrator
 * Coordinates execution of 6 specialized autonomous agents via a Shared Context Bus:
 * 1. RCA Agent
 * 2. Maintenance Planner Agent
 * 3. Spare Parts & Inventory Agent
 * 4. Work Order Generation Agent
 * 5. Safety Compliance & LOTO Agent
 * 6. Reliability Engineer Agent
 * Optimized with in-memory caching for sub-millisecond multi-agent throughput.
 */

const rcaAgent = require('./rcaAgent');
const maintenancePlannerAgent = require('./maintenancePlannerAgent');
const sparePartsAgent = require('./sparePartsAgent');
const workOrderAgent = require('./workOrderAgent');
const safetyComplianceAgent = require('./safetyComplianceAgent');
const reliabilityEngineerAgent = require('./reliabilityEngineerAgent');

const mlPredictionService = require('../mlPrediction');
const ragService = require('../rag');
const prisma = require('../prisma');

let cachedMachine = null;
let cachedAlarms = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000;

class AgentOrchestrator {
  constructor() {
    this.agents = new Map([
      ['rca', rcaAgent],
      ['planner', maintenancePlannerAgent],
      ['spare_parts', sparePartsAgent],
      ['work_order', workOrderAgent],
      ['safety', safetyComplianceAgent],
      ['reliability', reliabilityEngineerAgent]
    ]);
    this.orchestratorStatus = 'ACTIVE_READY';
  }

  /**
   * Evaluates user prompt to determine required agent execution pipeline
   */
  determineAgentPipeline(queryText, userIntent = null) {
    const qLower = (queryText || '').toLowerCase();

    if (userIntent === 'safety' || qLower.includes('loto') || qLower.includes('safety') || qLower.includes('ppe')) {
      return ['safety', 'planner'];
    }
    if (userIntent === 'inventory' || qLower.includes('spare') || qLower.includes('part') || qLower.includes('inventory')) {
      return ['spare_parts', 'work_order'];
    }
    if (userIntent === 'reliability' || qLower.includes('mtbf') || qLower.includes('reliability') || qLower.includes('downtime')) {
      return ['reliability', 'rca'];
    }

    // Default Full Autonomous Dispatch Pipeline
    return ['rca', 'planner', 'spare_parts', 'work_order', 'safety', 'reliability'];
  }

  /**
   * Dispatches multi-agent collaborative execution graph with Shared Context
   */
  async dispatchMultiAgentFlow(queryText, options = {}) {
    const startClusterTime = Date.now();
    const now = Date.now();

    // 1. Gather Telemetry & ML Predictions (With 30s Caching)
    let machine = cachedMachine;
    let activeAlarms = cachedAlarms;

    if (!cachedMachine || (now - lastFetchTime > CACHE_TTL_MS)) {
      try {
        if (options.machineId) {
          machine = await prisma.machine.findUnique({
            where: { id: options.machineId },
            include: { plant: true, sensors: { take: 6 } }
          });
        }
        if (!machine) {
          machine = await prisma.machine.findFirst({
            include: { plant: true, sensors: { take: 6 } }
          });
        }

        if (machine) {
          activeAlarms = await prisma.alarm.findMany({
            where: { machineId: machine.id, status: 'active' },
            take: 5
          });
        }
        cachedMachine = machine;
        cachedAlarms = activeAlarms;
        lastFetchTime = now;
      } catch (e) {
        console.warn('[Agent Orchestrator] Telemetry fetch warning:', e.message);
      }
    }

    const mlPrediction = machine ? mlPredictionService.predictForMachine(machine) : null;

    // 2. Query Hybrid Vector RAG
    const ragResult = await ragService.queryHybridRAG(queryText, options);

    // 3. Initialize Shared Context Bus
    const sharedContext = {
      queryText,
      machine,
      mlPrediction,
      activeAlarms,
      ragKnowledge: ragResult,
      executedAgents: [],
      rcaOutput: null,
      plannerOutput: null,
      sparePartsOutput: null,
      workOrderOutput: null,
      safetyOutput: null,
      reliabilityOutput: null
    };

    // 4. Determine Execution Graph & Execute Agents
    const pipeline = this.determineAgentPipeline(queryText, options.userIntent);

    for (const agentKey of pipeline) {
      const agent = this.agents.get(agentKey);
      if (agent) {
        await agent.execute(sharedContext);
        sharedContext.executedAgents.push(agent.name);
      }
    }

    // 5. Synthesize Cohesive Unified Output (Zero Duplicate Reasoning)
    const unifiedMarkdown = this.synthesizeUnifiedAgentResponse(sharedContext);
    const groundedMarkdown = ragService.appendVerifiedCitations(unifiedMarkdown, ragResult.sources);

    const executionDurationMs = Date.now() - startClusterTime;

    return {
      success: true,
      orchestratorStatus: this.orchestratorStatus,
      targetMachine: machine?.name || 'Industrial Equipment',
      pipelineExecuted: pipeline,
      executedAgents: sharedContext.executedAgents,
      mlPredictionSummary: {
        failureProbability: mlPrediction?.failureProbability,
        remainingUsefulLife: mlPrediction?.remainingUsefulLife,
        riskLevel: mlPrediction?.riskLevel
      },
      agentOutputs: {
        rca: sharedContext.rcaOutput,
        planner: sharedContext.plannerOutput,
        spareParts: sharedContext.sparePartsOutput,
        workOrder: sharedContext.workOrderOutput,
        safety: sharedContext.safetyOutput,
        reliability: sharedContext.reliabilityOutput
      },
      sources: ragResult.sources,
      reply: groundedMarkdown,
      executionDurationMs
    };
  }

  /**
   * Synthesizes outputs from all executed agents into a structured, executive report
   */
  synthesizeUnifiedAgentResponse(sharedContext) {
    const { machine, mlPrediction, rcaOutput, plannerOutput, sparePartsOutput, workOrderOutput, safetyOutput, reliabilityOutput } = sharedContext;
    const machineName = machine?.name || 'Target Equipment';

    let markdown = `## Collaborative Multi-Agent Executive Analysis — ${machineName}\n\n`;

    if (mlPrediction) {
      markdown += `### ML Failure Risk & Telemetry Assessment\n`;
      markdown += `- **Predicted Failure Probability:** **${mlPrediction.failureProbability}%** (${(mlPrediction.riskLevel || 'LOW').toUpperCase()} RISK)\n`;
      markdown += `- **Remaining Useful Life (RUL):** **${mlPrediction.remainingUsefulLife} Days** (${Math.round(mlPrediction.remainingUsefulLife * 24)} Hours)\n`;
      if (mlPrediction.shapAttributions && mlPrediction.shapAttributions.length > 0) {
        markdown += `- **Primary Feature Contributors:** ${mlPrediction.shapAttributions.slice(0, 3).map(s => `**${s.feature}** (+${s.impact}%)`).join(', ')}\n\n`;
      } else {
        markdown += `\n`;
      }
    }

    if (rcaOutput) {
      markdown += `### 1. Root Cause Analysis (RCA Agent)\n`;
      markdown += `- **Primary Symptom:** ${rcaOutput.primarySymptom}\n`;
      markdown += `- **Probable Failure Cause:** **${rcaOutput.probableRootCause}** (Confidence: ${Math.round(rcaOutput.confidenceScore * 100)}%)\n`;
      markdown += `- **Evidence Attributions:** ${rcaOutput.evidenceSummary}\n\n`;
    }

    if (plannerOutput) {
      markdown += `### 2. Precision Maintenance Execution Plan (Planner Agent)\n`;
      markdown += `- **Estimated Downtime Duration:** **${plannerOutput.estimatedDowntimeHours} Hours**\n`;
      markdown += `- **Required Staffing:** ${plannerOutput.requiredTechnicians} x ${plannerOutput.requiredSkillLevel}\n`;
      markdown += `- **Required Tooling Package:** ${plannerOutput.requiredTools.join(', ')}\n`;
      markdown += `- **Task Sequence:**\n${plannerOutput.taskSequence.map(t => `  - ${t}`).join('\n')}\n\n`;
    }

    if (sparePartsOutput) {
      markdown += `### 3. Spare Parts & Bill of Materials (Spare Parts Agent)\n`;
      markdown += `| Part Number | Description | Required | Stock | Location | Alternative |\n`;
      markdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      sparePartsOutput.recommendedParts.forEach(p => {
        markdown += `| \`${p.partNumber}\` | ${p.partName} | ${p.quantityRequired} | ${p.quantityInStock} (${p.inStock ? 'Available' : 'Out of Stock'}) | ${p.location} | ${p.alternativePart || 'N/A'} |\n`;
      });
      markdown += `\n`;
    }

    if (workOrderOutput) {
      markdown += `### 4. Generated Work Order (Work Order Agent)\n`;
      markdown += `- **Work Order ID:** **\`${workOrderOutput.workOrderNumber}\`** (${workOrderOutput.priority} PRIORITY)\n`;
      markdown += `- **Title:** ${workOrderOutput.title}\n`;
      markdown += `- **Assigned Role:** ${workOrderOutput.skillLevelRequired} (${workOrderOutput.assignedTechnicians} Techs)\n\n`;
    }

    if (safetyOutput) {
      markdown += `### 5. Safety Compliance & LOTO Audit (Safety Compliance Agent)\n`;
      markdown += `- **Compliance Status:** **${safetyOutput.complianceStatus}**\n`;
      markdown += `- **LOTO Zero-Energy State:** ${safetyOutput.lotoVerified ? 'VERIFIED' : 'REQUIRED'}\n`;
      markdown += `- **Mandatory Directives:**\n${safetyOutput.safetyDirectives.map(d => `  - ${d}`).join('\n')}\n`;
      markdown += `- **Required PPE:** ${safetyOutput.requiredPPE.join(', ')}\n\n`;
    }

    if (reliabilityEngineerAgent && reliabilityOutput) {
      markdown += `### 6. Asset Reliability Optimization (Reliability Engineer Agent)\n`;
      markdown += `- **Estimated MTBF:** **${reliabilityOutput.estimatedMTBFHours} Hours** | **Estimated MTTR:** **${reliabilityOutput.estimatedMTTRHours} Hours**\n`;
      markdown += `- **Operational Availability:** **${reliabilityOutput.availabilityPercentage}%**\n`;
      markdown += `- **MTBF Recommendations:**\n${reliabilityOutput.reliabilityRecommendations.map(r => `  - ${r}`).join('\n')}\n`;
    }

    return markdown;
  }

  getAgentList() {
    const list = [];
    this.agents.forEach(agent => {
      list.push({
        agentId: agent.agentId,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities
      });
    });
    return list;
  }
}

module.exports = new AgentOrchestrator();
