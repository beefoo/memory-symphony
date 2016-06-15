var Player = (function() {
  function Player(options) {
    var defaults = {};
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Player.prototype.init = function(){
    // convert everything to milliseconds based on base rhythm
    this.opt.increment *= this.opt.baseRhythm;
    this.opt.minRhythm *= this.opt.baseRhythm;
    this.opt.maxRhythm *= this.opt.baseRhythm;

    this.loadInstruments(this.opt.instruments);
    this.loadListeners();
  };

  Player.prototype.animateInstrument = function(instrument){
    var start = 0.2;
    var end = instrument.sound.volume();
    var $el = instrument.el;

    // ensure end is not less than start
    end = _.max([start, end]);

    $el.css({
      background: '#ffffff',
      'box-shadow': '0 0 30px 20px #ffffff',
      opacity: end,
      transform: 'scale('+end+')'
    });

    setTimeout(function(){
      $el.css({
        background: '#fff9c9',
        'box-shadow': '0 0 30px 20px #fff9c9',
        opacity: start,
        transform: 'scale('+start+')'
      });
    }, 200);

  };

  Player.prototype.loadInstruments = function(instruments){
    var _this = this;

    this.instruments = [];
    this.instrumentsCount = instruments.length;
    this.instrumentsLoaded = 0;

    var $container = $('.player-wrapper');
    var $players = $('<div class="players">')

    _.each(instruments, function(i, index){
      // Use Howler.js as player
      var sound = new Howl({
        src: [i.file],
        onload: function(){ _this.onInstrumentLoad(i); }
      });
      // Create element
      var $el = $('<div class="player">');
      $players.append($el);
      // Add instrument
      _this.instruments.push({
        i: index,
        sound: sound,
        el: $el
      });

      // add players to the UI
      $container.append($players);
    });
  };

  Player.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('path.processed', function(e, data){
      var weights = _.pluck(data.memory, 'weight');
      console.log('Setting weights', weights);
      _this.setWeightedPlay(weights);
    });
  };

  Player.prototype.onInstrumentLoad = function(instrument){
    this.instrumentsLoaded++;

    // All instruments have been loaded
    if (this.instrumentsLoaded >= this.instrumentsCount) {
      this.setDefaultPlay();
      // this.setWeightedPlay();
      this.play();
    }
  };

  Player.prototype.onTimeUpdate = function(){
    // stop listening
    if (!this.playing) {
      return false;
    }

    // determine which instrument should play
    var _this = this;
    var now = new Date();

    _.each(this.instruments, function(i, index){
      // check if instrument should play
      if (now > i.playNext) {
        i.sound.play();
        _this.animateInstrument(i);
        _this.instruments[index].playNext = new Date(i.playNext.getTime() + i.rhythm);
      }
    });

    // continue to listen
    requestAnimationFrame(this.onTimeUpdate.bind(this));
  };

  Player.prototype.play = function(){
    if (this.playing) return true;

    this.playing = true;
    this.onTimeUpdate();
  };

  Player.prototype.setDefaultPlay = function(){
    var _this = this;
    var opt = this.opt;
    var now = new Date();
    var restRhythm = opt.baseRhythm * 0.25 * this.instruments.length;

    _.each(this.instruments, function(i, index){
      // var offset = index * opt.baseRhythm * 0.5;
      // var offset = _this._roundToNearest(_.random(0, restRhythm), opt.increment);
      var offset = _.random(0, restRhythm);

      _this.instruments[index].rhythm = restRhythm;
      _this.instruments[index].offset = offset;
      _this.instruments[index].sound.volume(0.3);

      // update dynamic properties
      _this.instruments[index].playNext = new Date(now.getTime() + offset);
    });
  };

  Player.prototype.setWeightedPlay = function(weights){
    var _this = this;
    var opt = this.opt;
    var now = new Date();

    _.each(this.instruments, function(i, index){
      var offset = 0;

      // weight not active, so instrument not active
      if (index >= weights.length) {
        _this.instruments[index].rhythm = opt.minRhythm;
        _this.instruments[index].sound.volume(0);

      // assign weight to instrument
      } else {
        var weight = weights[index];
        weight = Math.pow(weight, 3);
        // weight *= weight; // weight the weights
        //if (weight < 1) weight *= 0.8;
        var rhythm = _this._roundToNearest(weight * (opt.maxRhythm - opt.minRhythm) + opt.minRhythm, opt.increment);
        _this.instruments[index].rhythm = rhythm;
        _this.instruments[index].sound.volume(weight);
        offset = rhythm * index;
        if (weight >= 1) offset = 0;
      }

      _this.instruments[index].offset = offset;

      // update dynamic properties
      _this.instruments[index].playNext = new Date(now.getTime() + offset);
    });
  };

  Player.prototype.stop = function(){
    this.playing = false;
  };

  Player.prototype._roundToNearest = function(n, nearest){
    return 1.0 * Math.round(1.0*n/nearest) * nearest;
  };

  return Player;

})();

$(function(){
  var player = new Player(CONFIG.player);
});
