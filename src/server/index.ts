import * as WebSocket from 'ws';
import { Game, Player, Card } from '../engine/index';
import { CARDS } from '../cards';
import { Controller, ActionSupplier } from '../engine/controller';

type Room = {
	game: Game;
	pushAction: (player: number, payload: any) => void,
	player1: string;
	player2: string;
	player1ws: WebSocket;
	player2ws: WebSocket;
};

console.log('server');

const wss = new WebSocket.Server({
	port: 3000,
});

const rooms: Record<string, Room> = {};
const matchings: Record<string, { name: string; deck: string[]; ws: WebSocket }> = {};

function createGame(player1Deck: string[], player2Deck: string[]): [Game, (player: number, payload: any) => void] {
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

	const controller = new Controller();

	const pushAction = (player: number, payload: any) => {
		const action = {
			date: new Date(),
			player: player,
			payload: payload,
		};

		controller.input(action);

		return action;
	};

	const game = new Game(CARDS, [player1, player2], controller);

	return [game, pushAction];
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
					game: rooms[roomName].game.getState(),
					player1: rooms[roomName].player1
				}}));
			} else if (matchings[roomName]) {
				const [game, pushAction] = createGame(matchings[roomName].deck, msg.payload.deck);

				game.start();

				rooms[roomName] = {
					game: game,
					pushAction: pushAction,
					player1: matchings[roomName].name,
					player2: name,
					player1ws: matchings[roomName].ws,
					player2ws: ws
				};

				const res = JSON.stringify({ type: 'game', payload: {
					game: rooms[roomName].game.getState(),
					player1: rooms[roomName].player1
				}});

				matchings[roomName].ws.send(res);
				ws.send(res);
			} else {
				matchings[roomName] = {
					name: name,
					deck: msg.payload.deck,
					ws: ws
				};
			}
		} else if (msg.type === 'action') {
			const payload = rooms[roomName].pushAction(rooms[roomName].player1 === name ? 0 : 1, msg.payload);
			const res = JSON.stringify({ type: 'action', payload: payload });
			rooms[roomName].player1ws.send(res);
			rooms[roomName].player2ws.send(res);
		}
	});
});
