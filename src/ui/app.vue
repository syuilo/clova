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
import { Game, Player } from '../engine';
import { Controller, ActionSupplier } from '../engine/controller';
import TreasureChest from '../cards/treasure-chest';

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
			return this.game.players[0].hand;
		}
	},

	created() {
		const deckA = [];
		for (let i = 0; i < 40; i++) {
			deckA.push({
				def: TreasureChest.id,
				id: i
			});
		}

		const deckB = [];
		for (let i = 0; i < 40; i++) {
			deckB.push({
				def: TreasureChest.id,
				id: i + 100
			});
		}

		const playerA = new Player(deckA);
		const playerB = new Player(deckB);

		const player1Actions: ActionSupplier = {
			choiceRedrawCards: this.choiceRedrawCards,

			mainPhase: () => {
				const act = window.prompt('MAIN');
				if (act == null) return { type: 'turnEnd' };

				switch (act.split(' ')[0]) {
					case 'summon': return { type: 'summon',  };

					default:
						break;
				}
			}
		};

		const player2Actions: ActionSupplier = {
			choiceRedrawCards: (cards) => new Promise((res) => {
				setTimeout(() => {
					res([cards[Math.floor(Math.random() * cards.length)].id]);
				}, 5000);
			}),

			mainPhase: () => {
				const act = window.prompt('MAIN');
				if (act == null) return { type: 'turnEnd' };

				switch (act.split(' ')[0]) {
					case 'summon': return { type: 'summon',  };

					default:
						break;
				}
			}
		};

		const controller = new Controller([player1Actions, player2Actions]);

		this.game = new Game([
			TreasureChest
		], [playerA, playerB], controller);

		this.game.start();
	},

	methods: {
		choiceRedrawCards(cards) {
			return new Promise((res) => {
				this.$root.new(XRedrawDialog, {
					game: this.game,
					cards: cards
				}).$on('chosen', cards => {
					res(cards.map(card => card.id));
				});
			});
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
