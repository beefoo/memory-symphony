var CONFIG = {
  player: {
    baseRhythm: 800, // integer, millisecond interval
    minRhythm: 4,     // float, base multiplier
    maxRhythm: 0.1,  // float, base multiplier
    increment: 0.2,   // float, amount to increment rhythm per step
    instruments: [
      {file: 'audio/arms1.mp3'},
      {file: 'audio/arms2.mp3'},
      {file: 'audio/baby1.mp3'},
      // {file: 'audio/breath.mp3'},
      // {file: 'audio/crybass.mp3'},
      {file: 'audio/ehvamp1.mp3'},
      {file: 'audio/ehvamp2b.mp3'},
      {file: 'audio/flourish.mp3'},
      {file: 'audio/guithi3.mp3'},
      {file: 'audio/guitlo2.mp3'},
      {file: 'audio/guitvain.mp3'},
      {file: 'audio/hornkick.mp3'},
      {file: 'audio/kick.mp3'},
      {file: 'audio/mykick2.mp3'},
      {file: 'audio/new1.mp3'},
      // {file: 'audio/new2.mp3'},
      // {file: 'audio/oohbass.mp3'},
      {file: 'audio/snare.mp3'},
      // {file: 'audio/snarechord1.mp3'},
      // {file: 'audio/snarestand.mp3'},
      {file: 'audio/stand.mp3'},
      // {file: 'audio/stringbass.mp3'},
      {file: 'audio/tearsbass.mp3'},

      // {file: 'audio/your_eyes_tom.mp3'},
      // {file: 'audio/your_eyes_tom2.mp3'},
      // {file: 'audio/your_eyes_tom3.mp3'},
      // {file: 'audio/your_eyes_tom_triangle.mp3'},
      // {file: 'audio/your_eyes_tom_triangle2.mp3'},
      // {file: 'audio/your_eyes_tom4.mp3'},
      // {file: 'audio/your_eyes_triangle.mp3'},

      // {file: 'audio/good_day_kick_01.mp3'},
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
    ]
  },

  canvas: {
    strokeWidth: 40,
    strokeMs: 2000
  }
};
