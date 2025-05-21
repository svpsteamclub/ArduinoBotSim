// Minimalist AVR8js code editor setup
// (Assumes avr8js and related logic will be loaded elsewhere)

const codeTextarea = document.getElementById('avr8js-code');
const runBtn = document.getElementById('run-avr8js');
const stopBtn = document.getElementById('stop-avr8js');
const outputDiv = document.getElementById('avr8js-output');

if (codeTextarea) {
  codeTextarea.value = `// Escribe tu código Arduino aquí\nvoid setup() {\n  // Configuración inicial\n}\n\nvoid loop() {\n  // Código principal\n}`;
}

runBtn && runBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación iniciada (placeholder).';
  // TODO: Integrate avr8js simulation logic here
});

stopBtn && stopBtn.addEventListener('click', () => {
  outputDiv.textContent = 'Simulación detenida.';
  // TODO: Stop avr8js simulation logic here
}); 