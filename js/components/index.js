import Vue from 'vue'
import Child from './Child'
import Button from './Button'
import Spinner from './Spinner'
import { HasError, AlertError, AlertSuccess } from 'vform'
import InputHelp from './InputHelp'

// Components that are registered globaly.
[
    Child,
    Button,
    Spinner,
    HasError,
    AlertError,
    AlertSuccess,
    InputHelp
].forEach(Component => {
    Vue.component(Component.name, Component)
})
