import { useState, useEffect, useRef } from 'react';
import { MotorOutput, IRSensors, EscapeSubstate } from '../types/sumo';

const ARENA_SIZE = 340;
const CENTER = ARENA_SIZE / 2;
const DOHYO_RADIUS = 145;
const RING_BORDER_WIDTH = 12;
const INNER_RADIUS = DOHYO_RADIUS - RING_BORDER_WIDTH;
const WHEELBASE = 28;
const SENSOR_OFFSET_FRONT = 17;
const SENSOR_OFFSET_REAR = 15;

interface UseSumoPhysicsProps {
  motorL: MotorOutput;
  motorR: MotorOutput;
  irSensors: IRSensors;
  onIRChange: (sensors: IRSensors) => void;
  escapeSubstate: EscapeSubstate;
  activeTurn90: 'LEFT' | 'RIGHT' | null;
  onTurn90Complete: () => void;
  onEmergencyTriggered: (sensor: 'FRONT' | 'REAR') => void;
}

export function useSumoPhysics({
  motorL,
  motorR,
  irSensors,
  onIRChange,
  escapeSubstate,
  activeTurn90,
  onTurn90Complete,
  onEmergencyTriggered
}: UseSumoPhysicsProps) {
  const [robotX, setRobotX] = useState(CENTER);
  const [robotY, setRobotY] = useState(CENTER);
  const [heading, setHeading] = useState(-90);

  const robotStateRef = useRef({ x: CENTER, y: CENTER, heading: -90 });
  const animFrameRef = useRef<number | null>(null);

  // References to keep latest prop values without breaking the requestAnimationFrame loop
  const motorLRef = useRef(motorL);
  const motorRRef = useRef(motorR);
  const irSensorsRef = useRef(irSensors);
  const escapeSubstateRef = useRef(escapeSubstate);
  const onIRChangeRef = useRef(onIRChange);
  const onEmergencyTriggeredRef = useRef(onEmergencyTriggered);
  const onTurn90CompleteRef = useRef(onTurn90Complete);

  motorLRef.current = motorL;
  motorRRef.current = motorR;
  irSensorsRef.current = irSensors;
  escapeSubstateRef.current = escapeSubstate;
  onIRChangeRef.current = onIRChange;
  onEmergencyTriggeredRef.current = onEmergencyTriggered;
  onTurn90CompleteRef.current = onTurn90Complete;

  // 90 degree turn tracking
  const turn90ProgressRef = useRef<{
    active: 'LEFT' | 'RIGHT' | null;
    startHeading: number;
    accumulatedAngle: number;
  }>({
    active: null,
    startHeading: -90,
    accumulatedAngle: 0
  });

  useEffect(() => {
    if (activeTurn90) {
      turn90ProgressRef.current = {
        active: activeTurn90,
        startHeading: robotStateRef.current.heading,
        accumulatedAngle: 0
      };
    } else {
      turn90ProgressRef.current.active = null;
    }
  }, [activeTurn90]);

  useEffect(() => {
    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const { x, y, heading: currentHeading } = robotStateRef.current;
      const turnTrack = turn90ProgressRef.current;
      const currentEscape = escapeSubstateRef.current;

      let pwmL = motorLRef.current.currentPwm;
      let pwmR = motorRRef.current.currentPwm;

      // If one-shot 90° turn is active and no emergency, command differential rotation
      if (turnTrack.active && currentEscape === 'IDLE') {
        const turnSpeed = 220;
        if (turnTrack.active === 'LEFT') {
          // Left turn: left wheel backwards, right wheel forwards
          pwmL = -turnSpeed;
          pwmR = turnSpeed;
        } else {
          // Right turn: left wheel forwards, right wheel backwards
          pwmL = turnSpeed;
          pwmR = -turnSpeed;
        }
      }

      const maxSpeed = 120;
      const vL = (pwmL / 255) * maxSpeed;
      const vR = (pwmR / 255) * maxSpeed;

      const linearV = (vL + vR) / 2;
      // In screen coordinates (Y down): when vL > vR, vehicle rotates clockwise (positive angular velocity)
      const angularW = (vL - vR) / WHEELBASE;

      const radHeading = (currentHeading * Math.PI) / 180;
      const newRadHeading = radHeading + angularW * dt;
      let newHeadingDeg = (newRadHeading * 180) / Math.PI;

      // Handle 90° turn completion check
      if (turnTrack.active) {
        const angleDelta = Math.abs(angularW * dt * (180 / Math.PI));
        turnTrack.accumulatedAngle += angleDelta;

        if (turnTrack.accumulatedAngle >= 90) {
          // Exactly 90° reached! Snap to target heading and stop.
          const targetHeading =
            turnTrack.active === 'LEFT'
              ? turnTrack.startHeading - 90
              : turnTrack.startHeading + 90;

          newHeadingDeg = targetHeading;
          turnTrack.active = null;
          onTurn90CompleteRef.current();
        }
      }

      while (newHeadingDeg > 180) newHeadingDeg -= 360;
      while (newHeadingDeg < -180) newHeadingDeg += 360;

      const dx = Math.cos(newRadHeading) * linearV * dt;
      const dy = Math.sin(newRadHeading) * linearV * dt;

      let nextX = x + dx;
      let nextY = y + dy;

      // Clamp robot position so it never vanishes off the canvas
      const maxDistance = DOHYO_RADIUS + 12;
      const distFromCenter = Math.hypot(nextX - CENTER, nextY - CENTER);
      if (distFromCenter > maxDistance) {
        const angle = Math.atan2(nextY - CENTER, nextX - CENTER);
        nextX = CENTER + Math.cos(angle) * maxDistance;
        nextY = CENTER + Math.sin(angle) * maxDistance;
      }

      robotStateRef.current = { x: nextX, y: nextY, heading: newHeadingDeg };
      setRobotX(nextX);
      setRobotY(nextY);
      setHeading(newHeadingDeg);

      // Check Front Sensor & Rear Sensor positions
      const cosH = Math.cos(newRadHeading);
      const sinH = Math.sin(newRadHeading);

      const sF_x = nextX + cosH * SENSOR_OFFSET_FRONT;
      const sF_y = nextY + sinH * SENSOR_OFFSET_FRONT;

      const sR_x = nextX - cosH * SENSOR_OFFSET_REAR;
      const sR_y = nextY - sinH * SENSOR_OFFSET_REAR;

      const distF = Math.hypot(sF_x - CENTER, sF_y - CENTER);
      const distR = Math.hypot(sR_x - CENTER, sR_y - CENTER);

      // In Dohyo competition: White line is from INNER_RADIUS outwards
      const hitFront = distF >= INNER_RADIUS;
      const hitRear = distR >= INNER_RADIUS;

      const prevIR = irSensorsRef.current;
      if (hitFront !== prevIR.front || hitRear !== prevIR.rear) {
        onIRChangeRef.current({ front: hitFront, rear: hitRear });

        if (currentEscape === 'IDLE') {
          if (turnTrack.active) {
            turnTrack.active = null;
            onTurn90CompleteRef.current();
          }

          if (hitFront) onEmergencyTriggeredRef.current('FRONT');
          else if (hitRear) onEmergencyTriggeredRef.current('REAR');
        }
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const resetPosition = () => {
    turn90ProgressRef.current.active = null;
    robotStateRef.current = { x: CENTER, y: CENTER, heading: -90 };
    setRobotX(CENTER);
    setRobotY(CENTER);
    setHeading(-90);
    onIRChangeRef.current({ front: false, rear: false });
  };

  const nudgeForwardToEdge = () => {
    robotStateRef.current = { x: CENTER, y: CENTER - INNER_RADIUS + 8, heading: -90 };
    setRobotX(CENTER);
    setRobotY(CENTER - INNER_RADIUS + 8);
    setHeading(-90);
  };

  const nudgeBackwardToEdge = () => {
    robotStateRef.current = { x: CENTER, y: CENTER + INNER_RADIUS - 8, heading: -90 };
    setRobotX(CENTER);
    setRobotY(CENTER + INNER_RADIUS - 8);
    setHeading(-90);
  };

  return {
    robotX,
    robotY,
    heading,
    resetPosition,
    nudgeForwardToEdge,
    nudgeBackwardToEdge
  };
}
