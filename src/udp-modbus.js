const EventEmitter = require('events')
const dgram = require('dgram')

const READ_COILS = 1
const READ_DISCRETE_INPUTS = 2
const READ_MULTIPLE_HOLDING_REGISTERS = 3
const READ_INPUT_REGISTERS = 4
const WRITE_SINGLE_COIL = 5
const WRITE_SINGLE_HOLDING_REGISTER = 6
const WRITE_MULTIPLE_COILS = 15
const WRITE_MULTIPLE_HOLDING_REGISTERS = 16

class UdpModbus extends EventEmitter {

	constructor(host, port) {
		super()
		this.uniqueTransactionId = 0
		this.host = host
		this.port = Number(port)
		this.socket = dgram.createSocket('udp4')
	}

	connect() {
		if (!this.socket) {
			this.emit('error', new Error('socket is not initialized'))
			return
		}

		this.socket.bind(() => {
			this.emit('connect')
		})
	}

	close() {
		if (!this.socket) {
			this.emit('error', new Error('socket is not initialized'))
			return
		}

		this.socket.close()
	}

	readCoils(addr, cnt) {
		return new Promise((resolve, reject) => {
			const cntBuf = Buffer.alloc(2)
			cntBuf.writeUInt16BE(cnt, 0)

			const data = this.prepareModbusMessageBuffer(READ_COILS, addr, cntBuf)
			this.socketWrite(data).then(response => {
				resolve(this.generateResponseCoils(response))
			}, reject)
		})
	}

	/**
	 *
	 * @param {Number} addr
	 * @param {Array<Boolean>} values
	 */
	writeMultipleCoils(addr, values) {
		const bitCount = values.length
		const byteCount = Math.ceil(bitCount / 8)
		const bytes = Buffer.alloc(byteCount).fill(0)

		values.forEach((val, idx) => {
			const byteIdx = Math.floor(idx / 8)
			const bitIdx = idx % 8
			if (val) {
				bytes[byteIdx] |= (1 << bitIdx)
			}
		})

		return new Promise((resolve, reject) => {
			const buf = Buffer.alloc(3)
			buf.writeUInt16BE(bitCount, 0)
			buf.writeUInt8(byteCount, 2)

			const finalBuf = Buffer.concat([buf, bytes])

			const data = this.prepareModbusMessageBuffer(WRITE_MULTIPLE_COILS, addr, finalBuf)
			this.socketWrite(data).then(response => {

					resolve(response)
			}, reject)
		})
	}

	readDiscreteInputs(addr, cnt) {
		return new Promise((resolve, reject) => {
			const cntBuf = Buffer.alloc(2)
			cntBuf.writeUInt16BE(cnt, 0)

			const data = this.prepareModbusMessageBuffer(READ_DISCRETE_INPUTS, addr, cntBuf)
			this.socketWrite(data).then(response => {
				resolve(this.generateResponseCoils(response))
			}, reject)
		})
	}

	readInputRegisters(addr, cnt) {
		return new Promise((resolve, reject) => {
			const cntBuf = Buffer.alloc(2)
			cntBuf.writeUInt16BE(cnt, 0)

			const data = this.prepareModbusMessageBuffer(READ_INPUT_REGISTERS, addr, cntBuf)
			this.socketWrite(data).then(response => {
				resolve(this.generateResponseRegisters(response))
			}, reject)
		})
	}

	readHoldingRegisters(addr, cnt) {
		return new Promise((resolve, reject) => {
			const cntBuf = Buffer.alloc(2)
			cntBuf.writeUInt16BE(cnt, 0)

			const data = this.prepareModbusMessageBuffer(READ_MULTIPLE_HOLDING_REGISTERS, addr, cntBuf)
			this.socketWrite(data).then(response => {
				resolve(this.generateResponseRegisters(response))
			}, reject)
		})
	}

	/**
	 *
	 * @param {Number} addr
	 * @param {Array<Number>} values
	 */
	writeMultipleRegisters(addr, values) {
		const wordCount = values.length
		const byteCount = 2 * wordCount
		const words = Buffer.alloc(byteCount)

		values.forEach((val, idx) => {
			words.writeUInt16BE(val, 2 * idx)
		})

		return new Promise((resolve, reject) => {
			const buf = Buffer.alloc(3)
			buf.writeUInt16BE(wordCount, 0)
			buf.writeUInt8(byteCount, 2)

			const finalBuf = Buffer.concat([buf, words])

			const data = this.prepareModbusMessageBuffer(WRITE_MULTIPLE_HOLDING_REGISTERS, addr, finalBuf)
			this.socketWrite(data).then(response => {
				resolve(response)
			}, reject)
		})
	}

	/**
	 *
	 * @param {Number} fnCode
	 * @param {Number} addr
	 * @param {Buffer} data
	 * @returns {Buffer}
	 */
	prepareModbusMessageBuffer(fnCode, addr, data) {
		const buf = Buffer.alloc(7 + 1 + 2)
		buf.writeUInt16BE(++this.uniqueTransactionId, 0)
		buf.writeUInt16BE(0x0000, 2)
		buf.writeUInt16BE(buf.length - 6 + (data ? data.length : 0), 4)
		buf.writeUInt8(0x00, 6)
		buf.writeUInt8(fnCode, 7)
		buf.writeUInt16BE(addr, 8)

		return Buffer.concat([buf, data])
	}

	/**
	 *
	 * @param {Buffer} data
	 * @returns {Promise<Buffer>}
	 */
	socketWrite(data) {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				this.emit('error', new Error('socket is not initialized'))
				return null
			}

			const msgCb = (response) => {
				clearTimeout(timeoutId)
				this.socket.removeListener('message', msgCb)
				resolve(response)
			}

			const timeoutId = setTimeout(() => {
				this.socket.removeListener('message', msgCb)
				reject(new Error('timeout'))
			}, 1500)

			this.socket.on('message', msgCb)
			this.socket.send(data, this.port, this.host)
		})
	}

	/**
	 *
	 * @param {Buffer} response
	 */
	generateResponseCoils(response) {
		const subResp = response.subarray(7)
		const velueBytes = subResp.subarray(2)
		const result = []

		for (let q = 0; q < velueBytes.length * 8; ++q) {
			const byteIdx = Math.floor(q / 8)
			const bitIdx = q % 8
			const val = velueBytes[byteIdx] & (1 << bitIdx)

			result.push(val != 0)
		}

		return {
			fc: subResp[0],
			byteCount: velueBytes.length,
			payload: velueBytes,
			coils: result,
		}
	}

	/**
	 *
	 * @param {Buffer} response
	 */
	generateResponseRegisters(response) {
		const subResp = response.subarray(7)
		const velueBytes = subResp.subarray(2)
		const result = []

		for (let q = 0; q < velueBytes.length; q += 2) {
			result.push(velueBytes.readUInt16BE(q))
		}

		return {
			fc: subResp[0],
			byteCount: velueBytes.length,
			payload: velueBytes,
			register: result,
		}
	}

}

module.exports = UdpModbus
