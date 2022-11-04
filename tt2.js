


const a = (e) => {
    a.value(e)
}

a.value = function (c) {
    console.log(c);
}


// a(1)

function render() {
    return {
        // 在这里会有一个赋值的操作先获取this.number的值，然后赋值给a
        a: this.number,
        b(){
            return this.number
        }
    }
}


console.log(render.call({number:3}).a);
console.log(render.call({number:3}).b());


// const c = render.call({ number: 3 })
// // 返回的对象中的a 已经有值了是3
// console.log(c.a);
// // 这里的this是 return 返回的对象，这个对象没有number
// console.log(c.b());