<template>
<div class="card" @click="$emit('click')">
	<header>{{ game.lookupCard(card).name }}</header>
</div>
</template>

<script>
import Vue from 'vue';

export default Vue.extend({
	props: {
		card: {
			type: Object,
			required: true
		},
		game: {
			type: Object,
			required: true
		},
	},
});
</script>

<style lang="stylus" scoped>
.card
	display inline-block
	width 120px
	height 165px
	border solid 2px #777
	border-radius 8px

	> *
		pointer-events none
		user-select none

	> header
		font-size 14px
		border-bottom solid 1px #eee

</style>
