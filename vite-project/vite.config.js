import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { frameless_plugin } from './frameless_plugin';


export default defineConfig({
  plugins: [
    frameless_plugin()
  ],
  build: {
    minify: false,
  },
  esbuild:{
    jsx:'transform',
    jsxDev:true,
    jsxFactory:'h',
    jsxFragment:'null'
  }
})
