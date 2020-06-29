if (process.argv.length <= 2) {
	console.log('Usage: node index.js <username> <password> <host> <port> <version> <authPassworrd>');
	console.log('       use - to leave value blank');
	process.exit(1);
}

require('dotenv').config(); 
const mineflayer = require('mineflayer');
const navigatePlugin = require('mineflayer-navigate')(mineflayer);
const express = require('express');
const app = express();
const SocketIO = require('socket.io');
const path = require('path');
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'))
});

app.get('/null', (req, res) => {
	res.redirect(301, '/minecraft/textures/block/stone.png');
});

var options = {
	username: process.argv[2] || `Player${~~(9999*Math.random())}`
}

if (process.argv[3] != '-') {
	options = {...options, password: process.argv[3]};
}

if (process.argv[4] != '-') {
	options = {...options, host: process.argv[4]};
}

if (process.argv[5] != '-') {
	options = {...options, port: process.argv[5]};
}

if (process.argv[6] != '-') {
	options = {...options, version: process.argv[6]};
}

if (process.argv[7] != '-') {
	var authPass =  process.argv[7];
}

var bot = mineflayer.createBot(options)
var msgHistory = [];

const mcAssets = require('minecraft-assets')(bot.majorVersion);
const mcData = require('minecraft-data')(bot.majorVersion);
const Item = require('prismarine-item')(bot.version);
navigatePlugin(bot);

var isIn = [];

bot.on('message', (message) => {
	msgHistory.push(message);
	if (200 < msgHistory.length) msgHistory.shift();
	process.stdout.write(`\x1B[99999D${message.toAnsi()}\n`);
});

bot.on('login', () => {
	clearInterval(ani);
	process.stdout.write(`\x1B[1A\x1B[J\x1B[99999D\x1B[32mConnected!\x1B[m\n`);
	process.stdin.on('data', (data) => {
		bot.chat(data.toString());
		process.stdout.write('\x1b[1A');
	});
});

process.stdout.write(`\x1Bc\x1B[33mConnecting...\x1B[m \x1B[37m[\x1B[35m\\\x1B[37m]`);
let i = 0;
let ani = setInterval(() => {
	let char = ['|', '/', '\u2014', '\\', '\u2014']
	process.stdout.write(`\x1B[;15H\x1B[37m[\x1B[35m${char[i]}\x1B[37m]\n`);
	i = ++i % 5;
}, 125);

bot.on('error', stop);
function stop(err) {
	clearInterval(ani);
	process.stdout.write(`\x1B[2J\x1B[1;1H\x1B[31m${err}\x1B[37m\n`)
	process.exit(0)
}

bot.on('login', () => {
	bot.chat("/register " + authPass + " " + authPass);
	bot.chat("/login " + authPass);
})

bot.on('spawn', function () {
	pickup();
	if (isIn[0] == 'rpg') {
		bot.chat("/shop");
		isIn.push('shop', 2);
	}
});

bot.on('windowOpen', (window) => {
	if (isIn[1] == 'shop') {
		if (isIn[2] == 'mineral') {
			bot.clickWindow(2, 0, 0);
		} else if (isIn[2] == 'd decoration') {
			isIn[2] = isIn[2].slice(2);
			bot.clickWindow(13, 0, 0);
			return;
		} else if (isIn[2] == 'decoration') {
			bot.clickWindow(13, 0, 0);
		} else {
			bot.clickWindow(15, 0, 0);
			isIn.push('mineral');
		}

		if (isIn[4] == 'back') {
			bot.clickWindow(27, 0, 0);
			if (0 == --isIn[5]) {
				isIn.length = 2;
				isIn[2] = 'd';
				return;
			}
		}

		if (1 < isIn[2].length) {
			if (isIn[3] == 'sell') {
				bot.clickWindow(17, 0, 0);
				isIn.push('back', 2);
			} else {
				isIn.push('sell');
			}
		}
		isIn[1]--
	}
});


function nearstItems(bot, filter) {
	return Object.keys(bot.entities)
		.map(key => bot.entities[key])
		.filter(value => /item/.test(value.name))
		.map(value => [value.position, new Item(value.metadata[6].blockId, 1)])
		.filter(filter)
		.sort((a, b) => dist(bot.entity.position, a[0]) - dist(bot.entity.position, b[0]));
}

function dist(a, b) {
	let dx = a.x - b.x;
	let dy = a.y - b.y;
	let dz = a.z - b.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function pickup() {
	bot.navigate.stop()
	let items = nearstItems(bot, value => /iron_ingot|red_flower/.test(value[1].name));
	if (!items.length) return setTimeout(pickup, 1000);
	let pos = items.map(value => value[0]);
	bot.navigate.walk(pos, () => {
		bot.navigate.emit('arrive');
		pickup();
	});
}

var server = app.listen(port, () => process.stdout.write(`\nListening on port ${port}\x1B[1A`));
var io = SocketIO(server);
io.serveClient(true);

io.on('connection', (socket) => {
	// Add item textures
	const items = bot.inventory.items();
	for (const item in items) {
		items[item].texture = mcAssets.textureContent[items[item].name].texture || mcAssets.getImageContent(items[item].name) || mcAssets.getImageContent('chest');
	}

	socket.emit('inv', items);

	let updates = [];
	function update(slot, oldItem, newItem) {
		// Add item texture
		if (newItem) {
			newItem.texture = mcAssets.textureContent[newItem.name].texture;
			updates.push({ item: newItem, slot })
		} else updates.push({ item: {}, slot });

		debounce(() => { 
			socket.emit('invUpdate', updates.map(v => [v.item, v.slot]));
			updates = [];
		}, 50);
	}

	let msgs = [];
	function msg(message) {
		debounce(() => {
			socket.emit('message', msgs, mcData.language);
			msgs = [];
		}, 50);
		msgs.push(message);
	}

	bot.inventory.on('windowUpdate', update);
	bot.on('message', msg);

	socket.on('chat', str => bot.chat(str));
	socket.emit('historyMessage', msgHistory, mcData.language);
	socket.on('disconnect', () => {
		bot.inventory.off('windowUpdate', update);
		bot.off('message', msg);
	});
});
bot.on('kicked', (reason) => io.emit('message', {text:'',extra:[{text:'Kicked',color:'red'},{text:' Reason',color:'white'},{text:reason,color:'red'}]}))

var isEmit = {};
var id = new Date();
function debounce(cb, timeout) {
	id = new Date();
	if (!isEmit[id]) {
		setTimeout(() => {  // Debounce
			cb();
			delete isEmit[id];
		}, timeout);
		isEmit[id] = true;
	}
}

// for (let i = 0; i < 11; i++) {
// 	for (let j = 0; j < 10; j++) {
// 		n = 10 * i + j;
// 		if (n > 108) break;
// 		process.stdout.write(`\x1b[${n}m${n.toString().padStart(4, ' ')}\x1b[m`);
// 	}
// 	process.stdout.write("\n");
// }