import Vue from 'vue';
import Home from './home.vue';
import Game from './game.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

Vue.component('fa', FontAwesomeIcon);

console.log(window.location.pathname);

let page = Home;
if (window.location.search.startsWith('?room=')) page = Game;

const v = new Vue({
	render: h => h(page),

	methods: {
		new(vm: { new(...args: any[]): Vue }, props: Record<string, any>) {
			const x = new vm({
				parent: this,
				propsData: props
			}).$mount();
			document.body.appendChild(x.$el);
			return x;
		},
	}
});

v.$mount('#app');
