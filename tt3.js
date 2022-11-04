
function test2() {
    console.log(1);
    return 2
}


function test() {
    return {
        arr: [test2()]
    }
}


// test()


function test3() {
    let a = 3
    return a++, a
}

let a = test3()
console.log(a);