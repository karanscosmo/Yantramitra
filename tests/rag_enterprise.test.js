/**
 * YantraMitra Platform — Enterprise Hybrid Vector RAG Automated Test Suite
 * Tests: Document Extraction, Chunking, Embedding Generation, Vector Search, Hybrid Retrieval,
 *        Intent Detection, Citations, Incremental Indexing, Similar Incidents, Fallback, Performance Benchmark
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ragService = require('../services/rag');
const { extractDocumentContent } = require('../services/rag/documentExtractor');
const { chunkDocument } = require('../services/rag/textChunker');
const { generateEmbedding, cosineSimilarity } = require('../services/rag/embeddingGenerator');
const { detectQueryIntent } = require('../services/rag/intentDetector');
const { retrieveSimilarIncidents } = require('../services/rag/similarIncidentRetriever');
const { appendVerifiedCitations } = require('../services/rag/citationEngine');

async function runRAGTests() {
  console.log('==================================================');
  console.log('YantraMitra Enterprise Hybrid Vector RAG Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`  [PASS] ${name}`);
        passed++;
      })
      .catch(err => {
        console.error(`  [FAIL] ${name}`);
        console.error(`         Error: ${err.message}`);
        failed++;
      });
  }

  // Test 1: Document Extraction
  await test('1. Document Extraction & Structural Header Parsing', async () => {
    const samplePath = path.join(__dirname, '..', 'data', 'knowledge_base', 'sop_bearing_lubrication_v2.md');
    const result = await extractDocumentContent(samplePath, { fileName: 'sop_bearing_lubrication_v2.md' });
    assert(result.text, 'Extracted text should not be empty');
    assert(result.metadata.sections.length > 0, 'Structural sections should be parsed');
  });

  // Test 2: Intelligent Chunking & Metadata
  await test('2. Intelligent Semantic Chunking & Metadata Retention', () => {
    const sampleText = `# Section 1\n` + 'Paragrah text content for testing chunking. '.repeat(100) + `\n\n# Section 2\n` + 'More detailed SOP information. '.repeat(100);
    const chunks = chunkDocument(sampleText, { docName: 'test_sop.md', docType: 'md' });
    assert(chunks.length > 0, 'Chunks array should contain items');
    assert(chunks[0].tokenCount > 0, 'Token count should be calculated');
    assert(chunks[0].section, 'Section metadata should be retained');
  });

  // Test 3: Embedding Vector Generation & Cosine Similarity
  await test('3. Dense Vector Embedding Generation & Cosine Similarity', () => {
    const vecA = generateEmbedding('bearing lubrication grease thermal overheating');
    const vecB = generateEmbedding('bearing grease temperature thermal inspection');
    const vecC = generateEmbedding('financial invoice accounting taxes');

    const simAB = cosineSimilarity(vecA, vecB);
    const simAC = cosineSimilarity(vecA, vecC);

    assert(vecA.length === 384, `Vector dimension must be 384, got ${vecA.length}`);
    assert(simAB > simAC, `Related terms similarity (${simAB.toFixed(3)}) should be higher than unrelated (${simAC.toFixed(3)})`);
  });

  // Test 4: Vector DB Operations & Incremental Indexing
  await test('4. Vector DB Indexing, Retrieval & Incremental Updating', () => {
    const testDoc = { id: 'test_doc_1.md', name: 'Test SOP', type: 'md' };
    const testChunks = [
      { text: 'Bearing lubrication procedure using Mobilith SHC 220 grease at 75C warning threshold.', docName: 'test_doc_1.md', section: 'Lubrication' }
    ];

    const indexedCount = ragService.vectorStore.addDocumentChunks(testDoc, testChunks);
    assert(indexedCount === 1, 'Should index 1 chunk');

    const results = ragService.vectorStore.similaritySearch('Mobilith grease lubrication', 3);
    assert(results.length > 0, 'Similarity search should return matched chunk');
  });

  // Test 5: Intent Detection
  await test('5. Operational Query Intent Classification', () => {
    const i1 = detectQueryIntent('What is the root cause of bearing vibration spike and overheating fault?');
    const i2 = detectQueryIntent('How to perform LOTO lockout procedure for maintenance?');

    assert.strictEqual(i1.primaryIntent, 'diagnostics', `Expected diagnostics, got ${i1.primaryIntent}`);
    assert.strictEqual(i2.primaryIntent, 'sop', `Expected sop, got ${i2.primaryIntent}`);
  });

  // Test 6: Similar Incident Retrieval
  await test('6. Historical Similar Incident Retrieval', async () => {
    const res = await retrieveSimilarIncidents('vibration bearing fatigue', null, 3);
    assert(Array.isArray(res.incidents), 'Incidents array should be returned');
  });

  // Test 7: Hybrid Retrieval & Grounded Context Construction
  await test('7. Multi-Stream Hybrid Retrieval & Grounded Context Builder', async () => {
    const res = await ragService.queryHybridRAG('What is the recommended grease type and thermal warning threshold for bearings?');
    assert(res.success === true, 'Hybrid RAG query should succeed');
    assert(res.systemPrompt.includes('RETRIEVED KNOWLEDGE BASE EXCERPTS'), 'System prompt should include retrieved excerpts');
    assert(res.sources.length > 0, 'Grounded sources should be attached');
  });

  // Test 8: Citation Verification & Grounding
  await test('8. Citation Engine Grounding & Verification', () => {
    const rawReply = 'According to [Doc: sop_bearing_lubrication_v2.md, Sec: 2], use Klüberplex BEV 41-822 grease.';
    const sources = [{ id: '1', name: 'sop_bearing_lubrication_v2.md', type: 'SOP', ref: '[Doc: sop_bearing_lubrication_v2.md, Sec: 2]' }];

    const verified = appendVerifiedCitations(rawReply, sources);
    assert(verified.includes('Grounded Sources & Evidence'), 'Formatted citation header should be appended');
  });

  // Test 9: RAG Admin Endpoints & System Status
  await test('9. RAG Administration Health & Stats Endpoint Integration', () => {
    const status = ragService.getRAGStatus();
    assert(status.initialized === true, 'RAG service should be initialized');
    assert(status.totalChunks > 0, 'Vector store should contain indexed chunks');
  });

  // Test 10: Performance Benchmark (< 100ms)
  await test('10. Hybrid Vector RAG Retrieval Performance Benchmark (< 100ms)', async () => {
    const iterations = 50;
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      await ragService.queryHybridRAG('spindle bearing overhaul procedure');
    }
    const elapsed = Date.now() - start;
    const avgMs = elapsed / iterations;
    console.log(`         [RAG Benchmark] ${iterations} RAG queries executed in ${elapsed}ms (Avg: ${avgMs.toFixed(2)}ms per query)`);
    assert(avgMs < 100, `Average RAG latency must be sub-100ms, achieved ${avgMs.toFixed(2)}ms`);
  });

  console.log('\n==================================================');
  console.log(`RAG Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runRAGTests();
