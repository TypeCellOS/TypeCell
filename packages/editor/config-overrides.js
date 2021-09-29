const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

// TODO: validate that this decreases bundle size
module.exports = function override(config, env) {
  config.plugins.push(
    new MonacoWebpackPlugin({
      languages: ["typescript", "css", "json", "javascript", "markdown"],
    })
  );
  return config;
};
