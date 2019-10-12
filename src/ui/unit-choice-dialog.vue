<template>
<div id="unit-choice">
	<div>
		<p>ユニットを1体選択してください</p>
		<div>
			<div>
				<div v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i">
					<x-card v-if="game.field[my === 0 ? 'back2' : 'back1'][i].type === 'unit'"
						:card="game.field[my === 0 ? 'back2' : 'back1'][i].card" :class="{ selected: selected === game.field[my === 0 ? 'back2' : 'back1'][i].card, disabled: owner !== null && owner !== game.field[my === 0 ? 'back2' : 'back1'][i].card.owner }" @click="select(game.field[my === 0 ? 'back2' : 'back1'][i].card)"/>
				</div>
			</div>
			<div>
				<div v-for="i in (my === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0])" :key="i">
					<x-card v-if="game.field.front[i].type === 'unit'"
						:card="game.field.front[i].card" :class="{ selected: selected === game.field.front[i].card, disabled: owner !== null && owner !== game.field.front[i].card.owner }" @click="select(game.field.front[i].card)"/>
				</div>
			</div>
			<div>
				<div v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i">
					<x-card v-if="game.field[my === 0 ? 'back1' : 'back2'][i].type === 'unit'"
						:card="game.field[my === 0 ? 'back1' : 'back2'][i].card" :class="{ selected: selected === game.field[my === 0 ? 'back1' : 'back2'][i].card, disabled: owner !== null && owner !== game.field[my === 0 ? 'back1' : 'back2'][i].card.owner }" @click="select(game.field[my === 0 ? 'back1' : 'back2'][i].card)"/>
				</div>
			</div>
		</div>
		<button v-if="selected" @click="$emit('chosen', selected)">決定</button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCard from './card.vue';

export default Vue.extend({
	components: {
		XCard
	},

	props: {
		owner: {
			type: Number,
			required: false
		},
		game: {
			type: Object,
			required: true
		},
		my: {
			type: Number,
			required: true
		},
	},

	data() {
		return {
			selected: null
		};
	},

	methods: {
		select(card) {
			if (this.owner !== null && card.owner !== this.owner) return;
			this.selected = card;
		}
	}
});
</script>

<style lang="stylus" scoped>
#unit-choice
	position fixed
	top 0
	left 0
	width 100%
	height 100%
	background rgba(0, 0, 0, 0.5)

	> div
		text-align center

		> div
			> div
				margin 16px 0

				> div
					display inline-block
					vertical-align bottom
					width 120px
					height 165px
					margin 0 8px
					border solid 2px rgba(255, 255, 255, 0.2)
					border-radius 8px

					> *
						&.selected
							box-shadow 0 0 8px rgba(255, 0, 0, 0.5)

						&.disabled
							opacity 0.5
</style>
