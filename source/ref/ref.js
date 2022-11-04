
import { reactive } from "../createReactive/reactive/reactive.js"

export function ref(val) {
    const wrapper = {
        get value() {
            return val
        }
    }
    //  定义一个不可枚举 且 不可写的属性，__v_isRef 为true，代表这个对象是 ref
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })

    // ref 底层也是进行 reactive包装
    return reactive(wrapper)
}