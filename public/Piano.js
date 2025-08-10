class Piano {
  constructor() {
    this.sounds = {};
    this.keyMapping = {
      // Bottom row - Octave 3 white keys
      KeyZ: "C3",
      KeyX: "D3",
      KeyC: "E3",
      KeyV: "F3",
      KeyB: "G3",
      KeyN: "A3",
      KeyM: "B3",

      // Home row - Octave 3 black keys
      KeyS: "Csharp3",
      KeyD: "Dsharp3",
      KeyG: "Fsharp3",
      KeyH: "Gsharp3",
      KeyJ: "Asharp3",

      // Top row - Octave 4 white keys
      KeyQ: "C4",
      KeyW: "D4",
      KeyE: "E4",
      KeyR: "F4",
      KeyT: "G4",
      KeyY: "A4",
      KeyU: "B4",

      // Number row - Octave 4 black keys
      Digit2: "Csharp4",
      Digit3: "Dsharp4",
      Digit5: "Fsharp4",
      Digit6: "Gsharp4",
      Digit7: "Asharp4",
    };

    this.pressedKeys = new Set();
    this.loadSounds();
  }

  loadSounds() {
    const noteFiles = [
      "C3",
      "Csharp3",
      "D3",
      "Dsharp3",
      "E3",
      "F3",
      "Fsharp3",
      "G3",
      "Gsharp3",
      "A3",
      "Asharp3",
      "B3",
      "C4",
      "Csharp4",
      "D4",
      "Dsharp4",
      "E4",
      "F4",
      "Fsharp4",
      "G4",
      "Gsharp4",
      "A4",
      "Asharp4",
      "B4",
    ];

    noteFiles.forEach((note) => {
      const audio = new Audio(`public/sounds/notes/${note}.ogg`);
      audio.preload = "auto";
      this.sounds[note] = audio;
    });
  }

  playNote(keyCode) {
    // Only work for pianist role
    if (role !== "pianist") return;

    const note = this.keyMapping[keyCode];
    if (!note || this.pressedKeys.has(keyCode)) return;

    this.pressedKeys.add(keyCode);

    const sound = this.sounds[note];
    if (sound) {
      try {
        sound.currentTime = 0; // Reset to beginning for rapid playing
        sound.play();
        console.log(`Playing note: ${note}`);
      } catch (error) {
        console.warn(`Could not play note ${note}:`, error);
      }
    }
  }

  stopNote(keyCode) {
    this.pressedKeys.delete(keyCode);
  }

  handleKeyDown(keyCode) {
    this.playNote(keyCode);
  }

  handleKeyUp(keyCode) {
    this.stopNote(keyCode);
  }

  // Visual feedback method for showing pressed keys
  getActiveNotes() {
    const activeNotes = [];
    this.pressedKeys.forEach((keyCode) => {
      const note = this.keyMapping[keyCode];
      if (note) {
        activeNotes.push(note);
      }
    });
    return activeNotes;
  }
}
