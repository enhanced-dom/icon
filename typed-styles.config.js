const configs = require('@enhanced-dom/webpack').configs

module.exports = configs.typedStylesConfigFactory({raw: true, filesPaths: ["./demo/app.pcss"]})
