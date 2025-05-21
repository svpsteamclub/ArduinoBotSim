/**
 * Configuration settings for the Arduino Robot Simulator
 * @module config
 */

// Track editor settings
export const TRACK_PART_SIZE_PX = 350;
export const PIXELS_PER_METER = 1000;

// Available track parts with their connections
export const AVAILABLE_TRACK_PARTS = [
    {
        name: 'C0.00-BCS',
        file: 'C0.00-BCS.png',
        description: 'Vacia',
        connections: { N: false, E: false, S: fasle, W: false }
    },
    {
        name: 'C1.01-RCS',
        file: 'C1.01-RCS.png',
        description: 'Recta',
        connections: { N: true, E: fasle, S: true, W: false }
    },
    {
        name: 'C1.02-MCS',
        file: 'C1.02-MCS.png',
        description: 'Middle Cross Section 1',
        connections: { N: true, E: true, S: true, W: true }
    },
    {
        name: 'C1.03-CCS',
        file: 'C1.03-CCS.png',
        description: 'Center Cross Section',
        connections: { N: true, E: true, S: true, W: true }
    },
    {
        name: 'C1.04-MCS',
        file: 'C1.04-MCS.png',
        description: 'Middle Cross Section 2',
        connections: { N: false, E: true, S: true, W: false }
    },
    {
        name: 'C1.05-RCS',
        file: 'C1.05-RCS.png',
        description: 'Right Cross Section 2',
        connections: { N: true, E: true, S: true, W: false }
    },
    {
        name: 'C1.06-MCS',
        file: 'C1.06-MCS.png',
        description: 'Middle Cross Section 3',
        connections: { N: true, E: true, S: true, W: true }
    },
    {
        name: 'C2.07-RCI',
        file: 'C2.07-RCI.png',
        description: 'Right Curve In',
        connections: { N: false, E: true, S: true, W: false }
    },
    {
        name: 'C2.08-MCS',
        file: 'C2.08-MCS.png',
        description: 'Middle Cross Section 4',
        connections: { N: true, E: true, S: true, W: true }
    }
];

// Default robot configuration
export const DEFAULT_ROBOT_CONFIG = {
    width: 0.16, // meters
    length: 0.34, // meters
    sensorSpread: 0.016, // meters
    sensorOffset: 0.14, // meters
    sensorDiameter: 0.012, // meters
    maxSpeed: 1.0, // meters per second
    motorResponse: 0.03,
    sensorNoise: 0.0,
    movementPerturbation: 0.5,
    motorDeadband: 5,
    lineThreshold: 30
};

// PID controller default settings
export const DEFAULT_PID_CONFIG = {
    kp: 120,
    ki: 3,
    kd: 15,
    baseSpeed: 110,
    integralMax: 250
};

// Simulation settings
export const SIMULATION_CONFIG = {
    timeStep: 0.01,
    pixelsPerMeter: 1000,
    canvasWidth: 800,
    canvasHeight: 600
};

// UI settings
export const UI_CONFIG = {
    foldableAnimationDuration: 300,
    debounceDelay: 150,
    maxLapHistory: 5
}; 