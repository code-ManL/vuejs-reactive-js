// 实验2
import { effect, track, trigger } from "../effect.js"


const data2 = { foo: true, bar: true }
const obj2 = new Proxy(data2, {
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

let temp1, temp2
/**
 *  当传入f1的时候，可以简单的将activeEffect理解为存储的是f1,然后执行函数的过程中，又调用了effect，此时的activeEffect指向了f2,
 *  导致bar的依赖为f2,然后继续执行到foo，触发track，而此时的activeEffect还是指向的f2,这就导致了foo的依赖也是f2
 * 
 * 
 */
function f1() {
    console.log('f1 执行了');

    // 这个依赖会被重复收集
    effect(function f2() {
        console.log('f2 执行了');
        temp2 = obj2.bar
    })
    temp1 = obj2.foo
}

// 向注册函数中传入我们自定义的副作用函数
// effect(f1)

// setTimeout(() => {
//     // 走这一步的时候，foo和bar的依赖都被清空，然后重新执行的是f2
//     obj2.foo = false
//     // 尝试读取一个obj对象上不存在的属性的时候，副作用函数会执行两次
//     // obj.notExist = 'aa'
// }, 1000)

// setTimeout(() => {
//     obj2.foo = true
//     // 尝试读取一个obj对象上不存在的属性的时候，副作用函数会执行两次
//     // obj.notExist = 'aa'
// }, 1000)
