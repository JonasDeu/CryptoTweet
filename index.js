// Put your credentials and trading details here
// ---------
const triggerWords = ['doge', 'dogecoin', 'wow', 'moon'];
const accountName = 'tweetingPerson';

const cryptoShorthand = 'DOGEEUR'
const cryptoAmount = 1000
const timeToSell = 720000
// ---------

const rules = [
	{
		value: `(${valueWords.join(' OR ')}) from:${fromName}`,
		tag: '',
	},
];

require('dotenv').config()
const Binance = require('node-binance-api')
const binance = new Binance().options({
	APIKEY: process.env.BINANCE_API_KEY,
	APISECRET: process.env.BINANCE_API_SECRET,
})

const needle = require('needle')
const token = process.env.BEARER_TOKEN

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules'
const streamURL = 'https://api.twitter.com/2/tweets/search/stream'

async function getAllRules() {
	const response = await needle('get', rulesURL, {
		headers: {
			authorization: `Bearer ${token}`,
		},
	})
	if (response.statusCode !== 200) {
		console.log(response.body)
		throw new Error(response.body)
	}
	return response.body
}

async function deleteAllRules(rules) {
	if (!Array.isArray(rules.data)) {
		return null
	}
	const ids = rules.data.map((rule) => rule.id)

	const data = {
		delete: {
			ids: ids,
		},
	}

	const response = await needle('post', rulesURL, data, {
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
		},
	})

	if (response.statusCode !== 200) {
		throw new Error(response.body)
	}

	return response.body
}

async function setRules() {
	const data = {
		add: rules,
	}

	const response = await needle('post', rulesURL, data, {
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
		},
	})

	if (response.statusCode !== 201) {
		throw new Error(response.body)
	}

	return response.body
}

function streamConnect() {
	const stream = needle.get(streamURL, {
		headers: {
			'User-Agent': 'v2FilterStreamJS',
			Authorization: `Bearer ${token}`,
		},
		timeout: 20000,
	})

	stream
		.on('data', (data) => {
			try {
				const json = JSON.parse(data)
				console.log('New tweet --------------------------')
				console.log(new Date().toLocaleString())
				console.log(json)

				if (json.data.id) {
					console.log('Buying')
					binance.marketBuy(cryptoShorthand, cryptoAmount)
					console.log('Bought')

					setTimeout(function () {
						console.log(`Selling after ${timeToSell}`)
						binance.marketSell(cryptoShorthand, cryptoAmount)
						console.log('Sold')
					}, timeToSell)
				} else {
					console.log('Not buying')
				}
			} catch (e) {
				// Keep alive signal received. Do nothing.
			}
		})
		.on('error', (error) => {
			if (error.code === 'ETIMEDOUT') {
				stream.emit('timeout')
			}
		})

	return stream
}

;(async () => {
	let currentRules

	try {
		// Gets the complete list of rules currently applied to the stream
		currentRules = await getAllRules()

		// Delete all rules. Comment the line below if you want to keep your existing rules.
		await deleteAllRules(currentRules)

		// Add rules to the stream. Comment the line below if you don't want to add new rules.
		await setRules()
	} catch (e) {
		console.error(e)
		process.exit(-1)
	}

	// Listen to the stream.
	// This reconnection logic will attempt to reconnect when a disconnection is detected.
	// To avoid rate limits, this logic implements exponential backoff, so the wait time
	// will increase if the client cannot reconnect to the stream.

	const filteredStream = streamConnect()
	let timeout = 0
	filteredStream.on('timeout', () => {
		// Reconnect on error
		console.warn('A connection error occurred. Reconnecting…')
		setTimeout(() => {
			timeout++
			streamConnect()
		}, 2 ** timeout)
		streamConnect()
	})
})()
