// 1
const data = 'B' + 'A' + +'A' + 'A'
console.log(data.toLowerCase());

// 2
let a = { b: { c: 1 } }
a.b === { ...a.b }
{ ...a.b } === a.b

// 3
console.log([4, '3', 2] > [4, 3, 1]);

// 4
let name = "ali"

function callme(a, ...b) {
	console.log(a)
	console.log(b)
}

callme`My name is ${name} ${name}`

// 5
console.log(9007199254740999);
console.log(NaN == NaN);
console.log(1000 === 1_000)

// 6
let i = 0
function data() {
	console.log(i++)
	setTimeout(() => data())
}
data()

// 7
const obj1 = { name: "Ali" };
const obj2 = { age: 11 };
const obj = {}
obj[obj1] = 1;
obj[obj2] = 2;
console.log(obj[obj1]);

// 8
const fun = () => {
	try {
		return 1;
	} finally {
		return 2;
	}
}
console.log(fun())

// 9
const data = {
	language: "JS",
	show: function () {
		console.log(arguments)
		console.log(this.language)
	}
}
const fn = data.show
fn()
// fn.call(data, "name", "age")

// 10
let value = {
	current: 1,
	toString: function () {
		return this.current++;
	}
};
if (value == 1 && value == 2) {
	console.log("--------------------true ")
}

// 11
function add(a) {
	return function (b) {
		return a + b;
	};
}
const add5 = add(5);
console.log(add5(3));
const add8 = add(8);
console.log(add8(3));

// 12
function doSomething(callback) {
	const data = 42;
	setTimeout(function () {
		callback(data); // 'data' is captured in a closure
	}, 1000);
}
doSomething(function (result) {
	console.log(result); // 42
});

// 13
const obj = { width: 100, height: 200 }
const { height, localHeight = height - 50 } = obj
console.log(localHeight)

// 14
var x = [ 1, 2, 3 ];

// assignment is by reference-copy, so
// y references the *same* array as x,
// not another copy of it.
var y = x;
y === x;              // true
y === [ 1, 2, 3 ];    // false
x === [ 1, 2, 3 ];    // false

// 15
console.log(0.1 + 0.2 === 0.3); //false

// 16
let result = (function() {
   return
   {
      message: "Hello, World!"
   };
})();
console.log(result);

