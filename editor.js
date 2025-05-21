// Monaco + AVR8js minimalist integration
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

let editorInstance;
require(['vs/editor/editor.main'], function() {
  editorInstance = monaco.editor.create(document.getElementById('editor'), {
    value: '// Escribe tu código Arduino aquí\nvoid setup() {\n  // Configuración inicial\n}\n\nvoid loop() {\n  // Código principal\n}',
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

function appendSerial(text) {
  if (serialMonitor) {
    serialMonitor.textContent += text + '\n';
    serialMonitor.scrollTop = serialMonitor.scrollHeight;
  }
}

runBtn && runBtn.addEventListener('click', () => {
  let code = '';
  if (editorInstance) {
    code = editorInstance.getValue();
  }
  outputDiv.textContent = 'Simulación iniciada (placeholder). Código:\n' + code;
  if (serialMonitor) serialMonitor.textContent = '';
  // Example: appendSerial('Serial output will appear here...');
  // TODO: Integrate avr8js simulation logic here using 'code' and appendSerial for serial output
});

stopBtn && stopBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación detenida.';
  // TODO: Stop avr8js simulation logic here
}); 