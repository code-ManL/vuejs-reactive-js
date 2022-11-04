import { track, trigger } from "../effect.js";
import { TriggerType, ITERATE_KEY, MAP_ITERATE_KEY } from '../Types/Types.js';
import { reactive } from "./reactive/reactive.js";
import { readonly } from "./readonly/readonly.js";

// 在设置的对象如果已经是响应式 或者 返回的对象已经是响应式的时候
function getRaw(value) {
  return value.raw || value
}

// 重写 Set 和 Map 身上自带的方法
const mutableInstrumentations = {
  add(key) {
    //  this 仍然指向的是代理对象,通过 raw 获取原始对象
    const target = this.raw

    // 先判断值是否已经存在
    const hadKey = target.has(key)

    let res;

    if (!hadKey) {
      // 通过原始数据对象执行 add 方法添加具体的值
      // 注意,这里不再需要 .bind 了,因为直接通过 target 调用并执行的
      const rawKey = getRaw(key)

      res = target.add(rawKey)

      // 调用 trigger 函数触发响应,并指定操作类型为 ADD
      trigger(target, key, 'ADD')
    }

    // 返回操作结果
    return res
  },
  delete(key) {
    //  this 仍然指向的是代理对象,通过 raw 获取原始对象
    const target = this.raw

    // 先判断值是否已经存在
    const hadKey = target.has(key)

    // 通过原始数据对象执行 add 方法添加具体的值
    // 注意,这里不再需要 .bind 了,因为直接通过 target 调用并执行的
    const res = target.delete(key)

    if (hadKey) {
      // 调用 trigger 函数触发响应,并指定操作类型为 ADD
      trigger(target, key, 'DELETE')
    }

    // 返回操作结果
    return res
  },
  get(key) {
    // 获取原始对象
    const target = this.raw

    //判断读取的 key 是否存在
    const had = target.has(key)

    // 追踪依赖，建立响应联系，为什么如果没有这个值也建立依赖关系，因为可能在副作用函数里面没有这个值，但是在外面set了，那么应该重新执行该key所依赖的副作用函数，显示值
    track(target, key)

    // 如果存在，则返回结果。这里要注意的而是，如果得到的结果 res 是对象类型，
    // 则要返回使用 reactive 包装后的响应式数据
    if (had) {
      const res = target.get(key)

      // 判断是不是浅层次响应 ***************************************************************************************************** 新加
      const isShllow = mutableInstrumentations.get.isShllow.has(this)

      // 问题如果本身是代理的，又代理了一遍   ***************************************************************************************************** 新加
      return typeof res === 'object' ? isShllow ? res : reactive(getRaw(res)) : res
    }
  },
  set(key, value) {
    const target = this.raw
    const had = target.has(key)

    // 获取旧值
    const oldVal = target.get(key)

    // 设置新值 我们把value 原封不动的设置到了原始数据上，我们把响应式数据设置到原始数据上的行为称为数据污染，进行 rawValue 判断
    const rawValue = getRaw(value)

    console.log('走了', rawValue);

    
    target.set(key, rawValue)

    // 如果不存在，则说明 ADD 类型的操作，意味着新增
    if (!had) {
      // 触发 target key 上的副作用函数，ADD 控制 ITERATE_KEY 相关的副作用函数触发更新 包括 for 循环，size这些属性
      trigger(target, key, 'ADD')
    } else if (oldVal !== value || (oldVal === oldVal && value === value)) {
      //  如果不存在，并且值变了，则是 SET 类型的操作，意味着修改
      trigger(target, key, 'SET')
    }
  },
  forEach(callback, thisArg) {
    // wrap 函数用来把可代理的值转换为响应式数据，因为对于 Map 来说，SET 类型的操作也应该触发响应  
    const wrap = (val) => typeof val === 'object' ? reactive(val) : val

    // 取得原始对象
    const target = this.raw

    // 与 ITERATE_KEY 建立响应联系
    track(target, ITERATE_KEY)

    // 通过原始数据对象调用 forEach 方法，并把 callback 传递过去
    target.forEach((v, k) => {

      // 手动调用 callback，用 wrap 函数包裹 value 和 key 后再传给 callback，这样就实现了深响应
      // 这里因为 k 也可能是对象数据类型，map 的键可以是对象，如果 callback 函数中有对其进行操作，也应该建立依赖关系
      callback.call(thisArg, wrap(v), wrap(k), this)
    })
  },
  // for...of 遍历 Map 或者 Set 的时候，会获取这个迭代器工厂函数，然后调用返回迭代器
  [Symbol.iterator]: iterationMethod,
  entries: iterationMethod,
  values: valuesIterationMethod,
  keys: keysIterationMethod
}

function valuesIterationMethod() {
  // 获取原始对象的 target
  const target = this.raw

  // 通过 target.values 获取原始迭代器方法
  const itr = target.values()

  const wrap = (val) => typeof val === 'object' && val !== null ? reactive(getRaw(val)) : val

  // 调用 track 函数建立响应联系
  track(target, ITERATE_KEY)

  // 返回自定义的迭代器
  return {
    next() {
      // 调用原始迭代器的 next 方法获取 value 和 done
      const { value, done } = itr.next()
      return {
        // 如果 value 是值，而非键值对，所以只需要包裹 value 就可以了
        value: wrap(value),
        done
      }
    },
    /*
        添加这个方法的原因是，我们在执行 for...of 的时候，首先会调用 obj的 Symbol.iterator 方法，然后返回迭代器
        但是 obj.entries() 没有该属性，因此设置该属性 obj.entries() 返回这个对象，这个对象的迭代器工厂函数返回迭代器
    */
    [Symbol.iterator]() {
      return this
    }
  }
}


function keysIterationMethod() {
  // 获取原始对象的 target
  const target = this.raw

  // 通过 target.values 获取原始迭代器方法
  const itr = target.keys()

  const wrap = (val) => typeof val === 'object' && val !== null ? reactive(getRaw(val)) : val

  // 调用 track 函数建立响应联系
  track(target, MAP_ITERATE_KEY)

  // 返回自定义的迭代器
  return {
    next() {
      // 调用原始迭代器的 next 方法获取 value 和 done
      const { value, done } = itr.next()
      return {
        // 如果 value 是值，而非键值对，所以只需要包裹 value 就可以了
        value: wrap(value),
        done
      }
    },
    /*
        添加这个方法的原因是，我们在执行 for...of 的时候，首先会调用 obj的 Symbol.iterator 方法，然后返回迭代器
        但是 obj.entries() 没有该属性，因此设置该属性 obj.entries() 返回这个对象，这个对象的迭代器工厂函数返回迭代器
    */
    [Symbol.iterator]() {
      return this
    }
  }
}

// 抽离为独立的函数，便于复用
function iterationMethod() {
  // 获取原始对象的 target
  const target = this.raw

  // 获取原始迭代器方法
  const itr = target[Symbol.iterator]()

  const wrap = (val) => typeof val === 'object' && val !== null ? reactive(getRaw(val)) : val

  // 调用 track 函数建立响应联系
  track(target, ITERATE_KEY)

  // 返回自定义的迭代器
  return {
    next() {
      // 调用原始迭代器的 next 方法获取 value 和 done *************************************************************** 新增
      const { value, done } = itr.next()

      if (Object.prototype.toString.call(target) === '[object Map]') {
        return {
          // 如果 value 不是 undefined ,则对其进行包裹
          value: value ? [wrap(value[0]), wrap(value[1])] : value,
          done
        }
      }
      // 新增判断如果当前的对象是 Set 类型
      else if (Object.prototype.toString.call(target) === '[object Set]') {
        return {
          value: [wrap(value), wrap(value)],
          done
        }
      }
    },
    /*
        添加这个方法的原因是，我们在执行 for...of 的时候，首先会调用 obj的 Symbol.iterator 方法，然后返回迭代器
        但是 obj.entries() 没有该属性，因此设置该属性 obj.entries() 返回这个对象，这个对象的迭代器工厂函数返回迭代器
    */
    [Symbol.iterator]() {
      return this
    }
  }
}


mutableInstrumentations.get.isShllow = new WeakMap()

const arrayInstrumentations = {}

  ;['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
    // 获取原始方法
    const originMethod = Array.prototype[method]

    // 重写
    arrayInstrumentations[method] = function (...args) {

      // this 是代理对象，因为是代理对象来调用的这个方法，先在代理对象中查找，将结果存储到 res 中
      let res = originMethod.apply(this, args)

      if (res === false) {
        // res 为 false 说明没有找到，通过this.raw 拿到原始数组，再去其中查找并更新 res 值
        res = originMethod.apply(this.raw, args)
      }

      // 返回最终结果
      return res
    }
  })

//  一个标记变量，代表是否进行追踪，默认值为 true,即允许追踪
export let shouldTrack = true

  ;['push', 'pop', 'shift', 'unshift', 'splice'].forEach(method => {
    //  获取原始方法
    const originMethod = Array.prototype[method]

    // 重写  push 的时候会调用 代理对象的 set 和 get 方法,get 方法会访问 length，set 会设置当前放入元素 key 属性 , 在那个时候就会判断这个 value 的值是否为代理，如果为代理就获取原始值
    arrayInstrumentations[method] = function (...args) {
      // 在调用原始方法之前，禁止追踪
      shouldTrack = false

      // this 是代理对象，执行 push 默认方法
      let res = originMethod.apply(this, args)

      // 在调用原始方法之后,回复原来的行为,即允许追踪
      shouldTrack = true

      return res
    }
  })


export function createReactive(obj, isShllow = false, isReadOnly = false) {
  return new Proxy(obj, {
    ownKeys(target) {
      // console.log('执行了');

      // 判断当前遍历的 target 是否为数组
      //由于遍历的时候，获取的是对象所有的key，这个操作明显不与任何具体的key进行绑定，因此构造一个唯一key作为标识
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)

      return Reflect.ownKeys(target)
    },
    set(target, key, newVal, receiver) {

      // 如果是只读属性，打印警告信息并返回
      if (isReadOnly) {
        console.warn(`属性${key}是只读的`)
        return true
      }

      // 先获取旧的值
      const oldVal = target[key]

      /* 
          设置属性值，这个receiver 很关键，如果当前实例身上没有key，需要去更新原型对象上的属性值的时候，这个recevier可以控制this指向。

          正常来说设置某个代理对象（代理A）身上的属性值的时候，这个revevier就是当前这个代理对象本身(代理A)，但是如果代理对象身上没有，就需要设置原型对象上对应的这个属性值，
          这个时候，如果原型对象也是代理的（B代理），那么就会触发原型对象上的setter，但此时原型对象上的这个recevier指向的还是最外层的那个代理（代理A）
      */

      // 如果属性不存在，则说明是添加新属性，否则是设置已有属性
      const type =
        // 如果代理目标是数组，则检测被设置的索引值是否小于数组长度            
        Array.isArray(target)
          ? Number(key) < target.length ? TriggerType.SET : TriggerType.ADD
          : Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD


      // 给原始对象设置或添加新的值  如果新的值是经过 Proxy 代理的，获取原始数据 ******************************************新加
      const newRawVal = getRaw(newVal)

      const res = Reflect.set(target, key, newRawVal, receiver)

      // target === reactive.raw 说明 recevier 就是 target 的代理对象，这个设置就是为了防止设置代理对象身上的属性时，代理对象没有该属性，会隐式的去获取原型对象，修改原型对象
      // 上所对应的属性，由于原型对象是代理的，而原型收集和最外层代理对象都收集了副作用函数，这样导致触发两次副作用函数
      //  这样判断以后，就不触发原型上的副作用函数，只触发最外层对象的副作用函数，

      // 当然，如果我们直接修改的就是原型对象上的属性的时候，这个时候会触发副作用函数，因为recevier（此时指向的是原型的代理对象） === target，这样也能触发更新，这是合理的
      if (receiver.raw === target) {

        // 比较新旧值，只要不全等的时候触发相应
        if (oldVal != newVal && (oldVal === oldVal || newVal === newVal)) {  // NaN === NaN false

          // 把副作用函数从桶里面取出来执行
          // console.log('trigger', key);
          trigger(target, key, type, newVal)
        }
      }

      return res
    },
    deleteProperty(target, key) {

      // 如果是只读属性，打印警告信息并返回
      if (isReadOnly) {
        console.warn(`属性${key}是只读的`)
        return true
      }

      // 检查被操作的属性是否是对象自己的属性
      const hadKey = Object.prototype.hasOwnProperty.call(target, key)

      // 删除原始对象身上的属性
      const res = Reflect.deleteProperty(target, key)

      if (res && hadKey) {
        // 只有当被删除的属性是对象自己的属性并且成功删除的时候，才触发更新
        trigger(target, key, TriggerType.DELETE)
      }

      // 返回res
      return res
    },
    get(target, key, receiver) {
      // 在这里打印target有个特别容易忽略的点，就是
      // console.log(key, '-----getter');

      // 代理对象可以通过 raw 属性访问原始数据
      if (key === 'raw') {
        return target
      }

      if (Object.prototype.toString.call(target) === '[object Set]' || Object.prototype.toString.call(target) === '[object Map]') {
        if (key === 'size') {
          // 如果获取的是 size 属性
          // 通过指定第三个参数 receiver 为原始对象 target 从而修复问题
          track(target, ITERATE_KEY)
          return Reflect.get(target, key, target)
        }

        // ********************************************************** 新加
        if (isShllow)
          mutableInstrumentations[key].isShllow.set(receiver)

        // 返回定义在 mutableInstrumentations 对象下的方法
        return mutableInstrumentations[key]
      }

      // 如果操作的目标对象是数组，并且 Key 存储于 arrayInstumentations 上,
      // 那么返回定义在 arrayInstumentations 上的值
      if (Array.isArray(obj) && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations, key, receiver)
      }

      // 如果是不是只读的，并且 key 的类型不是 symbol ,则不进行追踪
      if (!isReadOnly && typeof key !== 'symbol') {
        track(target, key)
      }

      // 返回读取的值
      const res = Reflect.get(target, key, receiver)


      // 如果是浅响应，则直接返回原始值
      if (isShllow) {
        return res
      }


      // 如果是 ref 类型，返回 value 值 ***************************************** 新加
      if (res['__v_isRef']) {
        return res.value
      }

      //  test15 遗留问题，需要实现一个 isProxy 判断方法针对于对象
      if (typeof res === 'object' && res !== null) {

        // p:{ foo : { bar : 1} }  
        /*
            函数的执行是在fn()当中的
 
            effect(()=>{
                
                首先是获取 p.foo 的值，这个过程foo收集了依赖，即当前的副作用函数
                具体的值是 { bar: 2 } 这个原始对象, 在返回之前，进行了判断，为原始对象。
                因此，使用了Proxy进行代理，然后返回结果
 
                注意：此时还在执行fn()函数，也就是说fn的逻辑还没有执行完毕
                
                p.foo 就是 Proxy: { bar :1 }
                然后再去访问 bar 属性，由于返回的对象，是通过Proxy代理后的
                因此，也会触发 getter ，这个过程 bar 也会去收集依赖。target是 { bar : 1 }
                由于此时还是在同一层面的 fn 当中，所以 bar 所收集的依赖和 foo 所收集的依赖是相同，即同一个副作用函数 
                
                注意:虽然这里对 { bar : 1} 进行了包装，但真实的 p 还是只是最外层做了代理 ，返回的这个 reactive(res) 只是一个temp变量，用完就垃圾处理了
                它的主要作用是在访问的时候，通过 reactive 对内层对象进行一次中间处理，包装成为响应式的，然后访问这个 temp 响应对象,当访问当中属性的时候
                就会触发 getter ，这样内层对象{ bar: 1} 作为target ，bar作为 key 传给track函数，这样 weakMap 桶就有了2个target了，bar 和 foo 都对当前的
                副作用函数进行了依赖收集
                
                当我们去更新值的时候，p.foo.bar = 2 时，p.foo 同样还是得到的原始对象得 { bar :1 },因此还是进行了 reactive 的包装，当给这个包装的内层对象赋值
                的时候，会触发 setter ，调用 trigger 函数，传入此时的tagrt { bar:1 }, key bar,然后从 weaKMap 中取出来，重写执行副作用函数，清空之前的依赖关系
                然后重写建立依赖关系                 
 
                console.log( p.foo.bar )
            })
            总结: getter 用 reactive 包装
                 1.是为了让内层的对象和副作用函数建立依赖关系
                 2.是为了在赋值的时候能触发 setter，通过 trigger 去重新执行副作用函数                  
        */

        // 调用reactive 将结果包装成响应式数据并返回 ***************************************** 新加 如果代理过的对象不再代理
        return isReadOnly ? readonly(res) : reactive(getRaw(res))
      }


      // 返回res
      return res
    },
  })

}