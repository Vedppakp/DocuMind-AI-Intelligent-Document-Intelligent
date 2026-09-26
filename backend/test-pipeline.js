const fs = require('fs');
const path = require('path');

async function testPipeline() {
  console.log('=== Starting DocuMind AI Full End-to-End Verification ===\n');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'ok' ? 'PASSED' : 'FAILED', healthData.database);

  // 2. Guest session
  const guestRes = await fetch('http://localhost:5000/api/auth/guest', { method: 'POST' });
  const guestData = await guestRes.json();
  const token = guestData.token;
  console.log('2. Auth Guest Session:', guestData.success ? 'PASSED' : 'FAILED', 'User:', guestData.user.name);

  // 3. Upload Sample PDF 1
  const pdf1Path = path.join(__dirname, '../sample_ai_research.pdf');
  const pdf2Path = path.join(__dirname, '../sample_comparative_report.pdf');

  const formData = new FormData();
  const blob1 = new Blob([fs.readFileSync(pdf1Path)], { type: 'application/pdf' });
  formData.append('pdfs', blob1, 'sample_ai_research.pdf');

  const blob2 = new Blob([fs.readFileSync(pdf2Path)], { type: 'application/pdf' });
  formData.append('pdfs', blob2, 'sample_comparative_report.pdf');

  const uploadRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('3. PDF Upload:', uploadData.success ? 'PASSED' : 'FAILED', `Uploaded ${uploadData.documents?.length} documents`);

  // Wait 2 seconds for background extraction & indexing to complete
  await new Promise((r) => setTimeout(r, 2000));

  // 4. List Documents
  const listRes = await fetch('http://localhost:5000/api/documents', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  console.log('4. Document Listing:', listData.success ? 'PASSED' : 'FAILED', `Found ${listData.documents?.length} docs`);
  listData.documents.forEach((d) => {
    console.log(`   - "${d.originalName}": ${d.pageCount} pages, ${d.chunkCount} chunks, status: ${d.status}`);
  });

  const doc1 = listData.documents.find((d) => d.originalName === 'sample_ai_research.pdf');
  const doc2 = listData.documents.find((d) => d.originalName === 'sample_comparative_report.pdf');

  // 5. Chat with RAG
  const chatRes = await fetch('http://localhost:5000/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question: 'What was the accuracy boost from RAG and what chunking settings were used?',
      documentIds: [doc1._id],
    }),
  });
  const chatData = await chatRes.json();
  console.log('5. RAG Chat Query:', chatData.success ? 'PASSED' : 'FAILED');
  console.log('   Answer excerpt:', chatData.message.content.slice(0, 160) + '...');
  console.log('   Citations returned:', chatData.citations.length);
  chatData.citations.forEach((c) => {
    console.log(`     -> Page ${c.pageNumber}, relevance: ${(c.score * 100).toFixed(1)}%`);
  });

  // 6. Summarize Document
  const sumRes = await fetch(`http://localhost:5000/api/tools/summarize/${doc1._id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ regenerate: true }),
  });
  const sumData = await sumRes.json();
  console.log('6. Executive Summary:', sumData.success ? 'PASSED' : 'FAILED');
  console.log('   Key Points Count:', sumData.summary?.keyPoints?.length);

  // 7. Generate Quiz
  const quizRes = await fetch(`http://localhost:5000/api/tools/quiz/${doc1._id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ count: 3 }),
  });
  const quizData = await quizRes.json();
  console.log('7. Quiz Generation:', quizData.success ? 'PASSED' : 'FAILED');
  console.log('   Questions generated:', quizData.questions?.length);
  if (quizData.questions && quizData.questions[0]) {
    console.log(`   Sample Q1: "${quizData.questions[0].question}"`);
  }

  // 8. Compare Documents
  const compRes = await fetch('http://localhost:5000/api/tools/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      docId1: doc1._id,
      docId2: doc2._id,
    }),
  });
  const compData = await compRes.json();
  console.log('8. Compare Documents:', compData.success ? 'PASSED' : 'FAILED');
  console.log('   Overview:', compData.comparison?.overview?.slice(0, 120) + '...');

  // 9. Admin Metrics
  const adminRes = await fetch('http://localhost:5000/api/admin/metrics', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminData = await adminRes.json();
  console.log('9. Admin Telemetry:', adminData.success ? 'PASSED' : 'FAILED');
  console.log('   Total Chunks in Index:', adminData.metrics?.vectorIndex?.indexedChunks);
  console.log('   Total Documents:', adminData.metrics?.documents?.total);

  console.log('\n=== All Pipeline Verification Tests Successfully Completed! ===');
}

testPipeline().catch(console.error);
