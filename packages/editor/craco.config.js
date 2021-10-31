const { addBeforeLoader, loaderByName } = require("@craco/craco");

// from https://github.com/vector-im/element-web/blob/661e946e60a50270d8aa7242ab29c140dff1ef2f/webpack.config.js
// and https://stackoverflow.com/questions/59319775/how-to-use-webassembly-wasm-with-create-react-app
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push(".wasm");

      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      //   const wasmLoader = {
      //     test: /\.wasm$/,
      //     exclude: /node_modules/,
      //     loaders: ["wasm-loader"],
      //   };

      //   addBeforeLoader(webpackConfig, loaderByName("file-loader"), wasmLoader);

      const wasmLoader = {
        test: /\.wasm$/,
        loader: "file-loader",
        type: "javascript/auto", // https://github.com/webpack/webpack/issues/6725
        options: {
          name: "[name].[hash:7].[ext]",
          outputPath: ".",
        },
      };
      addBeforeLoader(webpackConfig, loaderByName("file-loader"), wasmLoader);

      return webpackConfig;
    },
  },
};
