<template>
<div id="game">
	<p v-if="isMyTurn">あなたのターンです</p>
	<div id="opponent-hand" v-if="game">
		<div v-for="i in game.opponentHandCount" :key="i"></div>
	</div>
	<div class="field">
		<x-field v-if="game" :game="game" :my="myPlayerNumber" @play="play" @move="$emit('move', $event)"/>
	</div>
	<div id="hand" v-if="game">
		<x-card v-for="card in game.myHand" :key="card.id"
			:card="card"
			:game="game"
			@click="select(card)"
			:class="{ selected: selectedHandCard === card.id }"/>
	</div>
	<button v-if="selectedHandCard && lookup(game.myHand.find(x => x.id === selectedHandCard)).type === 'spell'" @click="playSpell()">使う</button>
	<button v-if="isMyTurn" @click="turnEnd()">ターンエンド</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCard from './card.vue';
import XRedrawDialog from './redraw-dialog.vue';
import XCardChoiceDialog from './card-choice-dialog.vue';
import XField from './field.vue';
import { CARDS } from '../cards';
import TreasureChest from '../cards/treasure-chest';
import slime from '../cards/slime';
import golem from '../cards/golem';
import treasureChest from '../cards/treasure-chest';
import dragon from '../cards/dragon';
import witch from '../cards/witch';
import energyDrink from '../cards/energy-drink';
import { Card, ClientState } from '../engine';

type Game = ClientState;

export default Vue.extend({
	components: {
		XCard, XField
	},

	data() {
		return {
			game: null as Game | null,
			myPlayerNumber: null as null | number,
			selectedHandCard: null,
			selectedFieldCard: null,
		};
	},

	computed: {
		isMyTurn(): boolean {
			return this.game && (this.game.turn === this.myPlayerNumber);
		}
	},

	created() {
		const actions = [];

		const name = window.prompt('Your name', Math.random().toString());
		const room = window.prompt('Room', 'testRoom');
		const socket = new WebSocket(`ws://localhost:3000/?name=${name}&room=${room}`);

		socket.addEventListener('open', event => {
			const myDeck = [
				slime.id, slime.id, slime.id,
				golem.id, golem.id, golem.id,
				treasureChest.id, treasureChest.id, treasureChest.id,
				dragon.id, dragon.id,
				witch.id, witch.id,
				energyDrink.id, energyDrink.id, energyDrink.id,
			];

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
			} else if (message.type === 'info') {
				this.game = message.payload.game;
			} else if (message.type === 'q') {
				const { type, payload, game } = message.payload;
				this.game = game;

				let res = null;

				if (type === 'choiceRedrawCards') {
					res = await this.choiceRedrawCards(payload);
				} else if (type === 'mainPhase') {
					res = await this.mainPhase();
				} else if (type === 'cardChoice') {
					res = await this.cardChoice(payload);
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
			return new Promise(res => {
				this.$once('play', payload => {
					this.selectedHandCard = null;
					res({ type: 'play', payload });
				});

				this.$once('move', payload => {
					this.selectedFieldCard = null;
					res({ type: 'move', payload });
				});

				this.$once('turnEnd', () => {
					this.selectedHandCard = null;
					res({ type: 'end' });
				});
			});
		},

		select(card) {
			this.selectedHandCard = card.id;
		},

		play(index) {
			this.$emit('play', { card: this.selectedHandCard, index: index });
		},

		playSpell() {
			this.$emit('play', { card: this.selectedHandCard });
		},

		turnEnd() {
			this.$emit('turnEnd');
		},

		lookup(card: Card) {
			return CARDS.find(x => x.id === card.def);
		},

		cardChoice(cards) {
			return new Promise((res) => {
				const vm = this.$root.new(XCardChoiceDialog, {
					game: this.game,
					cards: cards
				}).$on('chosen', card => {
					res(card.id);
					vm.$el.parentNode.removeChild(vm.$el);
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
#game
	text-align center
	overflow hidden

	> .field
		perspective 1000px
		transform-style preserve-3d

#opponent-hand
	text-align center

	> div
		display inline-block
		width 120px
		height 165px
		border solid 2px #777
		border-radius 8px

#hand
	text-align center

	> *
		position relative
		margin 0 4px

		&.selected
			box-shadow 0 0 8px #0f0

</style>
