const assert = require('assert');
const path = require('path');
const stats = require(path.join('..', 'stats.js'));

function approx(a, b, tol = 1e-3) {
  return Math.abs(a - b) <= tol;
}

// Test 1: symmetric case (six sigma window -> Cp = Cpk = 1)
const s1 = stats.computeStats(0, 1, -3.0, 3.0);
console.log('Test1', s1);
assert(s1, 'computeStats returned null');
assert(approx(s1.cp, 1.0, 1e-6), 'cp mismatch: ' + s1.cp);
assert(approx(s1.cpk, 1.0, 1e-6), 'cpk mismatch: ' + s1.cpk);
assert(approx(s1.pctOutside, 0.26998, 0.05), 'pctOutside mismatch: ' + s1.pctOutside);
assert(approx(s1.pctInside, 99.73, 0.05), 'pctInside mismatch: ' + s1.pctInside);
assert(approx(s1.pctAbove, 0.13499, 0.01), 'pctAbove mismatch: ' + s1.pctAbove);
assert(approx(s1.pctBelow, 0.13499, 0.01), 'pctBelow mismatch: ' + s1.pctBelow);

// Test 2: narrow std -> Cp larger than 1
const s2 = stats.computeStats(10, 0.5, 8, 12);
console.log('Test2', s2);
assert(s2.cp > 1, 'cp should be > 1 for tight std');
assert(s2.cpk > 1, 'cpk should be > 1 for tight std');

console.log('All tests passed (main scenarios)');

// Test 3: invalid std should return null
const s3 = stats.computeStats(0, 0, -1, 1);
console.log('Test3 (invalid std) ->', s3);
assert.strictEqual(s3, null, 'std=0 should return null');

// Test 4: both limits above mean -> percent outside large
const s4 = stats.computeStats(0, 1, 2, 3);
console.log('Test4', s4);
assert(approx(s4.pctOutside, 97.86, 0.5), 'pctOutside mismatch: ' + s4.pctOutside);

// Test 5: inverted limits (USL < LSL) should be rejected
const s5 = stats.computeStats(0, 1, 2, -2);
console.log('Test5 (inverted limits)', s5);
assert.strictEqual(s5, null, 'inverted limits should be rejected');

console.log('All tests passed (including edge cases)');
