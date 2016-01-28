var midi = require("midi"),
    output = new midi.output,
    bpm = 160,
    barDuration =  60000 / bpm * 4,
    steps = 16,
    notes = [54, 53, 55, 53, 44, 42, 48, 53, 55, 53, 42, 54, 56, 58, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 46, 53, 42, 53, 54, 53, 56, 56, 46, 42, 53, 55, 54, 54, 53, 55, 56, 53, 42, 42, 54, 55, 53, 53, 46, 42, 54, 56, 56, 55, 46, 44, 44, 56, 55, 44, 55, 57, 55, 53, 54, 53, 44, 53, 55, 55, 44, 51, 56, 49, 56, 42, 47, 53, 42, 56, 53, 55, 53, 53, 55, 56, 54, 55, 56, 42, 55, 53, 42, 55, 57, 42, 51, 55, 54, 56, 53, 55, 42, 53, 55, 53, 56, 55, 53, 55, 56, 46, 44, 53, 47, 44, 46, 44, 55, 47, 58, 42, 42, 42, 42, 42, 42, 46, 44, 56, 53, 53, 56, 54, 55, 55, 47, 58, 42, 42, 42, 42, 46, 44, 53, 54, 56, 47, 58, 58, 42, 42, 42, 42, 46, 42, 44, 44, 42, 46, 56, 53, 55, 54, 55, 56, 42, 56, 55, 53, 46, 42, 44, 53, 56, 56, 53, 56, 56, 44, 55, 56, 54, 54, 52, 53, 55, 55, 55, 52, 53, 53, 53, 54, 53, 44, 45, 53, 53, 53, 53, 45, 45, 53, 45, 45, 46, 53, 46, 53, 53, 45, 45, 44, 45, 45, 53, 44, 45, 45, 53, 45, 44, 53, 53, 53, 53, 45, 44, 54, 56, 42, 47, 46, 44, 56, 53, 55, 54, 55, 56, 47, 42, 44, 44, 47, 58, 42, 42, 42, 42, 46, 56, 53, 55, 54, 55, 56, 42, 56, 55, 53, 46, 42, 44, 53, 56, 56, 53, 56, 56, 44, 53, 55, 55, 44, 45, 44, 53, 45, 45, 46, 46, 45, 53, 45, 45, 45, 53, 53, 53, 53, 45, 45, 45, 53, 45, 45, 53, 45, 53, 45, 53, 53, 45, 53, 53, 53, 44, 54, 56, 42, 47, 46, 44, 56, 53, 55, 54, 55, 56, 47, 58, 42, 42, 46, 44, 53, 55, 53, 57, 47, 58, 46, 44, 54, 56, 55, 54, 47, 58, 58],
    interval = (barDuration / steps),
    intervalID;

try {
  output.openPort(0);
} catch (e) {
  output.openVirtualPort('');
}

function playNote(note, velocity, duration) {
  velocity = velocity + Math.floor(Math.random() * 20) - 10;

  if (velocity < 0) { velocity = 0; }
  if (velocity > 127) { velocity = 127; }

  output.sendMessage([144, note, velocity]);

  setTimeout(function() { output.sendMessage([128, note, 0]); });
}

process.addListener("SIGTERM", function() {
  clearInterval(intervalID);
  output.closePort();
});

var currentNote = 0;
intervalID = setInterval(function() {
  var note = notes[currentNote];

  currentNote++;
  if (currentNote >= notes.length) {
    currentNote = 0;
  }

  playNote(note, 100, 40);
}, interval);
