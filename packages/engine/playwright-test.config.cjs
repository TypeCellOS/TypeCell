// config for https://github.com/hugomrdias/playwright-test
// This is only used to run tests that match *.browsertest.ts

// import type { RunnerOptions } from 'playwright-test'
// const NodeModulesPolyfills =
//   require("@esbuild-plugins/node-modules-polyfill").default;
// const GlobalsPolyfills =
//   require("@esbuild-plugins/node-globals-polyfill").default;

module.exports = {
  // buildConfig: {
  //   plugins: [
  //     NodeModulesPolyfills({}),
  //     GlobalsPolyfills({
  //       process: true,
  //       buffer: true,
  //       define: { "process.env.var": '"hello"' }, // inject will override define, to keep env vars you must also pass define here https://github.com/evanw/esbuild/issues/660
  //     }),
  //   ],
  // },
};
