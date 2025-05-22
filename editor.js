// Minimalist JS Arduino-like simulation in Monaco
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

let editorInstance;
require(['vs/editor/editor.main'], function() {
  editorInstance = monaco.editor.create(document.getElementById('editor'), {
    value: `// Escribe tu código Arduino estilo JS\nfunction setup() {\n  Serial.begin(9600);\n}\n\nasync function loop() {\n  Serial.println('¡Hola mundo!');\n  await delay(1000);\n}`,
    language: 'javascript',
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

let stopRequested = false;

function appendSerial(text) {
  if (serialMonitor) {
    serialMonitor.textContent += text;
    serialMonitor.scrollTop = serialMonitor.scrollHeight;
  }
}

// Minimalist Arduino API shim
const arduinoAPI = {
  pinMode: (pin, mode) => {},
  digitalRead: (pin) => 0,
  analogWrite: (pin, value) => {},
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  Serial: {
    begin: (baud) => appendSerial(`Serial.begin(${baud})\n`),
    print: (msg) => appendSerial(String(msg)),
    println: (msg = "") => appendSerial(String(msg) + '\n'),
  },
};

runBtn && runBtn.addEventListener('click', async () => {
  let code = '';
  if (editorInstance) {
    code = editorInstance.getValue();
  }
  outputDiv.textContent = 'Simulación iniciada (JS Arduino).';
  if (serialMonitor) serialMonitor.textContent = '';
  stopRequested = false;

  // Prepare the user code
  let setup = () => {};
  let loop = async () => {};
  try {
    // eslint-disable-next-line no-new-func
    const userScript = new Function('pinMode', 'digitalRead', 'analogWrite', 'delay', 'Serial', code + '\nreturn { setup, loop };');
    const result = userScript(
      arduinoAPI.pinMode,
      arduinoAPI.digitalRead,
      arduinoAPI.analogWrite,
      arduinoAPI.delay,
      arduinoAPI.Serial
    );
    setup = typeof result.setup === 'function' ? result.setup : setup;
    loop = typeof result.loop === 'function' ? result.loop : loop;
  } catch (e) {
    outputDiv.textContent = 'Error en el código: ' + e.message;
    return;
  }

  try {
    setup();
    while (!stopRequested) {
      await loop();
    }
  } catch (e) {
    outputDiv.textContent = 'Error en la simulación: ' + e.message;
  }
});

stopBtn && stopBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación detenida.';
  stopRequested = true;
}); 