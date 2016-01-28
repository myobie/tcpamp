var isNumber = require("isnumber"),
    midi = require("midi"),
    output = new midi.output,
    bpm = 160,
    barDuration =  60000 / bpm * 4,
    steps = 16,
    notes = [],
    interval = (barDuration / steps),
    intervalID,
    redis = require("redis"),
    client = redis.createClient(),
    currentNote = 0,
    hasPlayed = false;

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

function cleanup() {
  client.end();
  clearInterval(intervalID);
  output.closePort();
}

process.addListener("SIGTERM", cleanup);

client.on("message", function(channel, message) {
  console.log("Received message", message)
  try {
    var info = JSON.parse(message);

    if (Array.isArray(info)) {
      notes.push.apply(notes, info)
    } else {
      notes.push(info)
    }
  } catch(e) {
    console.error("problem with message from redis", e);
  }
});

client.subscribe("notes");

console.log("starting interval for notes")
intervalID = setInterval(function() {
  var note = notes[currentNote];

  if (!note) {
    if (hasPlayed) {
      cleanup();
      process.exit();
    } else {
      return // no notes in the queue yet
    }
  }

  currentNote++;

  playNote(note, 100, 60);
  hasPlayed = true
}, interval);
