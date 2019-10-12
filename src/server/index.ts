import * as http from 'http';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as send from 'koa-send';
import * as WebSocket from 'ws';
import { Game } from '../engine/index';
import { CARDS } from '../cards';
import { Controller } from '../engine/controller';
const config = require('../../config.json');

type Room = {
	player1: string;
	player2: string;
	player1ready: boolean;
	player2ready: boolean;
	player1ws: WebSocket | null;
	player2ws: WebSocket | null;
	started: boolean;
};

const app = new Koa();
const router = new Router({
	root: __dirname + '/../../'
} as any);

router.get('/', async (ctx) => {
	await send(ctx, 'src/ui/index.html');
});

router.get('/main.js', async (ctx) => {
	await send(ctx, 'built/ui/main.js');
});

app
	.use(router.routes())
	.use(router.allowedMethods());

const server = http.createServer(app.callback());

const wss = new WebSocket.Server({
	server: server
});

server.listen(config.port, () => {
	console.log('server started ' + config.port);
});

const games: Record<string, Game> = {};
const rooms: Record<string, Room> = {};
let matchings: { users: [string, string]; deck: string[]; cb: Function; }[] = [];

function createGame(player1Deck: string[], player2Deck: string[], room: Room): Game {
	let game: Game;

	const controller = new Controller((player, type, payload, logs) => {
		(player === 0 ? room.player1ws! : room.player2ws!).send(JSON.stringify({
			type: 'q',
			payload: {
				type: type,
				payload: payload,
				game: game.getStateForClient(player),
				logs: logs,
			}
		}));

		(player === 0 ? room.player2ws! : room.player1ws!).send(JSON.stringify({
			type: 'info',
			payload: {
				game: game.getStateForClient(player === 0 ? 1 : 0),
				logs: logs,
			}
		}));
	});

	game = new Game(CARDS, player1Deck, player2Deck, controller, 'seed');

	return game;
}

wss.on('connection', (ws, req) => {
	const name = new URL('http://localhost' + req.url!).searchParams.get('name');
	if (name == null) return;
	console.log('Connected', name);

	const room = new URL('http://localhost' + req.url!).searchParams.get('room');
	if (room == null) {
		ws.on('message', async message => {
			const msg = JSON.parse(message.toString());
			const matching = matchings.find(matching => matching.users.includes(name) && matching.users.includes(msg.target));
			if (matching) {
				// Create room
				const roomId = Math.floor(Math.random() * 100000).toString();
				rooms[roomId] = {
					player1: matching.users[0],
					player2: matching.users[1],
					player1ready: false,
					player2ready: false,
					player1ws: null,
					player2ws: null,
					started: false,
				};
				const game = createGame(matching.deck, msg.deck, rooms[roomId]);
				games[roomId] = game;
				matching.cb(roomId);
				matchings = matchings.filter(x => x !== matching);
				ws.send(JSON.stringify({ room: roomId }));
			} else {
				matchings.push({ users: [name, msg.target], deck: msg.deck, cb: (roomId) => {
					ws.send(JSON.stringify({ room: roomId }));
				}});
			}
		});
	} else {
		if (rooms[room] == null) return;

		const game = games[room];
		if (rooms[room].player1 === name) rooms[room].player1ws = ws;
		if (rooms[room].player2 === name) rooms[room].player2ws = ws;

		ws.send(JSON.stringify({ type: 'game', payload: {
			game: game.getStateForClient(rooms[room].player1 === name ? 0 : 1),
			player1: rooms[room].player1
		}}));

		ws.on('message', async message => {
			const msg = JSON.parse(message.toString());
			console.log(msg.type, msg.payload);
		
			if (msg.type === 'ready') {
				if (rooms[room].player1 === name) {
					rooms[room].player1ready = true;
				} else {
					rooms[room].player2ready = true;
				}
				if (rooms[room].player1ready && rooms[room].player2ready && !rooms[room].started) {
					rooms[room].started = true;
					game.start();
					console.log('game started');
				}
			} else if (msg.type === 'action') {
				const action = {
					date: new Date(),
					player: rooms[room].player1 === name ? 0 : 1,
					payload: msg.payload,
				};
		
				game.controller.input(action);
			}
		});
	}
});
