// 实验3
import { effect, track, trigger } from "../effect.js"

const data3 = { foo: 1, }
const obj3 = new Proxy(data3, {
    get(target, key) {
        track(target, key)
        // 返回读取的值
        return target[key]
    },
    set(target, key, newVal) {
        // 设置属性值
        target[key] = newVal;
        trigger(target, key)
        return true
    }
})


effect(() => {
    obj3.foo = obj3.foo + 1
})

console.log(obj3.foo);

