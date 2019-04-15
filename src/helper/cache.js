const {cache} = require('../config/defaultConfig')

function refreshRes(stats, res) {
	const {maxAge, expires, cacheControl, lastModified, etag} = cache
	if (expires) {
		res.setHeader('Expires', (new Date(Date.now() + maxAge * 1000)).toUTCString())
	}

	if (cacheControl) {
		res.setHeader('Cache-Control', `public, max-age=${maxAge}`)
	}

	if (lastModified) {
		res.setHeader('Last-Modified', stats.mtime.toUTCString())
	}

	if (etag) {
		// let num = Math.floor(Math.random() * Math.floor(1000))
		// console.log(num) // 浏览器会将上一次请求的response headers中缓存先关的数据缓存起来，供下一次request使用
		res.setHeader('Etag', `${stats.size}-${stats.mtime}`)
	}
}

module.exports = function isFresh(stats, req, res) {
	refreshRes(stats, res)

	const lastModified = req.headers['if-modified-since']
	const etag = req.headers['if-none-match']
	if (!lastModified && !etag) {
		return false
	}

	if (lastModified && lastModified !== res.getHeader('Last-Modified')) {
		return false
	}

	if (etag && etag !== res.getHeader('Etag')) {
		return false
	}

	return true
}