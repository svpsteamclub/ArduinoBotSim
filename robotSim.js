// Minimalist visual simulator for Arduino line follower robot
(function() {
  // --- DOM Elements ---
  const canvas = document.getElementById('simulator-canvas');
  const serialMonitor = document.getElementById('sim-serial-monitor');
  const startBtn = document.getElementById('sim-start');
  const stopBtn = document.getElementById('sim-stop');
  const resetBtn = document.getElementById('sim-reset');

  if (!canvas || !serialMonitor) return;
  const ctx = canvas.getContext('2d');

  // --- Robot and Track State ---
  let simulationRunning = false;
  let animationFrameId;
  let userSetup = () => {};
  let userLoop = async () => {};
  let stopRequested = false;
  let userCode = '';

  // Robot properties
  const robot = {
    x: 300, y: 340, width: 30, height: 40, angle: -Math.PI/2, color: '#2a6ee2',
    wheelBase: 28, speedL: 0, speedR: 0, maxSpeedSim: 2,
    sensors: [
      { x: -12, y: -18, value: 1, color: 'gray' },
      { x: 0,   y: -20, value: 1, color: 'gray' },
      { x: 12,  y: -18, value: 1, color: 'gray' }
    ],
    sensorRadius: 3
  };

  // --- Track drawing (simple loop) ---
  function drawTrack() {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.lineTo(540, 60);
    ctx.lineTo(540, 340);
    ctx.lineTo(60, 340);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // --- Sensor logic (simple: black line = 0, white = 1) ---
  function updateSensors() {
    const cosA = Math.cos(robot.angle);
    const sinA = Math.sin(robot.angle);
    robot.sensors.forEach((sensor, i) => {
      const wx = robot.x + (sensor.x * cosA - sensor.y * sinA);
      const wy = robot.y + (sensor.x * sinA + sensor.y * cosA);
      // Check if on black line (approximate)
      const onLine = (wx > 60 && wx < 540 && (Math.abs(wy - 60) < 5 || Math.abs(wy - 340) < 5)) ||
                     (wy > 60 && wy < 340 && (Math.abs(wx - 60) < 5 || Math.abs(wx - 540) < 5));
      sensor.value = onLine ? 0 : 1;
      sensor.color = onLine ? 'red' : 'lime';
    });
  }

  // --- Arduino API for user code ---
  const arduinoAPI = {
    pinMode: (pin, mode) => {},
    digitalRead: (pin) => {
      if (pin === 2) return robot.sensors[0].value;
      if (pin === 3) return robot.sensors[1].value;
      if (pin === 4) return robot.sensors[2].value;
      return 1;
    },
    analogWrite: (pin, value) => {
      value = Math.max(0, Math.min(255, value));
      if (pin === 5) robot.speedL = value;
      if (pin === 6) robot.speedR = value;
    },
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    Serial: {
      begin: (baud) => appendSerial(`Serial.begin(${baud})\n`),
      print: (msg) => appendSerial(String(msg)),
      println: (msg = "") => appendSerial(String(msg) + '\n'),
    },
  };

  function appendSerial(text) {
    serialMonitor.textContent += text;
    serialMonitor.scrollTop = serialMonitor.scrollHeight;
  }

  // --- Robot physics ---
  function updateRobot(dt) {
    const vL = (robot.speedL / 255) * robot.maxSpeedSim;
    const vR = (robot.speedR / 255) * robot.maxSpeedSim;
    const V = (vL + vR) / 2;
    const omega = (vR - vL) / robot.wheelBase;
    const moveAngle = robot.angle - Math.PI/2;
    robot.x += V * Math.cos(moveAngle) * dt * 60;
    robot.y += V * Math.sin(moveAngle) * dt * 60;
    robot.angle += omega * dt * 60;
  }

  function drawRobot() {
    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.angle);
    ctx.fillStyle = robot.color;
    ctx.fillRect(-robot.width/2, -robot.height/2, robot.width, robot.height);
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(0, -robot.height/2 - 2);
    ctx.lineTo(-5, -robot.height/2 + 5);
    ctx.lineTo(5, -robot.height/2 + 5);
    ctx.closePath();
    ctx.fill();
    robot.sensors.forEach(sensor => {
      ctx.fillStyle = sensor.color;
      ctx.beginPath();
      ctx.arc(sensor.x, sensor.y, robot.sensorRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack();
    drawRobot();
  }

  function resetRobot() {
    robot.x = 300; robot.y = 340; robot.angle = -Math.PI/2;
    robot.speedL = 0; robot.speedR = 0;
    robot.sensors.forEach(s => s.value = 1);
  }

  function resetSim() {
    stopSim();
    resetRobot();
    serialMonitor.textContent = '';
    draw();
  }

  function stopSim() {
    simulationRunning = false;
    stopRequested = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  }

  async function simLoop() {
    if (!simulationRunning) return;
    const dt = 1/60;
    try {
      await userLoop();
    } catch (e) {
      appendSerial('Error en loop(): ' + e.message + '\n');
      stopSim();
      return;
    }
    updateSensors();
    updateRobot(dt);
    draw();
    animationFrameId = requestAnimationFrame(simLoop);
  }

  function startSim() {
    if (simulationRunning) return;
    simulationRunning = true;
    stopRequested = false;
    animationFrameId = requestAnimationFrame(simLoop);
  }

  // --- Public API: Ejecutar código JS estilo Arduino ---
  window.runRobotSimulation = function(code) {
    stopSim();
    resetSim();
    userCode = code;
    // Preparar funciones de usuario
    try {
      const userScript = new Function('pinMode', 'digitalRead', 'analogWrite', 'delay', 'Serial', code + '\nreturn { setup, loop };');
      const result = userScript(
        arduinoAPI.pinMode,
        arduinoAPI.digitalRead,
        arduinoAPI.analogWrite,
        arduinoAPI.delay,
        arduinoAPI.Serial
      );
      userSetup = typeof result.setup === 'function' ? result.setup : (()=>{});
      userLoop = typeof result.loop === 'function' ? result.loop : (async()=>{});
    } catch (e) {
      appendSerial('Error en el código: ' + e.message + '\n');
      return;
    }
    try {
      userSetup();
    } catch (e) {
      appendSerial('Error en setup(): ' + e.message + '\n');
      return;
    }
    startSim();
  };

  // --- Botones de control ---
  if (startBtn) startBtn.onclick = () => { if (userCode) window.runRobotSimulation(userCode); };
  if (stopBtn) stopBtn.onclick = stopSim;
  if (resetBtn) resetBtn.onclick = resetSim;

  // Inicializar
  resetSim();
})(); 