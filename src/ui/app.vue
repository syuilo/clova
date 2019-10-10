<template>
<div id="game">
	<div>
		<div id="opponent-hand" v-if="game">
			<div v-for="i in game.opponentHandCount" :key="i"></div>
		</div>
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
			<x-card v-for="(card, i) in game.myHand" :key="card.id" :card="card" :game="game" :style="{ transform: `translateZ(${i * 4}px)` }" @click="play(card)"/>
		</div>
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
			return new Promise(res => {
				this.$once('play', payload => {
					res({ type: 'play', payload });
				});
			});
		},

		play(card) {
			this.$emit('play', card.id);
		}
	}
});
</script>

<style lang="stylus" scoped>
#game
	perspective 2000px
	transform-style preserve-3d

	> div
		perspective 2000px
		transform-style preserve-3d
		transform rotateX(50deg)

#opponent-hand
	text-align center
	perspective 2000px
	transform rotateX(-50deg)

	> div
		display inline-block
		width 120px
		height 165px
		border solid 2px #777
		border-radius 8px

#hand
	perspective 2000px
	transform rotateX(-50deg)
	text-align center

	> *
		position relative
		margin 0 -8px

#field
	> div
		text-align center

		> div
			display inline-block
			width 120px
			height 165px
			margin 8px
			border solid 2px #b7b7b7
			border-radius 8px
			backdrop-filter blur(4px)

		&#back1 > div
			border-color #a4c5d8

		&#back2 > div
			border-color #d8a4ae
</style>
