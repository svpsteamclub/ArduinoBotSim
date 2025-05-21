// Monaco + AVR8js minimalist integration
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

let editorInstance;
require(['vs/editor/editor.main'], function() {
  editorInstance = monaco.editor.create(document.getElementById('editor'), {
    value: '// Escribe tu código Arduino aquí\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println("¡Hola mundo!");\n  delay(1000);\n}',
    language: 'cpp',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    tabSize: 2,
    readOnly: false,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 2
  });
});

const runBtn = document.getElementById('run-avr8js');
const stopBtn = document.getElementById('stop-avr8js');
const outputDiv = document.getElementById('avr8js-output');
const serialMonitor = document.getElementById('serial-monitor');

let avrRunner = null;
let stopRequested = false;

function appendSerial(text) {
  if (serialMonitor) {
    serialMonitor.textContent += text;
    serialMonitor.scrollTop = serialMonitor.scrollHeight;
  }
}

runBtn && runBtn.addEventListener('click', async () => {
  let code = '';
  if (editorInstance) {
    code = editorInstance.getValue();
  }
  outputDiv.textContent = 'Compilando...';
  if (serialMonitor) serialMonitor.textContent = '';
  stopRequested = false;
  if (avrRunner) {
    avrRunner.stop();
    avrRunner = null;
  }

  try {
    // Compile the code using avr-gcc-wasm
    const result = await AvrGccWasm.compileSketch(code);
    if (result.errors) {
      outputDiv.textContent = 'Error de compilación:\n' + result.errors;
      return;
    }
    outputDiv.textContent = 'Simulando...';
    const hex = result.hex;
    const { AVRRunner, loadHex } = window['avr8js'];
    avrRunner = new AVRRunner(loadHex(hex));
    avrRunner.usart.onByteTransmit = (value) => {
      appendSerial(String.fromCharCode(value));
    };
    // Run simulation in steps to allow stop
    function runStep() {
      if (stopRequested) return;
      avrRunner.execute(() => {
        setTimeout(runStep, 0);
      }, 50000); // Run 50,000 cycles per chunk
    }
    runStep();
  } catch (err) {
    outputDiv.textContent = 'Error de compilación o simulación:\n' + err;
  }
});

stopBtn && stopBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación detenida.';
  stopRequested = true;
  if (avrRunner) {
    avrRunner.stop();
    avrRunner = null;
  }
}); 