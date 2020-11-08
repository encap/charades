module.exports = {
  css: {
    loaderOptions: {
      sass: {
        prependData: '\n@import "@/global.sass"\n',
        sassOptions: {
          indentedSyntax: true,
        },
      },
    },
  },
  configureWebpack: {
    devServer: {
      headers: { 'Access-Control-Allow-Origin': '*' },
    },
  },
};
