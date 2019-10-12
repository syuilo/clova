<template>
<div id="home">
	<h1>Misskey TCG (仮)</h1>
	<p>ようこそ、<b>{{ name }}</b>さん</p>
	<hr>
	<button @click="play()" :disabled="waiting">{{ waiting ? '相手を待っています...' : '対戦' }}</button>
	<hr>
	<section>
		<h2>デッキ編成</h2>
		<select ref="cardSelect">
			<option v-for="card in CARDS" :key="card.id" :value="card.id">{{ card.name }}</option>
		</select>
		<button @click="deck.push($refs.cardSelect.value)">追加</button>
		<div v-for="(card, i) in deck.map(x => CARDS.find(y => y.id === x))" :key="i">
			{{ card.name }} <button @click="deck = deck.filter((x, j) => j !== i)">x</button>
		</div>
	</section>
	<hr>
	<section>
		<h2>遊び方</h2>
		<p>
			Misskey TCG (仮)はターン制のトレーディングカードゲームです。自分だけのデッキを構築し、他の人と対戦します。<br>
			ゲームの目的は、カードを駆使して戦い、相手のライフを0にすることです。<br>
			カードにはユニットカードとスペルカードの2種類あります。ユニットカードはフィールドに出して相手や相手のユニットを攻撃できます。スペルは使用すると何らかの効果を発動します。このようにユニットを出したりスペルを使ったりすることをプレイと呼びます。<br>
			フィールドは、「自分バックライン」「フロントライン」「相手バックライン」の3つのエリアに分かれています。ユニットをプレイするときは、「自分バックライン」のどれかのマスに出さなければなりません。<br>
			ゲームが始まると、最初に手札が提示されます。この時、その中から気に入らないカードを選択して引き直すことができます。<br>
			次に、あなたまたは相手のターンが始まります。自分のターンでは、手札にあるカードをプレイすることができます。<br>
			カードをプレイするときは、そのカードに記載された「コスト」が自分の「エネルギー」から引かれます。エネルギーが足りない場合はプレイできません。エネルギーは、毎ターン自動で回復します。<br>
		</p>
	</section>
	<hr>
	<footer>
		<small>(c) syuilo 2019</small>
	</footer>
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
</style>
