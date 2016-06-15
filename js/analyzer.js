var Analyzer = (function() {
  function Analyzer(options) {
    var defaults = {
      simplifyTolerance: 10
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Analyzer.prototype.init = function(){
    this.memory = [];
    this.memoryLimit = this.opt.player.instruments.length;
    this.mode = 'learn'; // or: listen
    this.loadMemory(this.opt.points);
    this.loadListeners();
  };

  Analyzer.prototype.addToMemory = function(points){
    if (this.memory.length >= this.memoryLimit) return false;
    var index = this.memory.length;
    this.memory.push({
      index: index,
      distance: 0,
      weight: 0,
      count: 1,
      points: points
    });
  };

  Analyzer.prototype.distanceBetween = function(p1, p2) {
    var distances = [];
    for (var i = 0; i < p1.length; i++) {
      var min = -1;
      for (var j = 0; j < p2.length; j++) {
        var dis = this._dist(p1[i].x, p1[i].y, p2[j].x, p2[j].y);
        if (min < 0 || dis < min) {
          min = dis;
        } else if (dis == 0) {
          break;
        }
      }
      if (min >= 0) distances.push(min)
    }
    var sum = _.reduce(distances, function(memo, num){ return memo + num; }, 0);
    return distances.length ? sum / distances.length : 0;
  };

  Analyzer.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('path.create', function(e, data){
      _this.observe(data.points);
    });
  };

  Analyzer.prototype.loadMemory = function(points){
    var _this = this;

    _.each(points, function(p){
      _this.addToMemory(p);
    });
  };

  Analyzer.prototype.normalizePoints = function(points){
    var _this = this;
    var scaleTo = 100.0;
    var nPoints = [];

    // console.log('Raw points', points);

    // translate to (0,0) and scale
    var xs = _.pluck(points, 'x');
    var ys = _.pluck(points, 'y');
    var min_x = _.min(xs);
    var min_y = _.min(ys);
    var max_x = _.max(xs);
    var max_y = _.max(ys);
    var multiplier = scaleTo / _.max([max_x-min_x, max_y-min_y]);
    _.each(points, function(p){
      var n = {};
      n.x = _this._round((p.x - min_x) * multiplier, 3);
      n.y = _this._round((p.y - min_y) * multiplier, 3);
      nPoints.push(n);
    });

    // simplify the points
    nPoints = simplify(nPoints, this.opt.simplifyTolerance);

    return nPoints;
  };

  Analyzer.prototype.observe = function(points){
    $.publish('debug.message', ['Processing stroke data', false]);

    points = this.normalizePoints(points);

    // console.log('Normalized points', points);

    if (this.memory.length < this.memoryLimit) {
      this.addToMemory(points);
    }

    // if (this.memory.length >= this.memoryLimit) {
    //   var obj = _.pluck(this.memory, 'points');
    //   var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    //   window.open(data, "", "_blank");
    // }

    this.processFromMemory(points);
  };

  Analyzer.prototype.processFromMemory = function(points){
    var _this = this;
    points = _.map(points, _.clone);

    // calculate distance between each path
    this.memory = _.each(this.memory, function(node, i){
      var distance = _this.distanceBetween(node.points, points);
      node.distance = distance;
      return node;
    });

    // normalize distances to create weights
    var ds = _.pluck(this.memory, 'distance');
    // console.log('Distances', ds);
    var min_dist = _.min(ds);
    var max_dist = _.max(ds);
    this.memory = _.map(this.memory, function(node){
      if (max_dist - min_dist <= 0) node.weight = 0;
      else node.weight = (node.distance - min_dist)/(max_dist - min_dist);
      node.weight = 1 - node.weight;
      return node;
    });

    // find the closest match and tween
    var closest = _.min(this.memory, function(m){ return m.distance; });
    var tweened = this.tween(closest, points, _.max([Math.pow(0.5, closest.count), 0.1]));
    this.memory[closest.index].count += 1;
    // this.memory[closest.index].points = tweened;
    // this.memory[closest.index].points = points;

    $.publish('debug.message', ['Matched node '+(closest.index+1)+ ' with distance '+closest.distance, true]);
    $.publish('path.processed', {memory: this.memory});
  };

  Analyzer.prototype.tween = function(fromPoints, toPoints, amount){
    amount = amount || 0.5;
    var _this = this;
    var p1 = fromPoints;
    var p2 = toPoints;
    var tweened = [];

    for (var i = 0; i < p1.length; i++) {
      var min = -1;
      var min_j = -1;
      for (var j = 0; j < p2.length; j++) {
        var dis = this._dist(p1[i].x, p1[i].y, p2[j].x, p2[j].y);
        if (min < 0 || dis < min) {
          min = dis;
          min_j = j;
        } else if (dis == 0) {
          break;
        }
      }
      if (min_j >= 0) {
        var pt = _this.lerp(p1[i].x, p1[i].y, p2[min_j].x, p2[min_j].y, amount);
        tweened.push(pt);
      }
    }
    return tweened;
  };

  Analyzer.prototype._dist = function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  };

  Analyzer.prototype._lerp = function(x1, y1, x2, y2, amt) {
    var nx = x1+(x2-x1)*amt;
    var ny = y1+(y2-y1)*amt;
    return {x: nx, y: ny};
  };

  Analyzer.prototype._round = function(num, dec) {
    num = parseFloat(num);
    dec = dec || 0;
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
  };

  return Analyzer;

})();

$(function(){
  var analyzer = new Analyzer(CONFIG);
});
