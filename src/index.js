const readline = require('readline')
const modbus = require('jsmodbus')
const process = require('process')
const UdpModbus = require('./udp-modbus')
const config = require('./config')

let host = config.host
let port = config.port
let proto = config.proto === 'udp' ? 'udp' : 'tcp'
const bInteractive = !config.headless
const command = config.command

const log = bInteractive ? console.log : ()=>{}

const rl = bInteractive ? readline.createInterface({
  input: process.stdin,
  output: process.stdout
}) : null

if (!bInteractive && !command) {
	console.error('headless mode requires --command argument')
	process.exit(1)
}

if (host && !isNaN(port)) {
	connectToServer(host, port)
} else {
	if (bInteractive) {
		promptForServerConfig()
	} else {
		console.error('headless mode requires server host --address and --port')
		process.exit(1)
	}
}

function initClient(proto) {
	if (proto === 'udp') {
		return new UdpModbus(host, port)
	}

	return new modbus.client.tcp.complete({
		host,
		port,
		autoReconnect: false,
		timeout: 2500
	})
}

function connectToServer(host, port) {
	const client = initClient(proto)
	client.connect()

	client.on('connect', () => {
		log('Connection established')
		if (bInteractive) {
			promptForCommand(host, port, client)
		} else {
			parseCommand(client, command, (err) => {
				if (err) {
					console.error(err)
				}
				client.close()
				if (rl) rl.close()
				process.exit(0)
			})
		}
	})

	client.on('error', err => {
		if (rl) rl.close()
		console.error(err)
	})
}

function promptForServerConfig() {
	rl.question('Host: ', (answer) => {
		host = answer
		rl.question('Port: ', (answer) => {
			port = Number(answer)

			if (host && !isNaN(port)) {
				connectToServer(host, port)
			} else {
				promptForServerConfig()
			}
		})
	})
}

function promptForCommand(host, port, client) {
	rl.question(`${host}:${port} > `, (answer) => {
		if (answer === 'exit' || answer === 'quit') {
			client.close()
			if (rl) rl.close()
		} else {
			parseCommand(client, answer, (err) => {
				if (err) {
					console.error(err)
				}
				promptForCommand(host, port, client)
			})
		}
	})
}

function parseCommand(client, command, cb) {
	const commandParts = command.split(' ')
	const action = commandParts[0][0]
	const target = commandParts[0][1]

	if (['r', 'w'].indexOf(action) == -1) {
		console.error('ERROR: invalid action')
		return cb()
	}

	if (['c', 'd', 'i', 'h'].indexOf(target) == -1) {
		console.error('ERROR: unknown target')
		return cb()
	}

	if (action == 'w' && ['d', 'i'].indexOf(target) != -1) {
		console.error('ERROR: can\'t write to read only registers')
		return cb()
	}

	const methodName = (actions[action] + targets[target])

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
	readCoils(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readCoils(addr, cnt).then(resp => {
			log(resp)
			printCoils(resp.coils, addr, cnt)
			cb(null)
		}, err => {
			cb(err)
		}, cb)
	},

	writeCoils(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => Number(el) != 0 ? 1 : 0)

		client.writeMultipleCoils(addr, values).then(resp => {
			log(resp)
			cb(null)
		}, err => {
			cb(err)
		}, cb)
	},

	readDiscrete(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readDiscreteInputs(addr, cnt).then(resp => {
			log(resp)
			printCoils(resp.coils, addr, cnt)
			cb(null)
		}, err => {
			cb(err)
		}, cb)
	},

	readInput(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readInputRegisters(addr, cnt).then(resp => {
			log(resp)
			printRegs(resp.register, addr, cnt)
			cb(null)
		}, cb)
	},

	readHolding(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1
		log(' trying to read')
		client.readHoldingRegisters(addr, cnt).then(resp => {
			log(resp)
			printRegs(resp.register, addr, cnt)
			cb(null)
		}, cb)
	},

	writeHolding(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => parseInt(el))

		client.writeMultipleRegisters(addr, values).then(resp => {
			log(resp)
			cb(null)
		}, err => {
			cb(err)
		}, cb)
	}
}

function printCoils(coils, addr, cnt) {
	const addresses = new Array(cnt).fill(0).map((el, idx) => addr + idx).map(el => paddString(el, 5, '0'))
	const values = coils.map(el => el ? '1' : '0').map(el => paddString(el, 5, ' '))

	for (let q = 0; q < cnt; ++q) {
		const addr = paddString(addresses[q], 5, ' ')
		const val = paddString(values[q], 5, ' ')
		log(`  ${addr} : ${val}`)
	}

	if (!bInteractive) {
		console.log(coils.slice(0, cnt))
	}
}

function printRegs(regs, addr, cnt) {
	const addresses = new Array(cnt).fill(0).map((el, idx) => addr + idx).map(el => paddString(el, 5, '0'))
	const values = regs.map(regToStr10)
	const hexes = regs.map(regToStr16).map(regToHex)
	const chars = regs.map(regToChars)

	for (let q = 0; q < cnt; ++q) {
		const addr = paddString(addresses[q], 5, ' ')
		const val = paddString(values[q], 5, ' ')
		const hex = hexes[q]
		const char = chars[q]
		log(`  ${addr} : ${val} | ${hex} | ${char}`)
	}

	if (!bInteractive) {
		console.log(regs)
	}
}

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
