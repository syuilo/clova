<template>
<div id="game">
	<div id="field">
		<div id="back2">
			<div></div>
			<div></div>
			<div></div>
		</div>
		<div id="front">
			<div></div>
			<div></div>
			<div></div>
			<div></div>
		</div>
		<div id="back1">
			<div></div>
			<div></div>
			<div></div>
		</div>
	</div>
	<div id="hand">
		<x-card v-for="card in hand" :key="card.id" :card="card"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCard from './card.vue';
import XRedrawDialog from './redraw-dialog.vue';
import { CARDS } from '../cards';
import { Game, Player } from '../engine';
import { Controller, ActionSupplier } from '../engine/controller';
import TreasureChest from '../cards/treasure-chest';
import slime from '../cards/slime';

export default Vue.extend({
	components: {
		XCard
	},

	data() {
		return {
			game: null as Game | null,
		};
	},

	provide() {
		return {
			game: this.game
		};
	},

	computed: {
		hand(): any[] {
			if (this.game == null) return [];
			return this.game.players[0].hand;
		}
	},

	created() {
		let myPlayerNumber: null | number = null;

		const actions = [];

		const name = window.prompt('Your name');
		const room = window.prompt('Room', 'testRoom');
		const socket = new WebSocket(`ws://localhost:3000/?name=${name}&room=${room}`);

		const controller = new Controller(async (player, type, payload) => {
			if (player !== myPlayerNumber) return;

			let res = null;

			if (type === 'choiceRedrawCards') {
				res = await this.choiceRedrawCards(payload);
			} else if (type === 'mainPhase') {
				res = await this.mainPhase();
			}

			socket.send(JSON.stringify({
				type: 'action',
				payload: res
			}));
		});

		socket.addEventListener('open', event => {
			const myDeck = [];
			for (let i = 0; i < 40; i++) {
				myDeck.push(slime.id);
			}

			socket.send(JSON.stringify({
				type: 'enter',
				payload: {
					deck: myDeck
				}
			}));
		});

		socket.addEventListener('message', event => {
			const message = JSON.parse(event.data);
			console.log(message.type, message.payload);

			if (message.type === 'game') {
				const gameState = message.payload.game as ReturnType<Game['getState']>;
				myPlayerNumber = message.payload.player1 === name ? 0 : 1;

				const player1 = new Player(gameState.players[0].deck);
				const player2 = new Player(gameState.players[1].deck);
				
				this.game = new Game(CARDS, [player1, player2], controller);

				this.game.start();
			} else if (message.type === 'action') {
				controller.input(message.payload);
			}
		});
	},

	methods: {
		choiceRedrawCards(cards) {
			return new Promise((res) => {
				const vm = this.$root.new(XRedrawDialog, {
					game: this.game,
					cards: cards
				}).$on('chosen', cards => {
					res(cards.map(card => card.id));
					vm.$el.parentNode.removeChild(vm.$el);
				});
			});
		},

		mainPhase() {
			const act = window.prompt('MAIN');
			if (act == null) return { type: 'turnEnd' };

			switch (act.split(' ')[0]) {
				case 'summon': return { type: 'summon',  };

				default:
					break;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
#game
	perspective 600px

#field
	transform rotateX(30deg)

	> div
		text-align center

		> div
			display inline-block
			width 120px
			height 165px
			margin 8px
			border solid 2px #b7b7b7
			border-radius 8px
</style>
