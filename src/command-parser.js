const { headless } = require('./config')
const UdpClient = require('./udp-modbus')
const {
	Printable,
	PrintableRegisters,
	PrintableCoils
} = require('./printable')

/**
 *
 * @param {UdpClient} client
 * @param {String} command
 * @param {function(Printable, Error):void} cb
 */
module.exports = function parseCommand(client, command, cb) {
	const commandParts = command.split(' ')
	const action = commandParts[0][0]
	const target = commandParts[0][1]

	if (['r', 'w'].indexOf(action) == -1) {
		cb(null, new Error('ERROR: invalid action'))
		return
	}

	if (['c', 'd', 'i', 'h'].indexOf(target) == -1) {
		cb(null, new Error('ERROR: unknown target'))
		return
	}

	if (action == 'w' && ['d', 'i'].indexOf(target) != -1) {
		cb(null, new Error('ERROR: can\'t write to read only registers'))
		return
	}

	const methodName = `${actions[action]}${targets[target]}`

	const actionArgs = commandParts.slice(1)

	methods[methodName](client, actionArgs, cb)
}

const actions = {
	'r': 'read',
	'w': 'write'
}

const targets = {
	'c': 'Coils',
	'd': 'Discrete',
	'i': 'Input',
	'h': 'Holding'
}

const methods = {
	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Printable, Error)} cb
	 */
	readCoils(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readCoils(addr, cnt).then(resp => {
			cb(new PrintableCoils(resp.coils, addr, cnt), null)
		}, err => {
			cb(null, err)
		})
	},

	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Error)} cb
	 */
	writeCoils(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => Number(el) != 0)

		client.writeMultipleCoils(addr, values).then(() => {
			cb(null)
		}, err => {
			cb(err)
		})
	},

	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Printable, Error)} cb
	 */
	readDiscrete(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readDiscreteInputs(addr, cnt).then(resp => {
			cb(new PrintableCoils(resp.coils, addr, cnt), null)
		}, err => {
			cb(null, err)
		})
	},

	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Printable, Error)} cb
	 */
	readInput(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readInputRegisters(addr, cnt).then(resp => {
			cb(new PrintableRegisters(resp.register, addr, cnt), null)
		}, err => {
			cb(null, err)
		})
	},

	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Printable, Error)} cb
	 */
	readHolding(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1
		client.readHoldingRegisters(addr, cnt).then(resp => {
			cb(new PrintableRegisters(resp.register, addr, cnt), null)
		})
	},

	/**
	 *
	 * @param {UdpClient} client
	 * @param {Array} args
	 * @param {function(Error)} cb
	 */
	writeHolding(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => parseInt(el))

		client.writeMultipleRegisters(addr, values).then(() => {
			cb(null)
		}, err => {
			cb(err)
		})
	}
}
