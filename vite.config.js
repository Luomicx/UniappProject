import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        uni(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, '.'),
            'uview-plus': resolve(__dirname, 'node_modules/uview-plus')
        }
    }
})