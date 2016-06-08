var Analyzer = (function() {
  function Analyzer(options) {
    var defaults = {
      correlationMin: 0.9,  // for pitch analysis
      fftsize: 2048,
      // fundamental frequency of speech can vary from 40 Hz for low-pitched male voices
      // to 600 Hz for children or high-pitched female voices
      // https://en.wikipedia.org/wiki/Pitch_detection_algorithm#Fundamental_frequency_of_speech
      frequencyMin: 40,
      frequencyMax: 600,
      minRms: 0.01,         // min signal
      phraseDurationMin: 10 // in milliseconds
    };
    this.opt = _.extend({}, defaults, options);
    this.init();
  }

  Analyzer.prototype.init = function(){
    // init audio context
    var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    this.ctx = new AudioContext();
    this.sampleRate = this.ctx.sampleRate;
    this.listenForMicrophone();
  };

  // Get pitch via autocorrelation
  // Autocorrelation algorithm snagged from: https://github.com/cwilso/PitchDetect
  Analyzer.prototype.getPitch = function(buf){
    var bufLen = buf.length,
        periods = this.periods,
        periodLen = periods.length,
        maxSamples = this.maxSamples,
        sampleRate = this.sampleRate,
        minCorrelation = this.opt.correlationMin;

    var pitch = -1;
    var best_offset = -1;
    var best_correlation = 0;
    var foundGoodCorrelation = false;
    var correlations = new Array(maxSamples);
    var lastCorrelation=1;

    for (i=0; i<periodLen; i++) {
      var offset = periods[i];
      var correlation = 0;
      for (var j=0; j<maxSamples; j++) {
        correlation += Math.abs((buf[j])-(buf[j+offset]));
      }
      correlation = 1 - (correlation/maxSamples);
      correlations[offset] = correlation;
      if ((correlation > minCorrelation) && (correlation > lastCorrelation)) {
        foundGoodCorrelation = true;
        if (correlation > best_correlation) {
          best_correlation = correlation;
          best_offset = offset;
        }

      } else if (foundGoodCorrelation) {
        var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
        pitch = sampleRate/(best_offset+(8*shift));
        break;
      }
      lastCorrelation = correlation;
    }
    if (best_correlation > 0.01) {
      // console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
      pitch = sampleRate/best_offset;
    }

    return pitch;
  };

  // Get volume via root mean square of buffer
  Analyzer.prototype.getVolume = function(arr) {
    var rms = 0,
        arrLen = arr.length;

    for (var i=0; i<arrLen; i++) {
      var val = arr[i];
      rms += val * val;
    }

    return Math.sqrt(rms/arrLen);
  };

  Analyzer.prototype.listen = function(){
    // stop listening
    if (!this.listening) {
      if (this.lastTime) this.endTime = this.lastTime;
      return false;
    }

    // keep track of time
    var now = new Date();
    var timeSince = 0;
    if (this.lastTime) timeSince = now - this.lastTime;
    else this.startTime = now;
    this.lastTime = now;

    // put frequency data into buffer
    var buffer = new Float32Array(this.bufferLen);
    this.analyzer.getFloatTimeDomainData(buffer);

    // check to see if enough signal
    var volume = this.getVolume(buffer);
    var pitch = -1;
    if (volume >= this.opt.minRms) {
      // retrieve pitch via autocorrelation
      pitch = this.getPitch(buffer);
    }

    this.render(pitch, volume);

    // continue to listen
    requestAnimationFrame(this.listen.bind(this));
    // var _this = this;
    // setTimeout(function(){_this.listen();}, 2000);
  };

  Analyzer.prototype.listenForMicrophone = function(){

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getUserMedia({audio: true},
      this.onStream.bind(this),
      this.onStreamError.bind(this));
  };

  Analyzer.prototype.listenOn = function(){
    // reset times
    this.lastTime = false;
    this.endTime = false;

    // start listening
    this.listening = true;
    this.listen();
  };

  Analyzer.prototype.listenOff = function(){
    this.listening = false;
  };

  // Setup analyzer after microphone stream is initialized
  Analyzer.prototype.onStream = function(stream){
    var input = this.ctx.createMediaStreamSource(stream);
    var analyzer = this.ctx.createAnalyser();

    analyzer.smoothingTimeConstant = 0;
    analyzer.fftSize = this.opt.fftsize;

    // Connect graph
    input.connect(analyzer);
    this.analyzer = analyzer;
    this.bufferLen = this.analyzer.frequencyBinCount; // should be 1/2 fftSize
    this.maxSamples = Math.floor(this.bufferLen/2);
    this.updatePeriods();

    // init pitch buffer
    this.pitch_buffer = [];

    // And listen
    this.listenOn();
  };

  Analyzer.prototype.onStreamError = function(e){
    console.log(e);
    alert('Error: '+e.name+' (code '+e.code+')');
  };

  Analyzer.prototype.render = function(pitch, volume){
    this.$el = this.$el || $('#debug');

    if (pitch > 0) {
      this.$el.text(pitch);
      this.$el.css('font-size', (volume*100)+'em');
    } else {
      this.$el.text('');
    }

  };

  Analyzer.prototype.updatePeriods = function(){
    // Determine min/max period
    var minPeriod = this.opt.minPeriod || 2;
    var maxPeriod = this.opt.maxPeriod || this.maxSamples;
    if(this.opt.frequencyMin) maxPeriod = Math.floor(this.sampleRate / this.opt.frequencyMin);
    if(this.opt.frequencyMax) minPeriod = Math.ceil(this.sampleRate / this.opt.frequencyMax);
    maxPeriod = Math.min(maxPeriod, this.maxSamples);
    minPeriod = Math.max(2, minPeriod);

    // init periods
    this.periods = [];
    for(var i = minPeriod; i <= maxPeriod; i++) {
      this.periods.push(i);
    }
  };

  return Analyzer;

})();

$(function(){
  var analyzer = new Analyzer();
});
