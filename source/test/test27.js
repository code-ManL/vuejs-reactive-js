import { reactive } from '../createReactive/reactive/reactive.js'
import { toRefs } from '../ref/toRefs.js'
import { effect } from '../effect.js'

const obj = reactive({
    foo: 1,
    bar: 2
})

const newobj = {
    foo: {
        get value() {
            return obj.foo
        }
    },
    bar: {
        get value() {
            return obj.bar
        }
    }
}



effect(() => {
    console.log(newobj.foo);
})


obj.foo = 100