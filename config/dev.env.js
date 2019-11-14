var merge = require('webpack-merge')
var prodEnv = require('./prod.env')
// dev环境覆盖prod环境
module.exports = merge(prodEnv, {
  NODE_ENV: '"development"'
})
