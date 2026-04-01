/**
 * MinHeap Unit Test
 * Run:  node utils/MinHeap.test.js
 */
const MinHeap = require('./MinHeap');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✅  ${label}`); }
  else           { failed++; console.error(`  ❌  ${label}`); }
}

console.log('\n🧪  MinHeap Unit Tests\n');

// Test 1 — insert & extractMin always returns the smallest
(() => {
  const h = new MinHeap();
  h.insert(5); h.insert(3); h.insert(8); h.insert(1); h.insert(4);
  assert(h.extractMin() === 1, 'extractMin returns 1 (smallest)');
  assert(h.extractMin() === 3, 'extractMin returns 3 (next smallest)');
  assert(h.extractMin() === 4, 'extractMin returns 4');
  assert(h.extractMin() === 5, 'extractMin returns 5');
  assert(h.extractMin() === 8, 'extractMin returns 8');
  assert(h.extractMin() === null, 'extractMin on empty returns null');
})();

// Test 2 — size & peek
(() => {
  const h = new MinHeap();
  assert(h.size() === 0, 'size is 0 on new heap');
  assert(h.peek() === null, 'peek on empty returns null');
  h.insert(10); h.insert(2);
  assert(h.size() === 2, 'size is 2 after two inserts');
  assert(h.peek() === 2, 'peek returns 2 (smallest)');
})();

// Test 3 — values() returns sorted copy
(() => {
  const h = new MinHeap();
  [7, 2, 9, 4, 1].forEach(v => h.insert(v));
  const vals = h.values();
  assert(JSON.stringify(vals) === '[1,2,4,7,9]', 'values() returns sorted array');
})();

// Test 4 — simulates parking-lot slot allocation
(() => {
  const h = new MinHeap();
  for (let i = 1; i <= 20; i++) h.insert(i);
  assert(h.extractMin() === 1, 'nearest slot is 1');
  assert(h.extractMin() === 2, 'next nearest is 2');
  // Return slot 1 (vehicle left)
  h.insert(1);
  assert(h.extractMin() === 1, 'slot 1 available again after re-insert');
})();

console.log(`\n📊  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
