<template>
<div id="home">
	<main>
		<h1>Misskey TCG (仮)</h1>
		<p>ようこそ、<b>{{ name }}</b>さん</p>
		<hr>
		<button @click="play()" :disabled="waiting">{{ waiting ? '相手を待っています...' : '対戦' }}</button>
		<hr>
		<section class="deck">
			<h2>デッキ編成</h2>
			<select ref="cardSelect">
				<option v-for="card in CARDS" :key="card.id" :value="card.id">{{ card.name }}</option>
			</select>
			<button @click="deck.push($refs.cardSelect.value)">追加</button>
			<span v-for="(card, i) in deck.map(x => CARDS.find(y => y.id === x))" :key="i">
				{{ card.name }} <button @click="deck = deck.filter((x, j) => j !== i)">x</button>
			</span>
		</section>
		<section>
			<h2>遊び方</h2>
			<p>Misskey TCG (仮)はターン制のトレーディングカードゲームです。自分だけのデッキを構築し、他の人と対戦します。</p>
			<p>ゲームの目的は、カードを駆使して戦い、相手のライフを0にすることです。</p>
			<p>カードにはユニットカードとスペルカードの2種類あります。ユニットカードはフィールドに出して相手や相手のユニットを攻撃できます。スペルは使用すると何らかの効果を発動します。このようにユニットを出したりスペルを使ったりすることをプレイと呼びます。</p>
			<p>フィールドは、「自分バックライン」「フロントライン」「相手バックライン」の3つのエリアに分かれています。ユニットをプレイするときは、「自分バックライン」のどれかのマスに出さなければなりません。</p>
			<p>ゲームが始まると、最初に手札が提示されます。この時、その中から気に入らないカードを選択して引き直すことができます。</p>
			<p>次に、あなたまたは相手のターンが始まります。自分のターンでは、手札にあるカードをプレイすることができます。</p>
			<p>カードをプレイするときは、そのカードに記載された「コスト」が自分の「エネルギー」から引かれます。エネルギーが足りない場合はプレイできません。エネルギーは、毎ターン自動で回復します。</p>
			<p>フィールドに出たユニットは、次のターンから隣接するマスに移動したり隣接するマスにいる他の敵ユニットに攻撃するといった行動を行えます(それぞれ1ターンに1回だけ)。属性「クイック」を持つユニットは、次のターンからではなくフィールドに出たそのターンからすぐに行動できます。</p>
			<p>ユニットが他のユニットに攻撃すると戦闘が発生し、お互いのパワーからお互いのパワーが引かれます。パワーが0になるとユニットは破壊され、ユニットは「トラッシュ」に移動します。相手のユニットに「ディフェンダー」属性をもつものがいる場合、まずそのユニットから先に戦闘を行わなければなりません。</p>
			<p>フロントラインにいるユニットは相手プレイヤーに攻撃でき、相手のライフが攻撃するユニットのパワーだけ引かれます。相手のライフが0になると勝負に勝ちます。</p>
			<section>
				<h3>操作方法</h3>
				<dl>
					<dt>カードをプレイ</dt>
					<dd>手札にあるプレイしたいカードをクリックし、次にユニットカードなら自分のバックラインの好きなマスを、スペルカードなら「使用」ボタンを押します。</dd>
					<dt>ユニットを移動</dt>
					<dd>フィールドにいる移動したい自分のユニットをクリックして選択状態にし、次に移動先のマスをクリックします。</dd>
					<dt>ユニットを攻撃</dt>
					<dd>フィールドにいる攻撃をする自分のユニットをクリックして選択状態にし、次に攻撃される相手のユニットをクリックします。</dd>
					<dt>相手を攻撃</dt>
					<dd>フィールドにいる攻撃をする自分のユニットをクリックして選択状態にし、次に相手のライフ表示部分をクリックします。</dd>
				</dl>
			</section>
		</section>
		<footer>
			<small>(c) syuilo 2019</small>
		</footer>
	</main>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { CARDS } from '../cards';

export default Vue.extend({
	data() {
		return {
			name: localStorage.getItem('name'),
			deck: localStorage.getItem('deck') ? JSON.parse(localStorage.getItem('deck')!) : [],
			socket: null,
			waiting: false,
			CARDS
		};
	},

	watch: {
		name() {
			localStorage.setItem('name', this.name);
		},

		deck() {
			localStorage.setItem('deck', JSON.stringify(this.deck));
		}
	},

	created() {
		if (this.name == null) {
			this.name = window.prompt('ユーザー名を決めてください');
		}

		this.socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/?name=${this.name}`);

		this.socket.addEventListener('message', async event => {
			const message = JSON.parse(event.data);
			location.href = '/?room=' + message.room;
		});
	},

	methods: {
		play() {
			if (this.deck.length < 20) return alert('デッキ枚数が少なすぎます。');

			const target = window.prompt('相手のユーザー名:');
			if (target == null) return;

			this.socket.send(JSON.stringify({
				target: target,
				deck: this.deck
			}));
			this.waiting = true;
		}
	}
});
</script>

<style lang="stylus" scoped>
#home
	text-align center
	background-color #151515
	background-image url('https://s3.arkjp.net/misskey/6abed245-e216-4078-a489-80f32a195823.jpg')
	background-size cover
	background-position center center
	min-height 100vh
	padding 32px
	box-sizing border-box

	> main
		max-width 800px
		margin 0 auto
		background rgba(0, 0, 0, 0.7)
		backdrop-filter blur(8px)
		padding 64px

		dt
			font-weight bold

		dd + dt
			margin-top 16px

		> section
			padding 32px
			margin 32px 0
			background rgba(0, 0, 0, 0.5)

		> .deck
			> span
				margin 0 8px
</style>
