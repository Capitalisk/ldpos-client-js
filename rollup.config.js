const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');
const inject = require('@rollup/plugin-inject');
const nodePolyfills = require('rollup-plugin-node-polyfills');

module.exports = {
  input: 'esm.js',
  output: {
    file: 'module.js',
    format: 'es'
  },
  onwarn: (warning, warn) => {
    // Ignore circular dependency warnings from node_modules
    if (warning.code === 'CIRCULAR_DEPENDENCY' && /node_modules/.test(warning.message)) {
      return;
    }
    warn(warning);
  },
  plugins: [
    commonjs(),
    nodePolyfills(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    json(),
    terser()
  ]
};
