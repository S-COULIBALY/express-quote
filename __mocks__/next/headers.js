// Mock pour next/headers

const cookies = () => {
  return {
    get: jest.fn((name) => ({ name, value: `mock-cookie-${name}` })),
    getAll: jest.fn(() => [{ name: 'mock-cookie', value: 'mock-value' }]),
    set: jest.fn(),
    delete: jest.fn(),
  };
};

const headers = () => {
  const headersMap = new Map([
    ['user-agent', 'mock-user-agent'],
    ['content-type', 'application/json'],
    ['accept', '*/*'],
  ]);

  return {
    get: jest.fn((name) => headersMap.get(name.toLowerCase())),
    has: jest.fn((name) => headersMap.has(name.toLowerCase())),
    entries: jest.fn(() => Array.from(headersMap.entries())),
    forEach: jest.fn((callback) => {
      headersMap.forEach((value, key) => callback(value, key));
    }),
  };
};

module.exports = {
  cookies,
  headers
}; 