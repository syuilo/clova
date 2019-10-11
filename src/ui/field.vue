<template>
<div id="field">
	<div id="back2">
		<x-cell v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i" :game="game" :index="i" :my="my" :section="my === 0 ? 'back2' : 'back1'" @selected="selected = $event" :selected="selected" @move="own(i)"/>
	</div>
	<div id="front">
		<x-cell v-for="i in (my === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0])" :key="i" :game="game" :index="i" :my="my" :section="'front'" @selected="selected = $event" :selected="selected" @move="move(i)"/>
	</div>
	<div id="back1">
		<x-cell v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i" :game="game" :index="i" :my="my" :section="my === 0 ? 'back1' : 'back2'" @selected="selected = $event" :selected="selected" @move="play(i)"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCell from './cell.vue';

export default Vue.extend({
	components: {
		XCell
	},

	props: {
		game: {
			type: Object,
			required: true
		},
		my: {
			type: Number,
			required: true
		}
	},

	data() {
		return {
			selected: null
		};
	},

	methods: {
		own(index) {
			this.$emit('own', index);
		},

		play(index) {
			this.$emit('play', index);
		},

		move(index) {
			console.log(index);
			this.$emit('move', { card: this.selected.id, index: index });
		},
	}
});
</script>

<style lang="stylus" scoped>
#field
	$margin = 16px

	> div
		text-align center
		margin $margin 0

		> div
			display inline-block
			vertical-align bottom
			width 120px
			height 165px
			margin 0 ($margin / 2)
			border solid 2px #b7b7b7
			border-radius 8px
			backdrop-filter blur(4px)
			perspective 2000px
			transform-style preserve-3d

			> *
				position absolute
				top 0
				left 0

		&#back1 > div
			border-color rgba(0, 231, 255, 0.3)

		&#back2 > div
			border-color rgba(255, 0, 82, 0.3)

</style>
