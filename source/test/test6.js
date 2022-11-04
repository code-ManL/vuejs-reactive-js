import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = { d: 2 }

const proto = { bar: 1 }

const child = reactive(obj)

const toChildProto = reactive(proto)


Object.setPrototypeOf(child, toChildProto)

effect(() => {
    console.log(child.bar);
})

child.bar = 2

/*
    get(target, key, reveiver) {

        // child 自身上是没有 bar 属性的，但是依旧会收集依赖  {"bar" => Set(1)}
        track(target, key)

        
        //  走到这里的时候相当于 Reflect.get(obj,'bar',reveiver),这里其实是实现了通过obj.bar来访问属性值的默认行为，引擎内部通过调用
        obj对象所部署的[[GET]]内部方法来得到最终结果，引擎调用[[GET]]发现对象自身不存在该属性，那么会获取对象的原型,并调用原型的[[GET]]方法得到
        最终结果。对应上例，当读取child.bar属性值时，由于代理的对象obj自身没有bar属性，因此会获取对象obj的原型


        const res = Reflect.get(target, key, reveiver)
        return res
    },





*/


