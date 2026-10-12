import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import { animateDirective } from './directives/animate';
import { permissionDirective } from './directives/permission';
import { revealDirective } from './directives/reveal';

// Apply the theme before mounting. Dark is the default: only an explicit
// 'light' preference opts out (this replaces the old light-by-default logic).
// This used to be an inline <script> in index.html; it lives here so the page is
// compatible with a strict Content-Security-Policy (inline scripts are blocked).
if (localStorage.getItem('theme') !== 'light') {
  document.documentElement.classList.add('dark');
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.directive('animate', animateDirective);
app.directive('permission', permissionDirective);
app.directive('reveal', revealDirective);

app.mount('#app');
