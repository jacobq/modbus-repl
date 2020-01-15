const {
	regToChars,
	regToStr10,
	regToStr16,
	regToHex,
	paddString,
} = require('./helpers')

class Printable {
	printPretty() {}
	printJson() {}
}

class PrintableRegisters extends Printable {
	/**
	 *
	 * @param {Array<Number>} regs
	 * @param {Number} addr
	 * @param {Number} cnt
	 */
	constructor(regs, addr, cnt) {
		super()
		this.regs = regs
		this.addr = addr
		this.cnt = cnt
	}

	printJson() {
		console.log(this.regs)
	}

	printPretty() {
		const addresses = new Array(this.cnt)
			.fill(0)
			.map((el, idx) => this.addr + idx)
			.map(el => paddString(el, 5, '0'))
		const values = this.regs.map(regToStr10)
		const hexes = this.regs.map(regToStr16).map(regToHex)
		const chars = this.regs.map(regToChars)

		for (let q = 0; q < this.cnt; ++q) {
			const addr = paddString(addresses[q], 5, ' ')
			const val = paddString(values[q], 5, ' ')
			const hex = hexes[q]
			const char = chars[q]
			console.log(`  ${addr} : ${val} | ${hex} | ${char}`)
		}
	}
}

class PrintableCoils extends Printable {
	/**
	 *
	 * @param {Array<Number>} coils
	 * @param {Number} addr
	 * @param {Number} cnt
	 */
	constructor(coils, addr, cnt) {
		super()
		this.coils = coils
		this.addr = addr
		this.cnt = cnt
	}

	printJson() {
		console.log(this.coils.slice(0, this.cnt))
	}

	printPretty() {
		const addresses = new Array(this.cnt).fill(0).map((el, idx) => this.addr + idx).map(el => paddString(el, 5, '0'))
		const values = this.coils.map(el => el ? '1' : '0').map(el => paddString(el, 5, ' '))

		for (let q = 0; q < this.cnt; ++q) {
			const addr = paddString(addresses[q], 5, ' ')
			const val = paddString(values[q], 5, ' ')
			console.log(`  ${addr} : ${val}`)
		}
	}
}

// function printCoils(coils, addr, cnt) {
// 	const addresses = new Array(cnt).fill(0).map((el, idx) => addr + idx).map(el => paddString(el, 5, '0'))
// 	const values = coils.map(el => el ? '1' : '0').map(el => paddString(el, 5, ' '))

// 	for (let q = 0; q < cnt; ++q) {
// 		const addr = paddString(addresses[q], 5, ' ')
// 		const val = paddString(values[q], 5, ' ')
// 		log(`  ${addr} : ${val}`)
// 	}

// 	if (headless) {
// 		console.log(coils.slice(0, cnt))
// 	}
// }

// function printRegs(regs, addr, cnt) {
// 	const addresses = new Array(cnt).fill(0).map((el, idx) => addr + idx).map(el => paddString(el, 5, '0'))
// 	const values = regs.map(regToStr10)
// 	const hexes = regs.map(regToStr16).map(regToHex)
// 	const chars = regs.map(regToChars)

// 	for (let q = 0; q < cnt; ++q) {
// 		const addr = paddString(addresses[q], 5, ' ')
// 		const val = paddString(values[q], 5, ' ')
// 		const hex = hexes[q]
// 		const char = chars[q]
// 		log(`  ${addr} : ${val} | ${hex} | ${char}`)
// 	}

// 	if (headless) {
// 		console.log(regs)
// 	}
// }

module.exports = {
	Printable,
	PrintableCoils,
	PrintableRegisters,
}
