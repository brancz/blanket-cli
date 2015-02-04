function fibo_rec(x, aggregator) {
  if (x < 3) {
    aggregator.push(1);
    aggregator.push(1);    
    return 1;
  }

  var c = fibo_rec(x-1, aggregator) + fibo_rec(x-2);

  if (aggregator) aggregator.push(c);

  return c;
}

function fibo_iter(limit) {
  var a = 1;
  var b = 1;

  var series = [a, b];

  while (true) {
    var c = a + b;
    a = b;
    b = c;

    if (b <= limit) {
      series.push(b);
      continue;
    }

    return series;
  }
}