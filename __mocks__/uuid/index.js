// Mock simple pour uuid

// Mock pour v4
const v4 = jest.fn(() => 'mocked-uuid-v4');

// Mock pour les autres versions
const v1 = jest.fn(() => 'mocked-uuid-v1');
const v3 = jest.fn(() => 'mocked-uuid-v3');
const v5 = jest.fn(() => 'mocked-uuid-v5');

module.exports = {
  v4,
  v1,
  v3,
  v5
}; 