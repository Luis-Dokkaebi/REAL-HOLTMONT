
// Mock Vue ref
const ref = (initialValue) => {
  return { value: initialValue };
};

// Mock Swal
global.Swal = {
  fire: (title, text, icon) => console.log(`[Swal] ${title}: ${text} (${icon})`)
};

// Mock SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.onstart = null;
    this.onend = null;
    this.onresult = null;
    this.onerror = null;
  }

  start() {
    if (this.onstart) this.onstart();
    // Simulate speech after a delay
    setTimeout(() => {
        if (this.onresult) {
            const event = {
                resultIndex: 0,
                results: [
                    [{ transcript: "prueba de dictado" }]
                ]
            };
            // Add isFinal property to the result item as per browser API structure roughly
            event.results[0].isFinal = true;
            this.onresult(event);
        }
        if (this.onend) this.onend();
    }, 100);
  }

  stop() {
    if (this.onend) this.onend();
  }
}

// Mock Window
global.window = {
  SpeechRecognition: MockSpeechRecognition,
  webkitSpeechRecognition: MockSpeechRecognition
};
global.navigator = {
    mediaDevices: {
        getUserMedia: () => Promise.resolve({ getTracks: () => [] })
    }
};

// --- CODE FROM INDEX.HTML (Simulated) ---

// Setup context
const workorderData = ref({
  comentarios: ''
});
const isRecording = ref(false);
let recognition = null; // Defined in setup scope

const toggleDictation = async () => {
  if (isRecording.value) {
      if (recognition) recognition.stop();
      isRecording.value = false;
      return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
      console.log('No supported');
      return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-MX';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
      isRecording.value = true;
      console.log('Recording started');
  };

  recognition.onend = () => {
      isRecording.value = false;
      console.log('Recording ended');
  };

  recognition.onresult = (event) => {
      let newTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
              newTranscript += event.results[i][0].transcript;
          }
      }

      if (newTranscript) {
          // This is the logic I changed
          const currentText = workorderData.value.comentarios || '';
          const needsSpace = currentText.length > 0 && !currentText.match(/\s$/);
          workorderData.value.comentarios = currentText + (needsSpace ? ' ' : '') + newTranscript;
          console.log('Updated comentarios:', workorderData.value.comentarios);
      }
  };

  recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      isRecording.value = false;
  };

  recognition.start();
};

// --- END CODE ---

// Verification Execution
async function runTest() {
    console.log("Initial comentarios:", workorderData.value.comentarios);

    // Start dictation
    await toggleDictation();

    // Wait for async simulation
    setTimeout(() => {
        if (workorderData.value.comentarios.trim() === "prueba de dictado") {
            console.log("✅ Verification SUCCESS: comentarios updated correctly.");
        } else {
            console.error("❌ Verification FAILED: expected 'prueba de dictado', got '" + workorderData.value.comentarios + "'");
            process.exit(1);
        }

        // Test Persistence (Calling toggle again should reuse variable scope, creating NEW instance but correctly)
        // Actually the logic creates `new SpeechRecognition` every time.
        // The issue was `let recognition` scope.
        // Here `let recognition` is global to the script (simulating setup scope).

        // Verify we can update again
        toggleDictation();
        setTimeout(() => {
             if (workorderData.value.comentarios.trim() === "prueba de dictado prueba de dictado") {
                console.log("✅ Verification 2 SUCCESS: Append worked.");
             } else {
                 console.log("Result 2:", workorderData.value.comentarios);
             }
        }, 200);

    }, 200);
}

runTest();
