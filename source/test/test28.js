import { reactive } from '../createReactive/reactive/reactive.js'
import { effect } from '../effect.js'
import { toRefs, toRef } from '../ref/toRefs.js'
import { proxyRefs } from '../ref/toRefs.js'

const obj = reactive({
    foo: {
        zoo: 3
    },
    bar: 2
})


effect(() => {
    console.log(obj.foo.zoo);
})

const newobj = toRef(obj, 'foo')

newobj.value.zoo = 4
