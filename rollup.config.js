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
