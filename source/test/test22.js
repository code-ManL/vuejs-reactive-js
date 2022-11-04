import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'


// 数据污染
const p2 = reactive({ bar: 2 });
const arr = [1, 2, 3];

const p1 = reactive(arr);

p1.push(p2);

console.log(arr);
console.log(p1);
console.log(p1[3] === p2);
