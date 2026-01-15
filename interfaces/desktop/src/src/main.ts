import { mount } from 'svelte';
import './app.css';
import App from './lib/layouts/app/Frame.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
