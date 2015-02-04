document.addEventListener("DOMContentLoaded", function(event) { 
  var btn = document.querySelector("#btn");

  btn.addEventListener("click", function () {
    if (Math.random() < 0.5) {
      var aggregator = [];
      fibo_rec(5, aggregator)
      console.log(aggregator);
      return;
    }
    
    console.log(fibo_iter(5));
  });
});