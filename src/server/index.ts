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
	waitingInput: ({ type: string; payload: any; } | null)[];
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

function createGame(player1Deck: string[], player2Deck: string[], room: Room) {
	let game: Game;

	const controller = new Controller((player, type, payload, logs) => {
		room.waitingInput[player] = { type, payload };
	
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

	const roomId = new URL('http://localhost' + req.url!).searchParams.get('room');
	if (roomId == null) {
		ws.on('message', async message => {
			const msg = JSON.parse(message.toString());
			const matching = matchings.find(matching => matching.users.includes(name) && matching.users.includes(msg.target));
			if (matching) {
				// Create room
				const _roomId = Math.floor(Math.random() * 100000).toString();
				const waitingInput = [null, null];
				rooms[_roomId] = {
					player1: matching.users[0],
					player2: matching.users[1],
					player1ready: false,
					player2ready: false,
					player1ws: null,
					player2ws: null,
					started: false,
					waitingInput: waitingInput
				};
				const game = createGame(matching.deck, msg.deck, rooms[_roomId]);
				games[_roomId] = game;
				matching.cb(_roomId);
				matchings = matchings.filter(x => x !== matching);
				ws.send(JSON.stringify({ room: _roomId }));
			} else {
				matchings.push({ users: [name, msg.target], deck: msg.deck, cb: (_roomId) => {
					ws.send(JSON.stringify({ room: _roomId }));
				}});
			}
		});
	} else {
		const room = rooms[roomId];
		if (room == null) return;
		const playerNumber = room.player1 === name ? 0 : 1;

		const game = games[roomId];
		if (room.player1 === name) room.player1ws = ws;
		if (room.player2 === name) room.player2ws = ws;

		ws.send(JSON.stringify({ type: 'game', payload: {
			game: game.getStateForClient(playerNumber),
			player1: room.player1
		}}));

		ws.on('message', async message => {
			const msg = JSON.parse(message.toString());
			console.log(msg.type, msg.payload);
		
			if (msg.type === 'ready') {
				if (room.player1 === name) {
					room.player1ready = true;
				} else {
					room.player2ready = true;
				}
				if (room.player1ready && room.player2ready && !room.started) {
					room.started = true;
					await game.start();
					room.player1ws!.send(JSON.stringify({ type: 'end', payload: {
						game: game.getStateForClient(0),
					}}));
					room.player2ws!.send(JSON.stringify({ type: 'end', payload: {
						game: game.getStateForClient(1),
					}}));
				}
				if (room.player1ready && room.player2ready && room.started && room.waitingInput[playerNumber]) {
					const { type, payload } = room.waitingInput[playerNumber]!;
					(room.player1 === name ? room.player1ws! : room.player2ws!).send(JSON.stringify({
						type: 'q',
						payload: {
							type: type,
							payload: payload,
							game: game.getStateForClient(playerNumber),
						}
					}));
				}
			} else if (msg.type === 'action') {
				const action = {
					date: new Date(),
					player: playerNumber,
					payload: msg.payload,
				};

				room.waitingInput[playerNumber] = null;
		
				game.controller.input(action);
			}
		});
	}
});
