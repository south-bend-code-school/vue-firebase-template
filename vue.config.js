const path = require('path')
const resolve = (pathToAlias) => {
  return path.resolve(__dirname, pathToAlias)
}
module.exports = {
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src'))
      .set('$common', resolve('src/components/common'))
      .set('$routed', resolve('src/components/routed'))
      .set('$admin', resolve('src/components/routed/Admin'))
      .set('$file', resolve('src/components/routed/File'))
      .set('$styles', resolve('src/global/styles'))
      .set('$vars', resolve('src/global/styles/vars.sass'))
  },
  pwa: {
    name: 'My App',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
  },
}