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
    wordWrap: 'on'
  });
});

const runBtn = document.getElementById('run-avr8js');
const stopBtn = document.getElementById('stop-avr8js');
const outputDiv = document.getElementById('avr8js-output');

runBtn && runBtn.addEventListener('click', () => {
  let code = '';
  if (editorInstance) {
    code = editorInstance.getValue();
  }
  outputDiv.textContent = 'Simulación iniciada (placeholder). Código:\n' + code;
  // TODO: Integrate avr8js simulation logic here using 'code'
});

stopBtn && stopBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación detenida.';
  // TODO: Stop avr8js simulation logic here
}); 