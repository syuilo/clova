<template>
<div class="cell" @click="card == null ? $emit('move') : () => {}">
	<x-card v-if="card" :card="card" :class="{ selected: selected && (selected.id === card.id), opponent: card.owner !== my }"
		@click="$emit('selected', card)"/>
	<div class="cursor a"></div>
	<div class="cursor b"></div>
	<div class="cursor c"></div>
	<div class="cursor d"></div>
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
		game: {
			type: Object,
			required: true
		},
		my: {
			type: Number,
			required: true
		},
		index: {
			type: Number,
			required: true
		},
		section: {
			type: String,
			required: true
		},
		selected: {
			required: true
		},
	},

	computed: {
		card() {
			if (this.game.field[this.section][this.index].type === 'unit') {
				return this.game.field[this.section][this.index].card;
			} else {
				return null;
			}
		}
	},
});
</script>

<style lang="stylus" scoped>
.cell
	> *:not(.cursor)
		&.selected
			box-shadow 0 0 8px #f00

		&.opponent
			transform rotate(180deg)

	> .cursor
		position absolute
		width 20px
		height 20px
		pointer-events none
		opacity 0

		$margin = 10px
		$thickness = 2px
		$radius = 9px

		&.a
			top -($margin)
			left -($margin)
			border-top solid $thickness #fff
			border-left solid $thickness #fff
			border-radius $radius 0 0 0

		&.b
			top -($margin)
			right -($margin)
			border-top solid $thickness #fff
			border-right solid $thickness #fff
			border-radius 0 $radius 0 0

		&.c
			bottom -($margin)
			left -($margin)
			border-bottom solid $thickness #fff
			border-left solid $thickness #fff
			border-radius 0 0 0 $radius

		&.d
			bottom -($margin)
			right -($margin)
			border-bottom solid $thickness #fff
			border-right solid $thickness #fff
			border-radius 0 0 $radius 0

	&:hover
		> .cursor
			opacity 1

</style>
