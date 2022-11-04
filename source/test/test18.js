import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'


const s = reactive(new Set([1, 2, 3]))


const p = reactive({
    foo: 1,
    bar: 2
})


/*
    target = {
                foo:1,
                bar:2
            }
            Map-> 
                  key = symbol()
                                -> effectFn

    target = new Set([1, 2, 3])
                               Map-> 
                                    key = symbol()
                                                 -> effectFn                            
*/


effect(() => {
    // for (const key in p) {
    //     console.log(key);
    // }
    console.log(s.size);
})


s.add(1)



