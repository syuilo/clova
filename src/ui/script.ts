import Vue from 'vue';
import App from './app.vue';

const v = new Vue({
	render: h => h(App),

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
