
function valToChar(val) {
	if (val < 33 || val > 126) {
		return '.'
	}

	return String.fromCharCode(val)
}

function regToChars(el) {
	const buf = Buffer.alloc(2)
	buf.writeUInt16BE(el, 0)
	return valToChar(buf[0]) + valToChar(buf[1])
}

function regToStr10(el) {
	return el.toString(10)
}

function regToStr16(el) {
	return el.toString(16)
}

function regToHex(el) {
	const elUpper = el.toUpperCase()
	const elPadded = paddString(elUpper, 4, '0')
	return `0x${elPadded}`
}

function paddString(val, len, char) {
	const str = `${val}`
	const arrLen = len - str.length + 1

	if (arrLen > 0) {
		const padding = new Array(arrLen).fill('').join(char)
		return `${padding}${str}`
	} else {
		return str
	}
}

module.exports = {
	valToChar,
	regToChars,
	regToStr10,
	regToStr16,
	regToHex,
	paddString,
}