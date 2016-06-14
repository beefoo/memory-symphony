var Canvas = (function() {
  function Canvas(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Canvas.prototype.init = function(){
    this.loadCanvas();
    this.loadListeners();
  };

  Canvas.prototype.burst = function(points){
    var $canvas = this.$canvas.clone();
    var ctx = $canvas[0].getContext('2d');

    // render it
    this.renderPoints(points, this.$canvas.offset(), ctx, [255, 228, 94]);

    // add it
    $canvas.addClass('burst');
    this.$canvasContainer.append($canvas);

    // burst it
    var transition = $canvas.css('transition');
    var width = $canvas.width();
    $canvas.css({
      opacity: 0,
      transform: 'scale(1.8) translate('+width+'px, '+(width/10)+'px)'
    });

    // remove it
    setTimeout(function(){
      $canvas.remove();
    }, 5000);
  };

  Canvas.prototype.clearCanvas = function(ctx){
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  Canvas.prototype.lerpPoints = function(points){
    var now = new Date();
    var ms = this.opt.strokeMs;

    var validPoints = [];
    _.each(points, function(p, i){
      var lerp = 1.0 - (now - p.t) / ms;
      if (lerp > 0 && lerp <= 1) {
        p.z = lerp;
        validPoints.push(p);
      }
    });

    return validPoints;
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
    var offset = this.$canvas.offset()

    this.$canvas.hammer().on("panstart", function(e){
      var now = new Date();
      var x = e.gesture.center.x;
      var y = e.gesture.center.y;
      offset = $(this).offset();
      points = [{x: x, y: y, z: 1, t: now}];
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
      points.push({x: x, y: y, z: 1, t: now});
      points = _this.lerpPoints(points);
      _this.renderPoints(points, offset);
    });

    this.$canvas.hammer().on("panend", function(e){
      _this.onStrokeEnd(points);
      points = [];
    });

    $(window).on("resize", function(){ _this.resizeCanvas(); })
  };

  Canvas.prototype.onStrokeEnd = function(points){
    // clear canvas
    this.clearCanvas(this.ctx);

    // add a burst effect
    this.burst(points);

    // publish points
    $.publish('path.create', points);
  };

  Canvas.prototype.renderPoints = function(points, offset, ctx, color){
    offset = offset || this.$canvas.offset();
    ctx = ctx || this.ctx;
    color = color || [255, 255, 255];
    color = color.join(',');

    var width = this.opt.strokeWidth;
    var half = width / 2;
    var quarter = half / 2;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    _.each(points, function(p, i){
      var x = p.x - offset.left;
      var y = p.y - offset.top;
      var z = p.z;
      var radgrad = ctx.createRadialGradient(x, y, quarter*z, x, y, half*z);

      radgrad.addColorStop(0, 'rgba('+color+','+z+')');
      radgrad.addColorStop(0.5, 'rgba('+color+','+z/2+')');
      radgrad.addColorStop(1, 'rgba('+color+',0)');
      ctx.fillStyle = radgrad;
      ctx.fillRect(x-half*z, y-half*z, width*z, width*z);
    });
  };

  Canvas.prototype.resizeCanvas = function(){
    this.canvas.width = this.$canvasContainer.width();
    this.canvas.height = this.$canvasContainer.height();
  };

  return Canvas;

})();

$(function(){
  var canvas = new Canvas(CONFIG.canvas);
});
