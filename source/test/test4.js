import { effect, track, trigger } from "../effect.js"


//实验4 调度器，多次修改数据，只触发一次更新,Vue.js底层实现原理
//定义一个任务队列
const jobQuene = new Set()
const p = Promise.resolve()

// 一个标志代表是否正在刷新队列
let isFlushing = false

function flushJob() {

    // 这个队列是否正在刷新
    if (isFlushing) return

    // 设置为true，表示正在刷新
    isFlushing = true

    // 在微任务队列中刷新jobQuene 队列
    p.then(() => {
        jobQuene.forEach(job => job())
    }).finally(() => {
        // 结束之后重置isFlushing
        isFlushing = false
    })
}

const data4 = { foo: 1, }
const obj4 = new Proxy(data4, {
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

effect(
    () => {
        console.log(obj4.foo)
    },
    // options
    {
        scheduler(fn) {
            // 每次调度，将副作用函数添加到 jobQuenet 队列中
            jobQuene.add(fn)
            // 调用 flushjob 刷新队列
            flushJob()
        }
    }
)

obj4.foo++

obj4.foo++

