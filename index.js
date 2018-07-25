const { generateTheme } = require('css-runtime-theme');
const path = require('path');


class RuntimeThemeWebpackPlugin {
  constructor(options) {
    const defaulOptions = {
        cssFileName: 'index.css',
        withoutGrey: false, // set to true to remove rules that only have grey colors
        withoutMonochrome: false, // set to true to remove rules that only have grey, black, or white colors
        lessUrl: "https://cdnjs.cloudflare.com/ajax/libs/less.js/2.7.2/less.min.js",
        indexFileName: "index.html"
    };
    this.options = Object.assign(defaulOptions, options);
    this.generated = false;
  }

  apply(compiler) {
    const options = this.options;
    compiler.plugin("emit", function (compilation, callback) {
      const less = `
      <link rel="stylesheet/less" type="text/css" href="/color.less" />
      <script>
        window.less = {
          async: false,
          env: 'production'
        };
      </script>
      <script type="text/javascript" src="${options.lessUrl}"></script>
      `;
      if (options.indexFileName && options.indexFileName in compilation.assets) {
        const index = compilation.assets[options.indexFileName];
        let content = index.source();

        if (!content.match(/\/color\.less/g)) {
          index.source = () =>
            content.replace(less, "").replace(/<body>/gi, `<body>${less}`);
          content = index.source();
          index.size = () => content.length;
        }
      }
      if (options.generateOnce && this.colors) {
        compilation.assets["color.less"] = {
          source: () => this.colors,
          size: () => this.colors.length
        };
        return callback();
      }

      const styles = compilation.assets[options.cssFileName];
      if (styles) {
        const less = generateTheme({ ...options, source: styles.source() });
        if (options.generateOnce) {
            this.colors = less;
        }
        compilation.assets["color.less"] = {
          source: () => less,
          size: () => less.length
        };
        callback();
      } else {
          callback(new Error(`Unable to find css file: ${options.cssFileName} in build`));
      }
    });
  }
}

module.exports = RuntimeThemeWebpackPlugin;
