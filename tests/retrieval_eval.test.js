/**
 * YantraMitra Platform — RAG Information Retrieval (IR) Evaluation Suite
 * Evaluates semantic retrieval quality across standard IR metrics:
 * Recall@5, Recall@10, Mean Reciprocal Rank (MRR), Normalized Discounted Cumulative Gain (nDCG), Top-1 Accuracy
 */

const assert = require('assert');
const ragService = require('../services/rag');
const vectorStore = require('../services/rag/vectorStore');

const EVAL_BENCHMARKS = [
  {
    id: 'Q1',
    query: 'What is the approved grease type Klüberplex BEV 41-822 and thermal warning threshold in sop_bearing_lubrication_v2.md?',
    expectedDoc: 'sop_bearing_lubrication_v2.md',
    expectedSection: 'Lubricant Specifications & Quantities'
  },
  {
    id: 'Q2',
    query: 'What is the procedure for CNC milling spindle overhaul and Belleville spring replacement in cnc_spindle_maintenance_manual.md?',
    expectedDoc: 'cnc_spindle_maintenance_manual.md',
    expectedSection: 'Spindle Overhaul & Bearing Replacement Procedure'
  },
  {
    id: 'Q3',
    query: 'What is the set point pressure 17.5 bar for primary boiler safety valve SV-101 in boiler_pressure_safety_protocol.md?',
    expectedDoc: 'boiler_pressure_safety_protocol.md',
    expectedSection: 'Dual Safety Valve Testing & Set Points'
  },
  {
    id: 'Q4',
    query: 'How to calibrate ASMPT SIPLACE TX2 SMT pick and place nozzle vacuum level in smt_pick_place_calibration_guide.md?',
    expectedDoc: 'smt_pick_place_calibration_guide.md',
    expectedSection: 'Vision System & Component Fiducial Alignment'
  },
  {
    id: 'Q5',
    query: 'How to resolve Fanuc robot servo alarm SRVO-062 BZAL pulse coder battery low in robotic_arm_servo_diagnostics.md?',
    expectedDoc: 'robotic_arm_servo_diagnostics.md',
    expectedSection: 'Servo Alarm Code Matrix & Troubleshooting'
  },
  {
    id: 'Q6',
    query: 'What is the low-low water level 20% cutout interlock for Thermax industrial steam boiler in boiler_pressure_safety_protocol.md?',
    expectedDoc: 'boiler_pressure_safety_protocol.md',
    expectedSection: 'Water Level Column & Low-Level Cutout Interlocks'
  },
  {
    id: 'Q7',
    query: 'What is the maximum allowed radial runout 0.003 mm at CNC spindle nose in cnc_spindle_maintenance_manual.md?',
    expectedDoc: 'cnc_spindle_maintenance_manual.md',
    expectedSection: 'Preventive Maintenance Schedule'
  },
  {
    id: 'Q8',
    query: 'What is the Gates sonic tension meter frequency 145 Hz to 155 Hz for SMT gantry belt in smt_pick_place_calibration_guide.md?',
    expectedDoc: 'smt_pick_place_calibration_guide.md',
    expectedSection: 'Placement Head X-Y Gantry Belt Tension & Servo Calibration'
  },
  {
    id: 'Q9',
    query: 'What is the ISO 10816-3 Class II vibration velocity RMS limit 2.8 mm/s in sop_bearing_lubrication_v2.md?',
    expectedDoc: 'sop_bearing_lubrication_v2.md',
    expectedSection: 'Vibration Spectrum & Thermal Thresholds'
  },
  {
    id: 'Q10',
    query: 'How to troubleshoot Alarm SRVO-023 HV overcurrent 0.45 ohm on 6-axis welding robot in robotic_arm_servo_diagnostics.md?',
    expectedDoc: 'robotic_arm_servo_diagnostics.md',
    expectedSection: 'Servo Alarm Code Matrix & Troubleshooting'
  }
];

async function runRetrievalEvaluation() {
  console.log('==================================================');
  console.log('YantraMitra RAG Information Retrieval (IR) Evaluation');
  console.log('==================================================\n');

  const stats = vectorStore.getStats();
  console.log(`Corpus Statistics:`);
  console.log(`  - Active Model    : ${stats.embeddingModel}`);
  console.log(`  - Indexed Docs    : ${stats.totalDocuments}`);
  console.log(`  - Total Chunks    : ${stats.totalChunks}`);
  console.log(`  - Storage Size    : ${stats.storageSizeKb} KB\n`);

  let top1Hits = 0;
  let recall5Hits = 0;
  let recall10Hits = 0;
  let totalReciprocalRank = 0.0;
  let totalNDCG = 0.0;

  const startEvalTime = Date.now();

  for (let bIdx = 0; bIdx < EVAL_BENCHMARKS.length; bIdx++) {
    const bm = EVAL_BENCHMARKS[bIdx];
    const results = vectorStore.similaritySearch(bm.query, 10);

    let rank = -1;
    let dcg = 0.0;

    results.forEach((res, idx) => {
      const isMatch = res.chunk.docId === bm.expectedDoc;
      if (isMatch) {
        if (rank === -1) rank = idx + 1;
        dcg += 1.0 / Math.log2(idx + 2);
      }
    });

    const idcg = 1.0 / Math.log2(2);
    const ndcg = Math.min(1.0, dcg / idcg);

    if (rank === 1) top1Hits++;
    if (rank > 0 && rank <= 5) recall5Hits++;
    if (rank > 0 && rank <= 10) recall10Hits++;

    const rr = rank > 0 ? (1.0 / rank) : 0.0;
    totalReciprocalRank += rr;
    totalNDCG += ndcg;

    const rankStr = rank > 0 ? `Rank ${rank}` : 'NOT FOUND';
    console.log(`  [${bm.id}] Query: "${bm.query.substring(0, 45)}..."`);
    console.log(`       -> Target: ${bm.expectedDoc} | Result: ${rankStr} | RR: ${rr.toFixed(2)} | nDCG: ${ndcg.toFixed(2)}`);
  }

  const evalDurationMs = Date.now() - startEvalTime;
  const numQueries = EVAL_BENCHMARKS.length;

  const top1Acc = Math.round((top1Hits / numQueries) * 1000) / 10;
  const recall5 = Math.round((recall5Hits / numQueries) * 1000) / 10;
  const recall10 = Math.round((recall10Hits / numQueries) * 1000) / 10;
  const mrr = Math.round((totalReciprocalRank / numQueries) * 1000) / 1000;
  const meanNDCG = Math.round((totalNDCG / numQueries) * 1000) / 1000;
  const avgLatency = Math.round((evalDurationMs / numQueries) * 100) / 100;

  console.log('\n==================================================');
  console.log('IR BENCHMARK SUMMARY METRICS');
  console.log('==================================================');
  console.log(`  Top-1 Accuracy : ${top1Acc}%`);
  console.log(`  Recall@5       : ${recall5}%`);
  console.log(`  Recall@10      : ${recall10}%`);
  console.log(`  MRR            : ${mrr}`);
  console.log(`  nDCG           : ${meanNDCG}`);
  console.log(`  Average Latency: ${avgLatency} ms per query`);
  console.log('==================================================\n');

  assert(top1Acc >= 80.0, `Top-1 Accuracy should be >= 80%, got ${top1Acc}%`);
  assert(recall5 >= 90.0, `Recall@5 should be >= 90%, got ${recall5}%`);
  assert(mrr >= 0.80, `MRR should be >= 0.80, got ${mrr}`);
  assert(avgLatency < 100.0, `Latency should be under 100ms, got ${avgLatency}ms`);

  console.log('All Information Retrieval (IR) Evaluation Criteria PASSED!');
}

runRetrievalEvaluation();
