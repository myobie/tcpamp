var midi = require("midi"),
    output = new midi.output,
    bpm = 160,
    barDuration =  60000 / bpm * 4,
    steps = 16,
    notes = [65, 67, 68, 69, 77, 78, 76, 90],
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
