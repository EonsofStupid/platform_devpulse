import { mount } from 'svelte';
import './app.css'; // Shared styles including Tokens
import ChatApp from './ChatApp.svelte';

const app = mount(ChatApp, {
  target: document.getElementById('chat-root')!,
});

export default app;
