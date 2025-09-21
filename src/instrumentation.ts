export async function register() {
  // Polyfill self for SSR environments
  if (typeof self === 'undefined') {
    ;(global as any).self = global
  }
}
