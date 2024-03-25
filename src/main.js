import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import VConsole from 'vconsole'

new VConsole();

const app = createApp(App)

app.use(router)
app.mount('#app')
