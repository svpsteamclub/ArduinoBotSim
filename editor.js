// Initialize the code editor
document.addEventListener('DOMContentLoaded', function() {
    // Create the editor instance
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: '// Escribe tu código Arduino aquí\nvoid setup() {\n  // Configuración inicial\n}\n\nvoid loop() {\n  // Código principal\n}',
        language: 'cpp',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
            enabled: true
        },
        fontSize: 14,
        tabSize: 2
    });

    // Handle compile button click
    document.getElementById('compile-btn').addEventListener('click', function() {
        const code = editor.getValue();
        // TODO: Implement compilation logic
        console.log('Compiling code:', code);
    });

    // Handle upload button click
    document.getElementById('upload-btn').addEventListener('click', function() {
        const code = editor.getValue();
        // TODO: Implement upload logic
        console.log('Uploading code:', code);
    });
}); 