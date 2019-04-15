const fs = require('fs')
const promisify = require('util.promisify')
const path = require('path')
const Handlebars = require('handlebars')
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const tplPath = path.join(__dirname, '../template/dir.tpl')
const config = require('../config/defaultConfig')
const mime = require('./mime')
const compress = require('./compress')

const source = fs.readFileSync(tplPath) // 1、后面的必须等待前面工作完才执行；2、template只用执行一次，会被缓存起来，不会每次请求都执行一次
const template = Handlebars.compile(source.toString())

module.exports = async function (req, res, filePath) {
  try {
		const stats = await stat(filePath)
		if (stats.isFile()) {
  		res.statusCode = 200
  		const contentType = mime(filePath)
  		res.setHeader('Content-Type', contentType)
  		let rs =  fs.createReadStream(filePath)
  		if (filePath.match(config.compress)) {
  			rs = compress(rs, req, res)
  		}
  		rs.pipe(res)
  	} else if (stats.isDirectory()) {
  		const files = await readdir(filePath)
      res.statusCode = 200
  		res.setHeader('Content-Type', 'text/html')
  		const dir = path.relative(config.root, filePath)
  		const data = {
  			title: path.basename(filePath),
  			dir: dir ? `/${dir}` : '',
  			files
  		}
  		res.end(template(data))
  	}
	} catch (e) {
		res.statusCode = 404
		res.setHeader('Content-Type', 'text/plain')
		res.end(`${filePath} is not a directory or file`)
		return
	}
}