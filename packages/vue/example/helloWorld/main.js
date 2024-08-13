import { createApp } from '../../dist/vue.esm-bundler.js'
import App from './App.js'

const rootContainer = document.querySelector('#root')
createApp(App).mount(rootContainer)
