const fs = require('fs')
const promisify = require('util.promisify')
const path = require('path')
const Handlebars = require('handlebars')
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const tplPath = path.join(__dirname, '../template/dir.tpl')
const mime = require('./mime')
const compress = require('./compress')
const range = require('./range')
const isFresh = require('./cache')

const source = fs.readFileSync(tplPath) // 1、后面的必须等待前面工作完才执行；2、template只用执行一次，会被缓存起来，不会每次请求都执行一次
const template = Handlebars.compile(source.toString())

module.exports = async function (req, res, filePath, config) {
  try {
		const stats = await stat(filePath)
		if (stats.isFile()) {
  		res.statusCode = 200
  		const contentType = mime(filePath)
  		res.setHeader('Content-Type', contentType)

  		if (isFresh(stats, req, res)) {
  			res.statusCode = 304
  			res.end()
  			return
  		}

  		let rs
  		const {code, start, end} = range(stats.size, req, res)
  		if (code === 200) {
  			rs = fs.createReadStream(filePath)
  		} else {
  			rs = fs.createReadStream(filePath, {start, end})
  		}
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