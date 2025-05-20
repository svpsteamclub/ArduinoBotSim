class RobotSimulator {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.angle = 0; // in degrees
        this.speed = 0;
        this.isRunning = false;
        this.sensors = {
            front: { distance: 100 },
            left: { distance: 100 },
            right: { distance: 100 },
            line: {
                left: false,
                center: false,
                right: false
            }
        };
    }

    // Motor control methods
    moveForward(speed) {
        this.speed = Math.min(Math.max(speed, 0), 100);
        // Update position based on angle and speed
        const radians = this.angle * (Math.PI / 180);
        this.position.x += Math.cos(radians) * (this.speed / 10);
        this.position.y += Math.sin(radians) * (this.speed / 10);
        this.updateSensors();
    }

    moveBackward(speed) {
        this.speed = Math.min(Math.max(speed, 0), 100);
        // Update position based on angle and speed
        const radians = this.angle * (Math.PI / 180);
        this.position.x -= Math.cos(radians) * (this.speed / 10);
        this.position.y -= Math.sin(radians) * (this.speed / 10);
        this.updateSensors();
    }

    turn(direction, degrees) {
        if (direction === 'LEFT') {
            this.angle = (this.angle - degrees) % 360;
        } else {
            this.angle = (this.angle + degrees) % 360;
        }
        this.updateSensors();
    }

    stop() {
        this.speed = 0;
    }

    // Sensor methods
    getDistance(sensor) {
        return this.sensors[sensor.toLowerCase()].distance;
    }

    getLineSensor(sensor) {
        return this.sensors.line[sensor.toLowerCase()];
    }

    // Update sensor readings based on position and environment
    updateSensors() {
        // Simulate sensor readings based on position
        // This is a simple simulation - you can make it more complex
        this.sensors.front.distance = Math.random() * 100;
        this.sensors.left.distance = Math.random() * 100;
        this.sensors.right.distance = Math.random() * 100;
        
        // Simulate line sensors
        this.sensors.line.left = Math.random() > 0.7;
        this.sensors.line.center = Math.random() > 0.7;
        this.sensors.line.right = Math.random() > 0.7;
    }

    // Reset robot state
    reset() {
        this.position = { x: 0, y: 0 };
        this.angle = 0;
        this.speed = 0;
        this.updateSensors();
    }
}

// Create a global instance of the simulator
window.robotSimulator = new RobotSimulator(); 