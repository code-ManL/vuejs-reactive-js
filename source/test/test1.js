// 实验1
import { effect, track, trigger } from "../effect.js"

const data = {
    text: 'hello world',
    e: 'dwa'
}

const obj = new Proxy(data, {
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

function fn() {
    // 读取操作的时候就当前函数放入了桶当中
    document.body.innerHTML = obj.text
}

effect(fn)