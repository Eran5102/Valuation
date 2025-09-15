// Jest polyfills for browser APIs not available in Node.js test environment

// TextEncoder/TextDecoder polyfill for Node.js
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Fetch polyfill
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
  global.Headers = require('node-fetch').Headers;
  global.Request = require('node-fetch').Request;
  global.Response = require('node-fetch').Response;
}

// URL polyfill
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
  global.URLSearchParams = require('url').URLSearchParams;
}

// FormData polyfill
if (typeof global.FormData === 'undefined') {
  global.FormData = require('form-data');
}

// Crypto polyfill for browser crypto API
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: (arr) => {
      return crypto.randomFillSync(arr);
    },
    randomUUID: crypto.randomUUID,
  };
}

// IntersectionObserver mock
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

// ResizeObserver mock
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };
}

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// scrollIntoView mock
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}

// getBoundingClientRect mock
if (typeof Element !== 'undefined') {
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 120,
    height: 120,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  }));
}

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock localStorage and sessionStorage
const createStorage = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
});

Object.defineProperty(window, 'localStorage', {
  value: createStorage(),
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorage(),
  writable: true,
});

// Mock console methods in tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  // Only suppress console.log and console.info, keep error and warn for debugging
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
  };
}