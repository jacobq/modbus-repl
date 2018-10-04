const readline = require('readline')
// const ModbusRTU = require("modbus-serial")
const modbus = require('jsmodbus')
const net = require('net')

const argv = require('yargs').argv
const process = require('process')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let host = argv.h
let port = Number(argv.p)

if (host && !isNaN(port)) {
	connectToServer(host, port)
} else {
	promptForServerConfig()
}

function connectToServer(host, port) {
	const client = new modbus.client.tcp.complete({
		host,
		port,
		autoReconnect: false,
		timeout: 2500
	})
	client.connect()

	client.on('connect', () => {
		console.log('Connection established')
		promptForCommand(host, port, client)
	})

	client.on('error', err => {
		rl.close()
		console.error(err)
	})

	// var client = new ModbusRTU()
	// console.log(`Connecting to ${host}:${port}...`)
	// client.connectTCP(host, { port: port }).then(() => {
	// 	console.log('Connection established')
	// 	promptForCommand(host, port, client)
	// }, err => {
	// 	rl.close()
	// 	console.error(err)
	// })

	// client.setID(1)
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
			rl.close()
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
			console.log(resp)
			cb(null)
		}, err => {
			cb(err)
		})
	},

	writeCoils(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => Number(el) != 0 ? 1 : 0)

		console.log(values)

		client.writeMultipleCoils(addr, values).then(resp => {
			console.log(resp)
			cb(null)
		}, err => {
			cb(err)
		})
	},

	readDiscrete(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readDiscreteInputs(addr, cnt).then(resp => {
			console.log(resp)
			cb(null)
		}, err => {
			cb(err)
		})
	},

	readInput(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1

		client.readInputRegisters(addr, cnt).then(resp => {
			console.log(resp.register.map(el => el.toString(16)).map(el => new Array(4 - el.length + 1).fill('').join('0') + el).map(el => `0x${el}`))
			cb(null)
		}, cb)
	},

	readHolding(client, args, cb) {
		const addr = Number(args[0])
		const cnt = Number(args[1]) || 1
		console.log(' trying to read')
		client.readHoldingRegisters(addr, cnt).then(resp => {
			console.log(resp.register.map(el => el.toString(16)).map(el => new Array(4 - el.length + 1).fill('').join('0') + el).map(el => `0x${el}`))
			cb(null)
		}, cb)
	},

	writeHolding(client, args, cb) {
		const addr = Number(args[0])
		const values = args.slice(1).map(el => parseInt(el))

		client.writeMultipleRegisters(addr, values).then(resp => {
			console.log(resp)
			cb(null)
		}, err => {
			cb(err)
		})
	}
}
