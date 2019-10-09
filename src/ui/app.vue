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
	<div id="hand" v-if="game">
		<x-card v-for="card in game.myHand" :key="card.id" :card="card" :game="game"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCard from './card.vue';
import XRedrawDialog from './redraw-dialog.vue';
import { CARDS } from '../cards';
import TreasureChest from '../cards/treasure-chest';
import slime from '../cards/slime';

type Game = {

};

export default Vue.extend({
	components: {
		XCard
	},

	data() {
		return {
			game: null as Game | null,
			myPlayerNumber: null as null | number,
			isMyMainPhase: false
		};
	},

	created() {
		const actions = [];

		const name = window.prompt('Your name', Math.random().toString());
		const room = window.prompt('Room', 'testRoom');
		const socket = new WebSocket(`ws://localhost:3000/?name=${name}&room=${room}`);

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

		socket.addEventListener('message', async event => {
			const message = JSON.parse(event.data);
			console.log(message.type, message.payload);

			if (message.type === 'game') {
				this.game = message.payload.game;
				this.myPlayerNumber = message.payload.player1 === name ? 0 : 1;
				socket.send(JSON.stringify({
					type: 'ready',
				}));
			} else if (message.type === 'action') {
				this.game = message.payload.game;
			} else if (message.type === 'actionRequest') {
				const { type, payload } = message.payload;

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
			this.isMyMainPhase = true;
			console.log(this.game);
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
