// 引入check-versions 方法并执行
require('./check-versions')()
// 引入webpack配置文件
var config = require('../config')
// 如果没有默认的node环境就使用config里的dev配置
if (!process.env.NODE_ENV) process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
var path = require('path')
var express = require('express')
var webpack = require('webpack')
// 使用默认浏览器打开网页的插件
var opn = require('opn')
// 用于代理后端服务器将本地服务接口映射到制定服务器接口作中转app.use('/api', proxy({target: 'http://10.119.168.87:4000', changeOrigin: true}));
var proxyMiddleware = require('http-proxy-middleware')
// 引用wenpackdev文件配置
var webpackConfig = require('./webpack.dev.conf')

// 判断端口，使用node默认端口或者config内端口
var port = process.env.PORT || config.dev.port
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
// dev代理表
var proxyTable = config.dev.proxyTable

// 生成一个express应用服务
var app = express()

// 引入模拟数据
var appData = require('../data.json');
var seller = appData.seller;
var goods = appData.goods;
var ratings = appData.ratings;

// 定义一个 express路由
var apiRoutes = express.Router();
apiRoutes.get('/goods', function (req, res) {
  res.json({
    errno: 0,
    data: goods
  });
});

apiRoutes.get('/seller', function (req, res) {
  res.json({
    errno: 0,
    data: seller
  });
});

apiRoutes.get('/ratings', function (req, res) {
  res.json({
    errno: 0,
    data: ratings
  });
});

// 使用proxyMiddleware代理接口
app.use('/api', apiRoutes);

// 获取一个webpack对象（包含配置的）
var compiler = webpack(webpackConfig)

// webpack-dev-middleware作用就是，生成一个与webpack的compiler绑定的中间件，然后在express启动的服务app中调用这个中间件。
// 这个中间件的作用呢，简单总结为以下三点：通过watch mode，监听资源的变更，然后自动打包（如何实现，见下文详解);快速编译，走内存；返回中间件，支持express的use格式。特别注明：webpack明明可以用watch mode，可以实现一样的效果，但是为什么还需要这个中间件呢？
// 答案就是，第二点所提到的，采用了内存方式。如果，只依赖webpack的watch mode来监听文件变更，自动打包，每次变更，都将新文件打包到本地，就会很慢。

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  // 这里是对 webpackDevMiddleware 的一些配置，具体其他配置我们下面已经列出来了。

  //绑定中间件的公共路径,与webpack配置的路径相同
  publicPath: webpackConfig.output.publicPath,
  // 用于形成统计信息的选项
  stats: {
    colors: true,
    chunks: false
  }
})

var hotMiddleware = require('webpack-hot-middleware')(compiler)
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

module.exports = app.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
  var uri = 'http://192.168.9.156:' + port
  console.log('Listening at ' + uri + '\n')

  // when env is testing, don't need open it
  if (process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
})
