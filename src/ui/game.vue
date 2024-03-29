<template>
<div id="game">
	<header>
		<template v-if="!ready">
			<p>相手を待っています...</p>
		</template>
		<template v-else>
			<p v-if="isMyTurn" class="blink">あなたのターンです</p>
			<p v-if="started && !isMyTurn">相手を待っています...</p>
			<p v-if="redrawed && !started">相手を待っています...</p>
			<p v-if="!redrawed && !started" class="blink">あなたを待っています...</p>
		</template>
	</header>
	<div id="opponent-hand" v-if="game">
		<div v-for="i in game.opponentHandCount" :key="i"></div>
	</div>
	<div class="field">
		<x-field v-if="game" :game="game" :my="myPlayerNumber"
			@play="play"
			@move="$emit('move', $event)"
			@attack="$emit('attack', $event)"
			@directAttack="$emit('directAttack', $event)"/>
	</div>
	<div id="hand" v-if="game">
		<x-card v-for="card in game.myHand" :key="card.id" class="card"
			:card="card"
			@click="select(card)"
			:class="{ selected: selectedHandCard === card.id, disabled: card.cost > game.myEnergy }"/>
		<div class="energy">{{ game.myEnergy }}</div>
	</div>
	<div>
		<button v-if="selectedHandCard && lookup(game.myHand.find(x => x.id === selectedHandCard)).type === 'spell'" @click="playSpell()">使う</button>
	</div>
	<button v-if="isMyTurn" id="end" @click="turnEnd()">ターンエンド</button>
	<div class="card-info" v-if="infoCard">
		<h1>{{ infoCard.name }}</h1>
		<p v-if="infoCard.type === 'unit' && infoCard.attrs.length > 0">{{ infoCard.attrs.map(attr => attr === 'quick' ? 'クイック' : 'ディフェンス' ).join('・') }}</p>
		<p>{{ infoCard.desc }}</p>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCard from './card.vue';
import XRedrawDialog from './redraw-dialog.vue';
import XCardChoiceDialog from './card-choice-dialog.vue';
import XUnitChoiceDialog from './unit-choice-dialog.vue';
import XChoiceFieldIndexDialog from './choice-field-index-dialog.vue';
import XField from './field.vue';
import { CARDS } from '../cards';
import TreasureChest from '../cards/treasure-chest';
import slime from '../cards/slime';
import golem from '../cards/golem';
import treasureChest from '../cards/treasure-chest';
import dragon from '../cards/dragon';
import witch from '../cards/witch';
import energyDrink from '../cards/energy-drink';
import movingHaniwa from '../cards/moving-haniwa';
import { Card, ClientState } from '../engine';
import mimic from '../cards/mimic';
import barrier from '../cards/barrier';
import cracking from '../cards/cracking';
import goldenDragon from '../cards/golden-dragon';
import godDog from '../cards/god-dog';
import necromancer from '../cards/necromancer';

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
			started: false,
			redrawed: false,
			ready: false,
			infoCard: null,
		};
	},

	computed: {
		isMyTurn(): boolean {
			return this.game && this.started && (this.game.turn === this.myPlayerNumber);
		}
	},

	created() {
		const actions = [];
		const name = localStorage.getItem('name');
		const room = window.location.search.match(/\?room=(.+?)$/)![1];
		const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/?name=${name}&room=${room}`);

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
			} else if (message.type === 'end') {
				this.game = message.payload.game;
				alert(this.game.winner === this.myPlayerNumber ? 'あなたの勝ちです' : 'あなたの負けです');
				location.href = '/';
				return;
			} else if (message.type === 'q') {
				const { type, payload, game, player1 } = message.payload;
				this.game = game;

				let res = null;

				this.ready = true;
				this.started = type !== 'choiceRedrawCards';

				if (type === 'choiceRedrawCards') {
					res = await this.choiceRedrawCards(payload);
					this.redrawed = true;
				} else if (type === 'mainPhase') {
					res = await this.mainPhase();
				} else if (type === 'cardChoice') {
					res = await this.cardChoice(payload);
				} else if (type === 'unitChoice') {
					res = await this.unitChoice(payload);
				} else if (type === 'choiceFieldIndex') {
					res = await this.choiceFieldIndex();
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

				this.$once('directAttack', payload => {
					res({ type: 'directAttack', payload });
				});

				this.$once('turnEnd', () => {
					this.selectedHandCard = null;
					res({ type: 'end' });
				});
			});
		},

		select(card) {
			this.infoCard = this.lookup(card);
			if (card.cost > this.game.myEnergy) return;
			this.selectedHandCard = card.id;
		},

		play(index) {
			if (this.selectedHandCard == null) return;
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
		},

		unitChoice(owner) {
			return new Promise((res) => {
				const vm = this.$root.new(XUnitChoiceDialog, {
					game: this.game,
					owner: owner,
					my: this.myPlayerNumber
				}).$on('chosen', card => {
					res(card.id);
					vm.$el.parentNode.removeChild(vm.$el);
				});
			});
		},

		choiceFieldIndex() {
			return new Promise((res) => {
				const vm = this.$root.new(XChoiceFieldIndexDialog, {
					game: this.game,
					my: this.myPlayerNumber
				}).$on('chosen', index => {
					res(index);
					vm.$el.parentNode.removeChild(vm.$el);
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@keyframes blink {
	50% { opacity: 0.0; }
}

#game
	text-align center
	overflow hidden

	> header
		position fixed
		z-index 1000
		top 0
		left 0
		width 100%
		background rgba(0, 0, 0, 0.7)
		backdrop-filter blur(4px)

		.blink
			animation blink 1s ease infinite

	> .field
		perspective 1000px
		transform-style preserve-3d
		margin -130px 0 0 0

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
	margin-bottom 50px

	> .energy
		position absolute
		bottom -33px
		left 0
		right 0
		width 100px
		margin auto
		padding-bottom 8px
		line-height 25px
		background rgba(0, 0, 0, 0.5)
		border-radius 0 0 16px 16px

	> .card
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
