import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import apex from "./plugins/apex";
import config from "./config/config.json";

Vue.config.productionTip = false

Vue.use(apex, config.api);

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
