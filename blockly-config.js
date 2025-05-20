document.addEventListener('DOMContentLoaded', () => {
    // Initialize Blockly workspace
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: {
            kind: 'categoryToolbox',
            contents: [
                {
                    kind: 'category',
                    name: 'Control',
                    colour: 120,
                    contents: [
                        {
                            kind: 'block',
                            type: 'controls_if'
                        },
                        {
                            kind: 'block',
                            type: 'controls_repeat_ext'
                        },
                        {
                            kind: 'block',
                            type: 'controls_whileUntil'
                        },
                        {
                            kind: 'block',
                            type: 'controls_wait'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Motores',
                    colour: 210,
                    contents: [
                        {
                            kind: 'block',
                            type: 'motor_forward'
                        },
                        {
                            kind: 'block',
                            type: 'motor_backward'
                        },
                        {
                            kind: 'block',
                            type: 'motor_turn'
                        },
                        {
                            kind: 'block',
                            type: 'motor_stop'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Sensores',
                    colour: 160,
                    contents: [
                        {
                            kind: 'block',
                            type: 'sensor_distance'
                        },
                        {
                            kind: 'block',
                            type: 'sensor_line'
                        }
                    ]
                },
                {
                    kind: 'category',
                    name: 'Variables',
                    colour: 330,
                    custom: 'VARIABLE'
                }
            ]
        },
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true
    });

    // Define custom blocks
    Blockly.Blocks['controls_wait'] = {
        init: function() {
            this.appendValueInput("TIME")
                .setCheck("Number")
                .appendField("Esperar");
            this.appendDummyInput()
                .appendField("milisegundos");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(120);
            this.setTooltip("Espera el tiempo especificado");
        }
    };

    Blockly.Blocks['motor_forward'] = {
        init: function() {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("Mover adelante");
            this.appendDummyInput()
                .appendField("velocidad");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
            this.setTooltip("Mueve el robot hacia adelante");
        }
    };

    Blockly.Blocks['motor_backward'] = {
        init: function() {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("Mover atrás");
            this.appendDummyInput()
                .appendField("velocidad");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
            this.setTooltip("Mueve el robot hacia atrás");
        }
    };

    Blockly.Blocks['motor_turn'] = {
        init: function() {
            this.appendValueInput("DEGREES")
                .setCheck("Number")
                .appendField("Girar");
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown([
                    ["izquierda", "LEFT"],
                    ["derecha", "RIGHT"]
                ]), "DIRECTION");
            this.appendDummyInput()
                .appendField("grados");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
            this.setTooltip("Gira el robot");
        }
    };

    Blockly.Blocks['motor_stop'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Detener motores");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(210);
            this.setTooltip("Detiene los motores del robot");
        }
    };

    Blockly.Blocks['sensor_distance'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Distancia del sensor")
                .appendField(new Blockly.FieldDropdown([
                    ["frontal", "FRONT"],
                    ["izquierdo", "LEFT"],
                    ["derecho", "RIGHT"]
                ]), "SENSOR");
            this.setOutput(true, "Number");
            this.setColour(160);
            this.setTooltip("Obtiene la distancia del sensor seleccionado");
        }
    };

    Blockly.Blocks['sensor_line'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("Sensor de línea")
                .appendField(new Blockly.FieldDropdown([
                    ["izquierdo", "LEFT"],
                    ["central", "CENTER"],
                    ["derecho", "RIGHT"]
                ]), "SENSOR");
            this.setOutput(true, "Boolean");
            this.setColour(160);
            this.setTooltip("Obtiene el estado del sensor de línea");
        }
    };

    // Define JavaScript generators for custom blocks
    Blockly.JavaScript['controls_wait'] = function(block) {
        const time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `await new Promise(resolve => setTimeout(resolve, ${time}));\n`;
    };

    Blockly.JavaScript['motor_forward'] = function(block) {
        const speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `robotSimulator.moveForward(${speed});\n`;
    };

    Blockly.JavaScript['motor_backward'] = function(block) {
        const speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        return `robotSimulator.moveBackward(${speed});\n`;
    };

    Blockly.JavaScript['motor_turn'] = function(block) {
        const degrees = Blockly.JavaScript.valueToCode(block, 'DEGREES', Blockly.JavaScript.ORDER_ATOMIC) || '0';
        const direction = block.getFieldValue('DIRECTION');
        return `robotSimulator.turn('${direction}', ${degrees});\n`;
    };

    Blockly.JavaScript['motor_stop'] = function(block) {
        return `robotSimulator.stop();\n`;
    };

    Blockly.JavaScript['sensor_distance'] = function(block) {
        const sensor = block.getFieldValue('SENSOR');
        return [`robotSimulator.getDistance('${sensor}')`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    Blockly.JavaScript['sensor_line'] = function(block) {
        const sensor = block.getFieldValue('SENSOR');
        return [`robotSimulator.getLineSensor('${sensor}')`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Generate code when workspace changes
    workspace.addChangeListener(() => {
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        document.getElementById('generated-code').textContent = code;
    });

    // Button handlers
    document.getElementById('run-code').addEventListener('click', async () => {
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        try {
            // Reset robot state
            robotSimulator.reset();
            
            // Create and execute the code
            const executeCode = new Function('robotSimulator', `
                return (async () => {
                    try {
                        ${code}
                    } catch (error) {
                        console.error('Error executing code:', error);
                        alert('Error al ejecutar el código: ' + error.message);
                    }
                })();
            `);
            
            await executeCode(robotSimulator);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al ejecutar el código: ' + error.message);
        }
    });

    document.getElementById('save-code').addEventListener('click', () => {
        const xml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToText(xml);
        localStorage.setItem('savedCode', xmlText);
        alert('Código guardado');
    });

    document.getElementById('load-code').addEventListener('click', () => {
        const xmlText = localStorage.getItem('savedCode');
        if (xmlText) {
            const xml = Blockly.Xml.textToDom(xmlText);
            workspace.clear();
            Blockly.Xml.domToWorkspace(xml, workspace);
            alert('Código cargado');
        } else {
            alert('No hay código guardado');
        }
    });

    document.getElementById('clear-workspace').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres limpiar el área de trabajo?')) {
            workspace.clear();
        }
    });
}); 