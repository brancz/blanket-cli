console.log("test");
var condition = true;
if(condition) {
    console.log("will be executed");
} else {
    console.log("will not be executed");
}

setTimeout(function() {
    console.log("execute this after a while");
}, 5000);
