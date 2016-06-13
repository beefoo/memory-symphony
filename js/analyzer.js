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

    $.subscribe('path.create', function(e, points){
      _this.observe(points);
    });
  };

  Analyzer.prototype.normalizePoints = function(points){
    var scaleTo = 100.0;
    var nPoints = [];

    // translate to (0,0) and scale
    var min_x = _.min(points, function(p){ return p.x; });
    var min_y = _.min(points, function(p){ return p.y; });
    var max_x = _.max(points, function(p){ return p.x; });
    var max_y = _.max(points, function(p){ return p.y; });
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

    // normalize distances
    var min_dist = _.min(mem, function(m){ return m.distance; });
    var max_dist = _.max(mem, function(m){ return m.distance; });
    mem = _.map(mem, function(m){
      m.distance = (m.distance - min_dist)/(max_dist - min_dist);
      return m;
    });

    $.publish('path.processed', mem);
  };

  Analyzer.prototype._euclideanDistance = function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  };

  return Analyzer;

})();

$(function(){
  var analyzer = new Analyzer(CONFIG);
});
