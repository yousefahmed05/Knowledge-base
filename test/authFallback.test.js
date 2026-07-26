const test = require('node:test');
const assert = require('node:assert/strict');
const { authenticateAdminFallback } = require('../utils/authFallback');

test('accepts the default admin credentials', () => {
  const result = authenticateAdminFallback('admin@gmail.com', 'seif1234');
  assert.ok(result);
  assert.equal(result.role, 'admin');
});

test('rejects the wrong password', () => {
  const result = authenticateAdminFallback('admin@gmail.com', 'wrong-password');
  assert.equal(result, null);
});
