// Polyfill for self in SSR environments
if (typeof self === 'undefined') {
  global.self = global
}
