var Debug = (function() {
  function Debug(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);

    if (this.opt.debug) this.init();
  }

  Debug.prototype.init = function(){
    this.$debug = $('#debug');
    this.timeout = false;

    this.loadListeners();
  };

  Debug.prototype.hideMessage = function(){
    this.$debug.removeClass('active').html('');
  };

  Debug.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('debug.message', function(e, message, flash){
      if (_this.timeout) clearTimeout(_this.timeout);
      _this.showMessage(message);

      if (flash) {
        _this.timeout = setTimeout(function(){ _this.hideMessage(); }, 2000);
      }
    });
  };

  Debug.prototype.showMessage = function(message){
    this.$debug.html(message).addClass('active');
  };

  return Debug;

})();

$(function(){
  var debug = new Debug(CONFIG);
});
