const fs = require('fs')
module.exports = async function (req, res, filePath) {
  try {
		const stats = await fs.stat(filePath)
		if (stats.isFile()) {
  		res.statusCode = 200
  		res.setHeader('Content-Type', 'text-plain')
  		fs.createReadStream(filePath).pipe(res)
  	} else if (stats.isDirectory()) {
  		const files = await fs.readdir(filePath)
      res.statusCode = 200
  		res.setHeader('Content-Type', 'text-plain')
  		res.end(files.join(','))
  	}
	} catch (e) {
		res.statusCode = 404
		res.setHeader('Content-Type', 'text/plain')
		res.end(`${filePath} is not a directory or file`)
		return
	}
}