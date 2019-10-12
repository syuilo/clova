<template>
<div id="card-choice">
	<div>
		<p>カードをひとつ選択してください</p>
		<x-card v-for="card in cards" :key="card.id" :card="card" @click="select(card)"/>
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

	methods: {
		select(card) {
			this.$emit('chosen', card);
		}
	}
});
</script>

<style lang="stylus" scoped>
#card-choice
	position fixed
	top 0
	left 0
	width 100%
	height 100%
	background rgba(0, 0, 0, 0.5)

	> div
		text-align center

		> *
			margin 0 8px

			&.active
				box-shadow 0 0 8px rgba(255, 0, 0, 0.5)
</style>
