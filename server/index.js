const fs = require('fs')
const Koa = require('koa')
const cors = require('koa2-cors')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')

const app = new Koa()
const router = new Router()

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = app.env !== 'production'

function createMiddleware(){
  app.use(bodyParser())
  //设置全局返回头
  app.use(cors({
    origin: function(ctx) {
      return '*';//cors
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 1800,
    credentials: true,
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })) 
}

function createRouter(){
  //注册路由
  let urls = fs.readdirSync(__dirname + '/routes')
  urls.forEach((element) => {
    let module = require(__dirname + '/routes/' + element)
    //routes里的文件名作为 路由名
    router.use('/' + element.replace('.js', ''), module.routes())
  })
  //使用路由
  app.use(router.routes()).use(router.allowedMethods())
}

async function start () {
  // Instantiate nuxt.js
  const nuxt = new Nuxt(config)

  const {
    host = process.env.HOST || '127.0.0.1',
    port = process.env.PORT || 3000
  } = nuxt.options.server

  await nuxt.ready()
  // Build in development
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }
  createMiddleware()
  createRouter()
  app.use((ctx) => {
    ctx.status = 200
    ctx.respond = false // Bypass Koa's built-in response handling
    ctx.req.ctx = ctx // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
    nuxt.render(ctx.req, ctx.res)
  })
  
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}

start()
