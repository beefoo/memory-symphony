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
    this.loadListeners();
  };

  Analyzer.prototype.addToMemory = function(points){
    if (this.memory.length >= this.memoryLimit) return false;
    this.memory.push({points: points});
  };

  Analyzer.prototype.distanceBetween = function(p1, p2) {
    var h_max = Number.MIN_VALUE, h_min, dis;
    for (var i = 0; i < p1.length; i++) {
      h_min = Number.MAX_VALUE;
      for (var j = 0; j < p2.length; j++) {
        dis = this._euclideanDistance(p1[i].x, p1[i].y, p2[j].x, p2[j].y);
        if (dis < h_min) {
             h_min = dis;
        } else if (dis == 0) {
          break;
        }
      }
      if (h_min > h_max) {
        h_max = h_min;
      }
    }
    return h_max;
  };

  Analyzer.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('path.create', function(e, data){
      _this.observe(data.points);
    });
  };

  Analyzer.prototype.normalizePoints = function(points){
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
      n.x = (p.x - min_x) * multiplier;
      n.y = (p.y - min_y) * multiplier;
      nPoints.push(n);
    });

    // simplify the points
    nPoints = simplify(nPoints, this.opt.simplifyTolerance);

    return nPoints;
  };

  Analyzer.prototype.observe = function(points){
    points = this.normalizePoints(points);

    // console.log('Normalized points', points);

    if (this.memory.length < this.memoryLimit - 1) {
      this.addToMemory(points);
    }

    this.processFromMemory(points);
  };

  Analyzer.prototype.processFromMemory = function(points){
    var _this = this;
    var mem = this.memory;

    // calculate distance between each path
    _.each(mem, function(node, i){
      var distance = _this.distanceBetween(node.points, points);
      mem[i].distance = distance;
    });

    // normalize distances to create weights
    var ds = _.pluck(mem, 'distance');
    var min_dist = _.min(ds);
    var max_dist = _.max(ds);
    mem = _.map(mem, function(m){
      if (max_dist - min_dist <= 0) m.weight = 0;
      else m.weight = (m.distance - min_dist)/(max_dist - min_dist);
      m.weight = 1 - m.weight;
      return m;
    });

    $.publish('path.processed', {memory: mem});
  };

  Analyzer.prototype._euclideanDistance = function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  };

  return Analyzer;

})();

$(function(){
  var analyzer = new Analyzer(CONFIG);
});
