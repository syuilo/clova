import * as WebSocket from 'ws';
import { Game, Player, Card } from './engine/index';
import { CARDS } from '../cards';
import { Controller } from './engine/controller';

type Room = {
	game: Game;
	player1: string;
	player2: string;
	player1ready: boolean;
	player2ready: boolean;
	player1ws: WebSocket;
	player2ws: WebSocket;
};

console.log('server');

const wss = new WebSocket.Server({
	port: 3000,
});

const rooms: Record<string, Room> = {};
const matchings: Record<string, { name: string; deck: string[]; ws: WebSocket }> = {};

function createGame(player1Deck: string[], player2Deck: string[], player1ws: WebSocket, player2ws: WebSocket): Game {
	let i = 0;

	const player1DeckWithId: Card[] = [];
	for (const cardId of player1Deck) {
		player1DeckWithId.push({ def: cardId, id: i.toString(), owner: 0 });
		i++;
	}

	const player2DeckWithId: Card[] = [];
	for (const cardId of player2Deck) {
		player2DeckWithId.push({ def: cardId, id: i.toString(), owner: 1 });
		i++;
	}

	const player1 = new Player(player1DeckWithId);
	const player2 = new Player(player2DeckWithId);

	const controller = new Controller((player, type, payload) => {
		(player === 0 ? player1ws : player2ws).send(JSON.stringify({
			type: 'actionRequest',
			payload: {
				type: type,
				payload: payload
			}
		}));
	});

	const game = new Game(CARDS, [player1, player2], controller, 'seed');

	return game;
}

wss.on('connection', (ws, req) => {
	const name = new URL('http://localhost' + req.url!).searchParams.get('name');
	if (name == null) return;
	const roomName = new URL('http://localhost' + req.url!).searchParams.get('room');
	if (roomName == null) return;
	console.log('Connected', name);

	ws.on('message', message => {
		const msg = JSON.parse(message.toString());
		console.log(msg.type, msg.payload);
	
		if (msg.type === 'enter') {
			if (rooms[roomName]) {
				ws.send(JSON.stringify({ type: 'game', payload: {
					game: rooms[roomName].game.getStateForClient(rooms[roomName].player1 === name ? 0 : 1),
					player1: rooms[roomName].player1
				}}));
			} else if (matchings[roomName]) {
				const game = createGame(matchings[roomName].deck, msg.payload.deck, matchings[roomName].ws, ws);

				rooms[roomName] = {
					game: game,
					player1: matchings[roomName].name,
					player2: name,
					player1ws: matchings[roomName].ws,
					player2ws: ws,
					player1ready: false,
					player2ready: false
				};

				matchings[roomName].ws.send(JSON.stringify({ type: 'game', payload: {
					game: rooms[roomName].game.getStateForClient(0),
					player1: rooms[roomName].player1
				}}));

				ws.send(JSON.stringify({ type: 'game', payload: {
					game: rooms[roomName].game.getStateForClient(1),
					player1: rooms[roomName].player1
				}}));
			} else {
				matchings[roomName] = {
					name: name,
					deck: msg.payload.deck,
					ws: ws
				};
			}
		} else if (msg.type === 'ready') {
			if (rooms[roomName].player1 === name) {
				rooms[roomName].player1ready = true;
			} else {
				rooms[roomName].player2ready = true;
			}
			if (rooms[roomName].player1ready && rooms[roomName].player2ready) {
				rooms[roomName].game.start();
			}
		} else if (msg.type === 'action') {
			const action = {
				date: new Date(),
				player: rooms[roomName].player1 === name ? 0 : 1,
				payload: msg.payload,
			};
	
			if (!rooms[roomName].game.controller.input(action)) throw new Error('invalid input');
	
			rooms[roomName].player1ws.send(JSON.stringify({ type: 'action', payload: {
				game: rooms[roomName].game.getStateForClient(0),
			}}));
			rooms[roomName].player2ws.send(JSON.stringify({ type: 'action', payload: {
				game: rooms[roomName].game.getStateForClient(1),
			}}));
		}
	});
});
