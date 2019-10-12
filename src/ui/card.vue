<template>
<div class="card" @click="$emit('click', card)" :class="def.type">
	<header>{{ def.name }}</header>
	<div class="image" :style="{ backgroundImage: `url('${def.image}')` }"></div>
	<div class="defender" v-if="def.type === 'unit' && card.skills.includes('defender')"><fa :icon="faShieldAlt"/></div>
	<div class="cost">{{ def.cost }}</div>
	<div class="power" v-if="def.type === 'unit'" :class="{ inc: card.power > def.power, dec: card.power < def.power }">{{ card.power }}</div>
</div>
</template>

<script>
import Vue from 'vue';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { CARDS } from '../cards';

export default Vue.extend({
	props: {
		card: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			def: CARDS.find(x => x.id === this.card.def),
			faShieldAlt
		};
	},
});
</script>

<style lang="stylus" scoped>
@keyframes blink {
	5% { opacity: 0.0; }
}

.card
	display inline-block
	vertical-align bottom
	box-sizing border-box
	width 120px
	height 165px
	border-radius 8px
	overflow hidden
	font-weight bold

	&.spell
		background rgba(61, 43, 70, 0.5)

	&.unit
		border-radius 32px 32px 8px 8px
		background rgba(0, 0, 0, 0.5)

	> *
		pointer-events none
		user-select none

	> header
		font-size 10px
		line-height 20px
		border-bottom solid 1px rgba(0, 0, 0, 0.1)

	> .image
		margin-top 8px
		height 100px
		width 100%
		background-size contain
		background-position center center
		background-repeat no-repeat

	> .defender
		animation blink 1s ease infinite

	> .cost
		position absolute
		bottom 0
		right 0
		border-top solid 2px #777
		border-left solid 2px #777
		border-radius 8px 0 0 0
		padding 0 4px

	> .power
		position absolute
		bottom 0
		left 0
		border-top solid 2px #777
		border-right solid 2px #777
		border-radius 0 8px 0 0
		padding 0 4px

		&.inc
			color #0ff

		&.dec
			color #f00

</style>
