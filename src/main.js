import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';


Vue.config.productionTip = false;

Vue.use({ store });

new Vue({
  router,
  render(h) { return h(App); },
}).$mount('#app');
