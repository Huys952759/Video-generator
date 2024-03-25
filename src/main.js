import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router'
import VConsole from 'vconsole'


if (!HTMLCanvasElement.prototype.toBlob) {
    console.log('poly-fill')
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
     value: function (callback, type, quality) {
   
       var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
           len = binStr.length,
           arr = new Uint8Array(len);
   
       for (var i=0; i<len; i++ ) {
        arr[i] = binStr.charCodeAt(i);
       }
   
       callback( new Blob( [arr], {type: type || 'image/png'} ) );
     }
    });
   }

new VConsole();

const app = createApp(App)

app.use(router)
app.mount('#app')
