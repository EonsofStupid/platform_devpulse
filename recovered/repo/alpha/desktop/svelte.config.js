import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    alias: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*'
    }
  }
};
