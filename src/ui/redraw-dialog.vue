<template>
<div id="redraw">
	<div>
		<p>引き直すカードを選択してください</p>
		<div>
			<x-card v-for="card in cards" :key="card.id" :card="card" @click="toggle(card)" :class="{ active: redraw.some(c => c.id === card.id) }"/>
		</div>
		<button @click="ok()">OK</button>
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
		cards: {
			type: Array,
			required: true
		},
	},

	data() {
		return {
			redraw: []
		};
	},

	methods: {
		toggle(card) {
			if (this.redraw.some(c => c.id === card.id)) {
				this.redraw = this.redraw.filter(c => c.id !== card.id);
			} else {
				this.redraw.push(card);
			}
		},

		ok() {
			this.$emit('chosen', this.redraw);
		}
	}
});
</script>

<style lang="stylus" scoped>
#redraw
	position fixed
	top 0
	left 0
	width 100%
	height 100%
	background rgba(0, 0, 0, 0.5)

	> div
		text-align center
		margin 64px
		padding 32px
		background rgba(0, 0, 0, 0.5)
		backdrop-filter blur(16px)

		> div
			> *
				margin 0 8px

				&.active
					box-shadow 0 0 8px rgba(255, 0, 0, 0.5)
</style>
