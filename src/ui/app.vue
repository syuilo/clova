<template>
<div id="game">
	<header>
		<p v-if="isMyTurn">あなたのターンです</p>
	</header>
	<div id="opponent-hand" v-if="game">
		<div v-for="i in game.opponentHandCount" :key="i"></div>
	</div>
	<div class="field">
		<x-field v-if="game" :game="game" :my="myPlayerNumber"
			@play="play"
			@move="$emit('move', $event)"
			@attack="$emit('attack', $event)"/>
	</div>
	<div id="hand" v-if="game">
		<x-card v-for="card in game.myHand" :key="card.id"
			:card="card"
			:game="game"
			@click="select(card)"
			:class="{ selected: selectedHandCard === card.id, disabled: lookup(card).cost > game.myEnergy }"/>
	</div>
	<div>
		<button v-if="selectedHandCard && lookup(game.myHand.find(x => x.id === selectedHandCard)).type === 'spell'" @click="playSpell()">使う</button>
	</div>
	<button v-if="isMyTurn" id="end" @click="turnEnd()">ターンエンド</button>
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
import mimic from '../cards/mimic';

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
				mimic.id, mimic.id,
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

				this.$once('attack', payload => {
					res({ type: 'attack', payload });
				});

				this.$once('turnEnd', () => {
					this.selectedHandCard = null;
					res({ type: 'end' });
				});
			});
		},

		select(card) {
			if (this.lookup(card).cost > this.game.myEnergy) return;
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

	> header
		position fixed
		top 0
		left 0
		width 100%

	> .field
		perspective 1000px
		transform-style preserve-3d
		margin -130px 0 -70px 0

#opponent-hand
	text-align center
	transform scale(0.7)

	> div
		display inline-block
		vertical-align top
		width 120px
		height 165px
		margin 0 4px
		background rgba(255, 255, 255, 0.07)
		border-radius 8px

#hand
	display inline-block
	text-align center
	position relative
	background rgba(0, 0, 0, 0.5)
	border-radius 16px
	backdrop-filter blur(6px)
	padding 16px

	> *
		position relative
		margin 0 4px
		border solid 1px rgba(255, 255, 255, 0.3)

		&.selected
			box-shadow 0 0 8px #0f0

		&.disabled
			opacity 0.5

#end
	position fixed
	bottom 16px
	right 16px

</style>
