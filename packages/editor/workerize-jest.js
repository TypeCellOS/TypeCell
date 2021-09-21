module.exports = {
  process(src, filename) {
    return `
        async function asyncify() { return this.apply(null, arguments); }
        module.exports = function() {
          const w = require(${JSON.stringify(filename.replace(/^.+!/, ""))});
          const m = {};
          for (let i in w) m[i] = asyncify.bind(w[i]);
          return m;
        };
      `;
  },
};
