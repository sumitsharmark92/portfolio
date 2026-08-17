/* ============================================================
   SUMIT.SH BACKEND & API VERIFICATION TEST SUITE
   ============================================================ */

const assert = require('assert');
const db = require('../shared/backend/db.js');
const aiService = require('../shared/backend/ai-service.js');
const serverlessHandler = require('../api/index.js');

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');

  // Test 1: DB Public Content API
  console.log('1. Testing db.getContent()...');
  const content = db.getContent();
  assert.ok(content.profile, 'Profile should exist');
  assert.equal(content.profile.name, 'Sumit Sharma', 'Name should be Sumit Sharma');
  assert.ok(Array.isArray(content.projects), 'Projects should be array');
  assert.ok(content.projects.length >= 4, 'Should have at least 4 projects');
  assert.ok(Array.isArray(content.skills), 'Skills should be array');
  assert.ok(content.poll, 'Poll should exist');
  console.log('   ✓ Content API returns complete portfolio structure');

  // Test 2: Admin Authentication
  console.log('2. Testing Admin Auth & Sessions...');
  const validDefault = db.verifyAdminPassword('sumit@admin2026');
  assert.strictEqual(validDefault, true, 'Default password sumit@admin2026 should be valid');
  const invalidPass = db.verifyAdminPassword('wrongpassword123');
  assert.strictEqual(invalidPass, false, 'Invalid password should fail');

  const token = db.createSession();
  assert.ok(token && token.startsWith('sec_'), 'Token should start with sec_');
  assert.strictEqual(db.validateSession(token), true, 'Session token should be valid');
  console.log('   ✓ Admin password hashing and session tokens verified');

  // Test 3: Guestbook & Polls CRUD
  console.log('3. Testing Guestbook & Polls CRUD...');
  const entry = db.addGuestbookEntry('Test User', 'Great site!', 'https://example.com');
  assert.ok(entry.id, 'Entry should have ID');
  assert.equal(entry.name, 'Test User');

  const pinned = db.togglePinGuestbook(entry.id);
  assert.strictEqual(pinned.pinned, true, 'Entry should be pinned');

  const deleted = db.deleteGuestbookEntry(entry.id);
  assert.strictEqual(deleted, true, 'Entry should be deleted');

  const initialVotes = db.getPoll().options[0].votes;
  db.votePoll(0);
  assert.strictEqual(db.getPoll().options[0].votes, initialVotes + 1, 'Poll votes should increment');
  console.log('   ✓ Guestbook and Polls CRUD functional');

  // Test 4: AI Service Engine & Grounding
  console.log('4. Testing AI Service Engine...');
  const prompt = aiService.buildGroundingPrompt();
  assert.ok(prompt.includes('Sumit Sharma'), 'System prompt should contain Sumit Sharma');
  assert.ok(prompt.includes('Cybersecurity'), 'System prompt should contain Cybersecurity');

  const fallback1 = await aiService.generateAIReply('What are your top cybersecurity skills?');
  assert.ok(fallback1.reply.includes('SOC Operations') || fallback1.reply.includes('Wireshark'), 'Skills response should contain relevant tools');

  const fallback2 = await aiService.generateAIReply('Can I hire you for an internship?');
  assert.ok(fallback2.reply.includes('sumitsharmark92@gmail.com') || fallback2.reply.includes('internship'), 'Hire response should contain contact details');
  console.log('   ✓ AI Service grounding and heuristic engine verified');

  // Test 5: Serverless Handler (api/index.js mock)
  console.log('5. Testing Vercel serverless function router (api/index.js)...');
  
  // Mock req/res for GET /api/content
  let responseData = null;
  let responseStatus = 0;
  const mockRes = {
    setHeader: () => {},
    status: (s) => {
      responseStatus = s;
      return {
        json: (d) => { responseData = d; },
        end: () => {}
      };
    }
  };

  await serverlessHandler({
    method: 'GET',
    url: '/api/content',
    headers: { host: 'localhost:3000' }
  }, mockRes);

  assert.strictEqual(responseStatus, 200, 'GET /api/content should return 200');
  assert.strictEqual(responseData.profile.name, 'Sumit Sharma', 'Serverless handler should return content');

  // Mock req/res for POST /api/ai-chat
  await serverlessHandler({
    method: 'POST',
    url: '/api/ai-chat',
    headers: { host: 'localhost:3000' },
    body: { message: 'Tell me about SYNCVERSE' }
  }, mockRes);

  assert.strictEqual(responseStatus, 200, 'POST /api/ai-chat should return 200');
  assert.ok(responseData.reply, 'AI reply should be generated');

  console.log('   ✓ Vercel serverless function router fully operational');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
