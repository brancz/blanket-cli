if (typeof window._$blanket === 'undefined') window._$blanket = {};
if (typeof window._$blanket['script.js'] === 'undefined'){window._$blanket['script.js']=[];
window._$blanket['script.js'].source=['console.log("test");',
'var condition = true;',
'if(condition) {',
'    console.log("will be executed");',
'} else {',
'    console.log("will not be executed");',
'}',
'',
'setTimeout(function() {',
'    console.log("execute this after a while");',
'}, 5000);',
''];
window._$blanket['script.js'][1]=0;
window._$blanket['script.js'][2]=0;
window._$blanket['script.js'][3]=0;
window._$blanket['script.js'][4]=0;
window._$blanket['script.js'][6]=0;
window._$blanket['script.js'][9]=0;
window._$blanket['script.js'][10]=0;
}window._$blanket['script.js'][1]++;
console.log("test");
window._$blanket['script.js'][2]++;
var condition = true;
window._$blanket['script.js'][3]++;
if(condition) {
    window._$blanket['script.js'][4]++;
console.log("will be executed");
} else {
    window._$blanket['script.js'][6]++;
console.log("will not be executed");
}

window._$blanket['script.js'][9]++;
setTimeout(function() {
    window._$blanket['script.js'][10]++;
console.log("execute this after a while");
}, 5000);
