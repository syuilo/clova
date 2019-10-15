<template>
<div id="field">
	<div class="life my">{{ game.myLife.toString().padStart(2, '0') }}</div>
	<div class="life opponent" @click="directAttack">{{ game.opponentLife.toString().padStart(2, '0') }}</div>
	<div class="cells">
		<div id="back2">
			<x-cell v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i"
				:game="game" :index="i" :my="my" :section="my === 0 ? 'back2' : 'back1'" :selected="selected"
				@selected="onSelected($event, my === 0 ? 'back2' : 'back1')" @move="own(i)"/>
		</div>
		<div id="front">
			<x-cell v-for="i in (my === 0 ? [0, 1, 2, 3] : [3, 2, 1, 0])" :key="i"
				:game="game" :index="i" :my="my" :section="'front'" :selected="selected"
				@selected="onSelected($event, 'front')" @move="move(i)"/>
		</div>
		<div id="back1">
			<x-cell v-for="i in (my === 0 ? [0, 1, 2] : [2, 1, 0])" :key="i"
				:game="game" :index="i" :my="my" :section="my === 0 ? 'back1' : 'back2'" :selected="selected"
				@selected="onSelected($event, my === 0 ? 'back1' : 'back2')" @move="play(i)"/>
		</div>
	</div>
	<div class="deck my">{{ game.myDeck.length.toString().padStart(2, '0') }}</div>
	<div class="deck opponent">{{ game.opponentDeckCount.toString().padStart(2, '0') }}</div>
	<div class="trash my">{{ game.myTrash.length.toString().padStart(2, '0') }}</div>
	<div class="trash opponent">{{ game.opponentTrashCount.toString().padStart(2, '0') }}</div>
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
			if (this.selected == null) return;
			if (this.$parent.movedUnits.includes(this.selected.id)) return alert('このユニットは既に移動しました');
			if (this.$parent.playedUnits.includes(this.selected.id) && !this.selected.attrs.includes('quick')) return alert('プレイしたターンに移動することはできません');
			this.$parent.movedUnits.push(this.selected.id);
			this.$emit('move', { card: this.selected.id, index: index });
		},

		onSelected(card, section) {
			if (this.selected && card.owner !== this.my) {
				if (this.$parent.attackedUnits.includes(this.selected.id)) return alert('このユニットは既に攻撃しました');
				if (this.$parent.playedUnits.includes(this.selected.id) && !this.selected.attrs.includes('quick')) return alert('プレイしたターンに攻撃することはできません');
				if (!card.attrs.includes('defender') && this.game.field[section].some(x => x.type === 'unit' && x.card.attrs.includes('defender') && x.card.owner !== this.my)) return alert('対象のユニットはディフェンダーに守られています');
				this.$parent.attackedUnits.push(this.selected.id);
				this.$emit('attack', { card: this.selected.id, target: card.id });
			} else {
				this.selected = card;
			}
		},

		directAttack() {
			if (this.selected == null) return;
			if (this.$parent.attackedUnits.includes(this.selected.id)) return alert('このユニットは既に攻撃しました');
			if (this.game.field[this.my === 0 ? 'back2' : 'back1'].some(x => x.type === 'unit' && x.card.attrs.includes('defender'))) return alert('相手はディフェンダーに守られています');
			this.$parent.attackedUnits.push(this.selected.id);
			this.$emit('directAttack', { card: this.selected.id });
		}
	}
});
</script>

<style lang="stylus" scoped>
#field
	background-color #151515
	background-image url('https://s3.arkjp.net/misskey/6abed245-e216-4078-a489-80f32a195823.jpg')
	background-size cover
	background-position center center
	padding 32px 0
	width 700px
	margin 0 auto
	transform rotateX(45deg)
	$margin = 16px
	$padding = 20px

	> .life
		position absolute
		left 0
		right 0
		width 100px
		font-weight bold
		font-size 30px
		padding 8px 16px
		margin -32px auto
		cursor pointer

		&.my
			bottom 0
			background rgba(41, 110, 214, 0.5)

		&.opponent
			top 0
			background rgba(214, 41, 57, 0.5)

	> .trash
		position absolute
		background rgba(214, 41, 177, 0.5)
		font-weight bold
		font-size 30px
		padding 8px 16px

		&.my
			left $padding
			bottom $padding

		&.opponent
			right $padding
			top $padding

	> .deck
		position absolute
		background rgba(214, 161, 41, 0.5)
		font-weight bold
		font-size 30px
		padding 8px 16px

		&.my
			right $padding
			bottom $padding

		&.opponent
			left $padding
			top $padding

	> .cells
		> div
			text-align center
			margin $margin 0

			> *
				display inline-block
				vertical-align bottom
				width 120px
				height 165px
				margin 0 ($margin / 2)
				border solid 2px rgba(255, 255, 255, 0.2)
				border-radius 8px
				backdrop-filter blur(16px)
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
