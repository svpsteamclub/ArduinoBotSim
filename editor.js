// Initialize the code editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

require(['vs/editor/editor.main'], function() {
    // Create the editor instance
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: '// Escribe tu código Arduino aquí\nvoid setup() {\n  // Configuración inicial\n}\n\nvoid loop() {\n  // Código principal\n}',
        language: 'cpp',
        theme: 'vs',
        automaticLayout: true,
        minimap: {
            enabled: true
        },
        fontSize: 14,
        tabSize: 2,
        readOnly: false,
        scrollBeyondLastLine: false,
        wordWrap: 'on'
    });
}); 