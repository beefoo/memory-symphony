var Canvas = (function() {
  function Canvas(options) {
    var defaults = {
      strokeWidth: 40,
      strokeMs: 2000
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Canvas.prototype.init = function(){
    this.loadCanvas();
    this.loadListeners();
  };

  Canvas.prototype.loadCanvas = function(){
    this.$canvasContainer = $('.canvas-container').first();
    this.$canvas = $('#the-canvas');
    this.canvas = this.$canvas[0];
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
  };

  Canvas.prototype.loadListeners = function(){
    var _this = this;
    var points = [];
    var ms = this.opt.strokeMs;

    this.$canvas.hammer().on("panstart", function(e){
      var now = new Date();
      var x = e.gesture.center.x;
      var y = e.gesture.center.y;
      points = [{x: x, y: y, t: now}];
    });

    this.$canvas.hammer().on("panmove", function(e){
      // remove points that are expired
      var now = new Date();
      points = _.reject(points, function(p){
        return (now - p.t) > ms;
      });

      // add new point
      var x = e.gesture.center.x;
      var y = e.gesture.center.y;
      points.push({x: x, y: y, t: now});
      _this.renderPoints(points);
    });

    this.$canvas.hammer().on("panend", function(e){
      points = [];
    });

    $(window).on("resize", function(){ _this.resizeCanvas(); })
  };

  Canvas.prototype.renderPoints = function(points){
    var now = new Date();
    var ctx = this.ctx;
    var opt = this.opt;
    var width = opt.strokeWidth;
    var half = width / 2;
    var quarter = half / 2;
    var ms = opt.strokeMs;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    _.each(points, function(p, i){
      var lerp = 1.0 - (now - p.t) / ms;
      if (lerp > 0 && lerp <= 1) {
        var x = p.x - 20;
        var y = p.y - 20;
        var radgrad = ctx.createRadialGradient(x, y, quarter*lerp, x, y, half*lerp);

        radgrad.addColorStop(0, 'rgba(255,255,255,'+lerp+')');
        radgrad.addColorStop(0.5, 'rgba(255,255,255,'+lerp/2+')');
        radgrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = radgrad;
        ctx.fillRect(x-half*lerp, y-half*lerp, width*lerp, width*lerp);
      }
    });

    return points;
  };

  Canvas.prototype.resizeCanvas = function(){
    this.canvas.width = this.$canvasContainer.width();
    this.canvas.height = this.$canvasContainer.height();
  };

  return Canvas;

})();

$(function(){
  var canvas = new Canvas();
});
