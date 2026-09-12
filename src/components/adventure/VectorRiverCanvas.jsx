import React, { useEffect, useRef } from "react";

const SIM_SPEED = 4;
const LAND_TIMEOUT_S = 120;
const RESULT_PAUSE_S = 1.5;
const BANK_H = 32;

const COLORS = {
  skyTop: "#172642",
  skyBottom: "#31567f",
  waterTop: "#17658a",
  waterBottom: "#092d4b",
  current: "rgba(177, 231, 244, 0.42)",
  bank: "#2f7045",
  bankDark: "#1d4a2c",
  bankEdge: "#62b873",
  pole: "#f0e9d8",
  flag: "#ffd166",
  goodZone: "rgba(34, 197, 94, 0.32)",
  neutralZone: "rgba(34, 197, 94, 0.14)",
  badZone: "rgba(239, 68, 68, 0.34)",
  hull: "#d27a42",
  hullDark: "#713b22",
  sail: "#fff4d6",
  foam: "rgba(230, 248, 255, 0.82)",
  vector: "#67f5ff",
  text: "#e2eff8",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = (value) => Math.round(value * 100) / 100;

export default function VectorRiverCanvas({
  u = 3,
  v = 4,
  d = 60,
  targetX = 15,
  angleAlpha = 90,
  isSimulating = false,
  targetZoneMeters = 6,
  onComplete = () => {},
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  const propsRef = useRef({
    u,
    v,
    d,
    targetX,
    angleAlpha,
    targetZoneMeters,
    onComplete,
  });

  propsRef.current = {
    u,
    v,
    d,
    targetX,
    angleAlpha,
    targetZoneMeters,
    onComplete,
  };

  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    scale: 1,
    worldWidth: 0,
    riverTop: BANK_H,
    riverBottom: 0,
    phase: "idle",
    time: 0,
    simulationTime: 0,
    x: 0,
    y: 0,
    phaseTime: 0,
    particles: [],
    result: null,
    completionCalled: false,
  });

  const getState = () => stateRef.current;

  const layout = () => {
    const state = getState();
    const wrapper = wrapRef.current;

    if (!wrapper) return;

    const width = Math.max(wrapper.clientWidth, 280);
    const height = Math.max(wrapper.clientHeight, 360);

    state.width = width;
    state.height = height;
    state.riverTop = BANK_H;
    state.riverBottom = height - BANK_H;

    const riverHeight = Math.max(state.riverBottom - state.riverTop, 1);

    // Scale based on river height, while preventing an unusably large scale
    // on very narrow screens.
    state.scale = clamp(riverHeight / Math.max(propsRef.current.d, 1), 1.8, 7);
    state.worldWidth = width / state.scale;

    if (state.phase === "idle") {
      state.x = getStartX(state);
    }
  };

  const getStartX = (state) => {
    const { targetX, targetZoneMeters } = propsRef.current;
    const preferredStart = Math.max(targetX - 12, 4);
    const safeMargin = Math.max(targetZoneMeters + 3, 7);

    return clamp(
      preferredStart,
      safeMargin,
      Math.max(safeMargin, state.worldWidth - safeMargin)
    );
  };

  const resetRun = () => {
    const state = getState();

    layout();

    state.phase = "sailing";
    state.time = 0;
    state.simulationTime = 0;
    state.phaseTime = 0;
    state.x = getStartX(state);
    state.y = 0;
    state.particles = [];
    state.result = null;
    state.completionCalled = false;
  };

  useEffect(() => {
    if (isSimulating) {
      requestAnimationFrame(resetRun);
    }
  }, [isSimulating]);

  useEffect(() => {
    const wrapper = wrapRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let animationFrame = 0;
    let lastTime = performance.now();

    const resizeCanvas = () => {
      const state = getState();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      state.dpr = dpr;

      canvas.width = Math.max(1, Math.round(wrapper.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(wrapper.clientHeight * dpr));

      layout();

      // Prevent a large simulation jump after a resize.
      lastTime = performance.now();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(wrapper);
    resizeCanvas();

    const render = (now) => {
      const deltaTime = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      layout();
      update(deltaTime);
      draw(context);

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  const update = (deltaTime) => {
    const state = getState();
    const props = propsRef.current;

    state.time += deltaTime;

    if (state.phase === "sailing") {
      const angle = (props.angleAlpha * Math.PI) / 180;
      const velocityX = props.u + props.v * Math.cos(angle);
      const velocityY = props.v * Math.sin(angle);
      const worldDelta = deltaTime * SIM_SPEED;

      state.simulationTime += worldDelta;
      state.x += velocityX * worldDelta;
      state.y += velocityY * worldDelta;

      if (state.y >= props.d) {
        state.y = props.d;

        const deviation = round2(Math.abs(state.x - props.targetX));
        const success = deviation <= props.targetZoneMeters;

        state.result = {
          success,
          calculatedTime: round2(state.simulationTime),
          deviation,
          landingX: round2(state.x),
        };

        state.phase = success ? "success" : "sinking";
        state.phaseTime = 0;
        spawnParticles(state, success);
      } else if (
        state.x < -5 ||
        state.x > state.worldWidth + 5 ||
        state.simulationTime > LAND_TIMEOUT_S
      ) {
        state.result = {
          success: false,
          calculatedTime: round2(state.simulationTime),
          deviation: null,
          landingX: null,
        };

        state.phase = "failed";
        state.phaseTime = 0;
      }
    }

    if (
      state.phase === "success" ||
      state.phase === "sinking" ||
      state.phase === "failed"
    ) {
      state.phaseTime += deltaTime;
      updateParticles(state, deltaTime);

      if (
        state.phaseTime >= RESULT_PAUSE_S &&
        !state.completionCalled
      ) {
        state.completionCalled = true;
        state.phase = "done";
        props.onComplete(state.result);
      }
    }
  };

  const spawnParticles = (state, success) => {
    const count = success ? 90 : 42;
    const x = state.x * state.scale;
    const y = state.riverBottom - state.y * state.scale;

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 170;

      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        radius: 1.5 + Math.random() * 3,
        life: 1,
        decay: 0.7 + Math.random() * 0.9,
        color: success
          ? Math.random() > 0.5
            ? "#22c55e"
            : "#ffd166"
          : "#a9bfca",
      });
    }
  };

  const updateParticles = (state, deltaTime) => {
    state.particles = state.particles.filter((particle) => {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += 230 * deltaTime;
      particle.life -= particle.decay * deltaTime;

      return particle.life > 0;
    });
  };

  const draw = (ctx) => {
    const state = getState();
    const props = propsRef.current;
    const { width, height, dpr, riverTop, riverBottom, scale } = state;

    if (!width || !height) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const toScreenX = (meters) => meters * scale;
    const toScreenY = (meters) => riverBottom - meters * scale;

    drawBackground(ctx, state);
    drawRiverCurrent(ctx, state, props);
    drawTargetZone(ctx, state, props, toScreenX);
    drawNearBank(ctx, state);
    drawCurrentArrow(ctx, props, riverBottom - 20);
    drawBoat(ctx, state, props, toScreenX, toScreenY);
    drawParticles(ctx, state);
    drawStatus(ctx, state);
  };

  const drawBackground = (ctx, state) => {
    const skyGradient = ctx.createLinearGradient(
      0,
      0,
      0,
      state.riverTop
    );

    skyGradient.addColorStop(0, COLORS.skyTop);
    skyGradient.addColorStop(1, COLORS.skyBottom);

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, state.width, state.riverTop);

    const waterGradient = ctx.createLinearGradient(
      0,
      state.riverTop,
      0,
      state.riverBottom
    );

    waterGradient.addColorStop(0, COLORS.waterTop);
    waterGradient.addColorStop(1, COLORS.waterBottom);

    ctx.fillStyle = waterGradient;
    ctx.fillRect(
      0,
      state.riverTop,
      state.width,
      state.riverBottom - state.riverTop
    );

    ctx.fillStyle = COLORS.bank;
    ctx.fillRect(0, 0, state.width, state.riverTop);

    ctx.fillStyle = COLORS.bankEdge;
    ctx.fillRect(0, state.riverTop - 3, state.width, 3);
  };

  const drawRiverCurrent = (ctx, state, props) => {
    const riverHeight = state.riverBottom - state.riverTop;
    const rows = Math.max(5, Math.floor(riverHeight / 34));
    const offset = (state.time * Math.max(props.u, 0.5) * 24) % 110;

    ctx.strokeStyle = COLORS.current;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for (let row = 0; row < rows; row += 1) {
      const y =
        state.riverTop + ((row + 0.5) / rows) * riverHeight;
      const wave = Math.sin(state.time * 1.6 + row * 1.8) * 3;

      for (let x = -110; x < state.width + 110; x += 110) {
        const startX = x + offset;

        ctx.beginPath();
        ctx.moveTo(startX, y + wave);
        ctx.quadraticCurveTo(
          startX + 26,
          y + wave - 5,
          startX + 52,
          y + wave
        );
        ctx.stroke();
      }
    }
  };

  const drawTargetZone = (ctx, state, props, toScreenX) => {
    const leftMeters = props.targetX - props.targetZoneMeters;
    const rightMeters = props.targetX + props.targetZoneMeters;
    const left = clamp(toScreenX(leftMeters), 0, state.width);
    const right = clamp(toScreenX(rightMeters), 0, state.width);

    const zoneColor =
      state.phase === "success"
        ? COLORS.goodZone
        : state.phase === "sinking" || state.phase === "failed"
          ? COLORS.badZone
          : COLORS.neutralZone;

    ctx.fillStyle = zoneColor;
    ctx.fillRect(left, 0, Math.max(right - left, 0), state.riverTop);

    ctx.fillStyle = "#f1f5f9";

    for (const meter of [leftMeters, rightMeters]) {
      const x = clamp(toScreenX(meter), 0, state.width);
      ctx.fillRect(x - 1, 4, 2, state.riverTop - 7);
    }

    const flagX = clamp(toScreenX(props.targetX), 14, state.width - 14);
    drawFlag(ctx, flagX, state.riverTop, state.time);
  };

  const drawNearBank = (ctx, state) => {
    ctx.fillStyle = COLORS.bankDark;
    ctx.fillRect(
      0,
      state.riverBottom,
      state.width,
      state.height - state.riverBottom
    );

    ctx.fillStyle = COLORS.bankEdge;
    ctx.fillRect(0, state.riverBottom, state.width, 3);
  };

  const drawFlag = (ctx, x, riverTop, time) => {
    const wave = Math.sin(time * 6) * 3;

    ctx.fillStyle = COLORS.pole;
    ctx.fillRect(x - 1.5, riverTop - 30, 3, 30);

    ctx.beginPath();
    ctx.moveTo(x + 1.5, riverTop - 30);
    ctx.quadraticCurveTo(
      x + 15,
      riverTop - 28 + wave,
      x + 27,
      riverTop - 25 + wave * 0.6
    );
    ctx.lineTo(x + 1.5, riverTop - 19);
    ctx.closePath();

    ctx.fillStyle = COLORS.flag;
    ctx.fill();
  };

  const drawCurrentArrow = (ctx, props, y) => {
    const length = clamp(28 + Math.max(props.u, 0) * 7, 28, 75);

    drawArrow(ctx, 14, y, length, 0, COLORS.current);

    ctx.fillStyle = COLORS.text;
    ctx.font = '600 11px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(`current ${props.u} m/s`, 14, y - 10);
  };

  const drawBoat = (ctx, state, props, toScreenX, toScreenY) => {
    const angle = (props.angleAlpha * Math.PI) / 180;
    const velocityX = props.u + props.v * Math.cos(angle);
    const velocityY = props.v * Math.sin(angle);

    const boatSize = clamp(state.scale * 0.9, 18, 34);
    const tilt = Math.atan2(-velocityY, velocityX);

    let sinkOffset = 0;
    let opacity = 1;
    let rotation = tilt;

    if (state.phase === "sinking") {
      sinkOffset = state.phaseTime * 16;
      rotation += Math.min(state.phaseTime * 1.1, 1.2);
      opacity = Math.max(1 - state.phaseTime / RESULT_PAUSE_S, 0);
    }

    const boatX = toScreenX(state.x);
    const boatY =
      toScreenY(state.y) +
      (state.phase !== "sailing"
        ? Math.sin(state.time * 2.4) * 2
        : 0) +
      sinkOffset;

    const vectorLength = clamp(
      Math.hypot(velocityX, velocityY) * state.scale * 0.2,
      24,
      62
    );

    if (state.phase === "sailing") {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COLORS.foam;

      ctx.beginPath();
      ctx.ellipse(boatX - 28, boatY + 5, 11, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(boatX - 43, boatY - 1, 8, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(boatX, boatY);
    ctx.rotate(rotation);

    const hullGradient = ctx.createLinearGradient(0, -11, 0, 11);
    hullGradient.addColorStop(0, COLORS.hull);
    hullGradient.addColorStop(1, COLORS.hullDark);

    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.quadraticCurveTo(14, -10, -8, -10);
    ctx.lineTo(-22, -7);
    ctx.quadraticCurveTo(-28, 0, -22, 7);
    ctx.lineTo(-8, 10);
    ctx.quadraticCurveTo(14, 10, 28, 0);
    ctx.closePath();

    ctx.fillStyle = hullGradient;
    ctx.fill();
    ctx.strokeStyle = COLORS.hullDark;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(-3, -26, 3, 16);

    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(15, -21, 4, -12);
    ctx.closePath();

    ctx.fillStyle = COLORS.sail;
    ctx.fill();

    if (state.phase === "idle" || state.phase === "sailing") {
      const dx = Math.cos(tilt) * vectorLength;
      const dy = -Math.sin(tilt) * vectorLength;

      drawArrow(ctx, 0, 0, dx, dy, COLORS.vector);

      ctx.fillStyle = COLORS.vector;
      ctx.font = '700 12px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("R", dx + 6, dy);
    }

    ctx.restore();
  };

  const drawParticles = (ctx, state) => {
    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  };

  const drawStatus = (ctx, state) => {
    if (
      state.phase !== "success" &&
      state.phase !== "sinking" &&
      state.phase !== "failed"
    ) {
      return;
    }

    const message =
      state.phase === "success"
        ? "Landed safely!"
        : state.phase === "sinking"
          ? "Capsized!"
          : "Swept downriver!";

    const color =
      state.phase === "success" ? "#4ade80" : "#f87171";

    const opacity = clamp(state.phaseTime / 0.35, 0, 1);

    ctx.save();
    ctx.globalAlpha = opacity * 0.92;
    ctx.fillStyle = color;
    ctx.font = '700 20px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 8;
    ctx.fillText(message, state.width / 2, state.height * 0.24);
    ctx.restore();
  };

  const drawArrow = (ctx, x, y, dx, dy, color, lineWidth = 2.5) => {
    const length = Math.hypot(dx, dy);

    if (length < 6) return;

    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();

    ctx.translate(x + dx, y + dy);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, 5);
    ctx.lineTo(-9, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: 360,
        height: "100%",
        overflow: "hidden",
        borderRadius: 18,
        background: COLORS.waterBottom,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive river vector simulation"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}