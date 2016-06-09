var Player = (function() {
  function Player(options) {
    var defaults = {
      baseRhythm: 800, // integer, millisecond interval
      minRhythm: 4,     // float, base multiplier
      maxRhythm: 0.1,  // float, base multiplier
      increment: 0.2,   // float, amount to increment rhythm per step
      instruments: [
        {file: 'audio/good_day_kick_01.mp3'},
        {file: 'audio/your_eyes_tom.mp3'},
        {file: 'audio/your_eyes_tom2.mp3'},
        {file: 'audio/your_eyes_tom3.mp3'},
        // {file: 'audio/good_day_snare_01.mp3'},
        // {file: 'audio/american_pie_snare.mp3'},
        // {file: 'audio/american_pie_tom1.mp3'},
        // {file: 'audio/american_pie_tom2.mp3'},
        // {file: 'audio/diamonds_cymbal.mp3'},
        // {file: 'audio/once_in_a_lifetime_cymbal.mp3'},
        // {file: 'audio/once_in_a_lifetime_kick.mp3'},
        // {file: 'audio/reaper_cymbal.mp3'},
        // {file: 'audio/reaper_kick.mp3'},
        // {file: 'audio/space_oddity_snare.mp3'},
        {file: 'audio/your_eyes_tom_triangle.mp3'},
        {file: 'audio/your_eyes_tom_triangle2.mp3'},
        {file: 'audio/your_eyes_tom4.mp3'},
        {file: 'audio/your_eyes_triangle.mp3'},
      ]
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Player.prototype.init = function(){
    // convert everything to milliseconds based on base rhythm
    this.opt.increment *= this.opt.baseRhythm;
    this.opt.minRhythm *= this.opt.baseRhythm;
    this.opt.maxRhythm *= this.opt.baseRhythm;

    this.loadInstruments(this.opt.instruments);
  };

  Player.prototype.animateInstrument = function(instrument){
    var start = 0.2;
    var end = instrument.sound.volume();
    var $el = instrument.el;

    console.log(end)

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

  Player.prototype.onInstrumentLoad = function(instrument){
    this.instrumentsLoaded++;

    // All instruments have been loaded
    if (this.instrumentsLoaded >= this.instrumentsCount) {
      // this.setDefaultPlay();
      this.setWeightedPlay();
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

    _.each(this.instruments, function(i, index){
      var offset = index * opt.increment;

      _this.instruments[index].rhythm = opt.baseRhythm;
      if (!i.offset) _this.instruments[index].offset = offset;
      _this.instruments[index].sound.volume(0.5);

      // update dynamic properties
      if (!i.playNext) _this.instruments[index].playNext = new Date(now.getTime() + offset);
    });
  };

  Player.prototype.setWeightedPlay = function(){
    var _this = this;
    var opt = this.opt;
    var now = new Date();

    // temporarily hand-coded weights
    var count = this.instrumentsCount;
    var step = 1.0 / count;
    var weights = [];
    _(count).times(function(n){
      weights.push(n*step);
    });
    var rand = _.random(0, count-1);
    weights = [].concat(weights.slice(rand), weights.slice(0, rand));

    _.each(this.instruments, function(i, index){
      var offset = index * opt.increment;

      _this.instruments[index].rhythm = _this._roundToNearest(weights[index] * (opt.maxRhythm - opt.minRhythm) + opt.minRhythm, opt.increment);
      if (!i.offset) _this.instruments[index].offset = offset;
      _this.instruments[index].sound.volume(weights[index]);

      // update dynamic properties
      if (!i.playNext) _this.instruments[index].playNext = new Date(now.getTime() + offset);
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
  var player = new Player();
});
