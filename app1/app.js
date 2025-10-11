const MODES = {
  pomodoro: { label: "Trabajo", minutes: 25, emoji: "💼" },
  shortBreak: { label: "Pausa corta", minutes: 5, emoji: "🧘" },
  longBreak: { label: "Pausa larga", minutes: 15, emoji: "😌" },
};

const EXTEND_SECONDS = 5 * 60;
const CONFETTI_DURATION = 2600;
const CONFETTI_COLORS = ["#F25F5C", "#FFE066", "#247BA0", "#70C1B3", "#50514F"];

const elements = {
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  toggle: document.getElementById("toggle"),
  extend: document.getElementById("extend"),
  reset: document.getElementById("reset"),
  sessions: document.getElementById("sessions"),
  modeButtons: document.querySelectorAll(".mode-button"),
  modeEmoji: document.getElementById("mode-emoji"),
  modeStatusText: document.getElementById("mode-status-text"),
  focusInput: document.getElementById("focus-task"),
  focusLog: document.getElementById("focus-log"),
  confettiCanvas: document.getElementById("confetti-canvas"),
};

const state = {
  mode: "pomodoro",
  remainingSeconds: MODES.pomodoro.minutes * 60,
  isRunning: false,
  intervalId: null,
  endTime: null,
  completedSessions: 0,
  focusLog: [],
};

const confettiState = {
  particles: [],
  animationId: null,
  startTime: null,
  ctx: null,
  width: 0,
  height: 0,
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return { mins, secs };
};

const updateModeIndicators = () => {
  if (elements.modeEmoji) {
    elements.modeEmoji.textContent = MODES[state.mode].emoji;
  }
  if (elements.modeStatusText) {
    elements.modeStatusText.textContent = `Modo: ${MODES[state.mode].label}`;
  }
};

const updateDisplay = () => {
  const { mins, secs } = formatTime(state.remainingSeconds);
  elements.minutes.textContent = mins;
  elements.seconds.textContent = secs;
  updateModeIndicators();
  document.title = `${mins}:${secs} ${MODES[state.mode].emoji} · ${MODES[state.mode].label}`;
};

const resizeConfettiCanvas = () => {
  if (!elements.confettiCanvas) return;
  const canvas = elements.confettiCanvas;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  confettiState.ctx = ctx;
  confettiState.width = window.innerWidth;
  confettiState.height = window.innerHeight;
};

const spawnConfettiParticles = () => {
  const count = 180;
  confettiState.particles = Array.from({ length: count }, () => ({
    x: Math.random() * confettiState.width,
    y: -Math.random() * confettiState.height,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    velocityX: -2 + Math.random() * 4,
    velocityY: 2 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
  }));
};

const stopConfetti = () => {
  if (confettiState.animationId) {
    cancelAnimationFrame(confettiState.animationId);
    confettiState.animationId = null;
  }
  if (confettiState.ctx) {
    confettiState.ctx.clearRect(0, 0, confettiState.width, confettiState.height);
  }
  if (elements.confettiCanvas) {
    elements.confettiCanvas.style.display = "none";
  }
  confettiState.startTime = null;
  confettiState.particles = [];
};

const renderConfetti = (timestamp) => {
  if (!confettiState.startTime) {
    confettiState.startTime = timestamp;
  }

  const elapsed = timestamp - confettiState.startTime;
  const ctx = confettiState.ctx;
  if (!ctx) return;

  ctx.clearRect(0, 0, confettiState.width, confettiState.height);

  const fadeStart = CONFETTI_DURATION * 0.6;

  confettiState.particles.forEach((particle) => {
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.rotation += particle.rotationSpeed;

    if (particle.y > confettiState.height + particle.size) {
      particle.y = -particle.size;
      particle.x = Math.random() * confettiState.width;
    }
    if (particle.x < -particle.size) {
      particle.x = confettiState.width + particle.size;
    }
    if (particle.x > confettiState.width + particle.size) {
      particle.x = -particle.size;
    }

    let opacity = 1;
    if (elapsed > fadeStart) {
      opacity = Math.max(0, 1 - (elapsed - fadeStart) / (CONFETTI_DURATION - fadeStart));
    }

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = opacity;
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.4);
    ctx.restore();
  });

  ctx.globalAlpha = 1;

  if (elapsed > CONFETTI_DURATION) {
    stopConfetti();
    return;
  }

  confettiState.animationId = requestAnimationFrame(renderConfetti);
};

const launchConfetti = () => {
  if (!elements.confettiCanvas) return;
  stopConfetti();
  resizeConfettiCanvas();
  spawnConfettiParticles();
  confettiState.startTime = null;
  elements.confettiCanvas.style.display = "block";
  confettiState.animationId = requestAnimationFrame(renderConfetti);
};

const renderFocusLog = () => {
  if (!elements.focusLog) return;
  elements.focusLog.innerHTML = "";

  state.focusLog.forEach((entry) => {
    const li = document.createElement("li");
    li.dataset.entryId = entry.id;

    const content = document.createElement("div");
    content.className = "focus-entry-content";

    const task = document.createElement("span");
    task.className = "focus-entry-task";
    task.textContent = entry.task;

    const meta = document.createElement("span");
    meta.className = "focus-entry-meta";
    meta.textContent = `${entry.modeLabel} · ${entry.timestamp}`;

    content.appendChild(task);
    content.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "focus-entry-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "focus-entry-action";
    editButton.textContent = "Editar";
    editButton.setAttribute("aria-label", `Editar objetivo: ${entry.task}`);
    editButton.addEventListener("click", () => startInlineEdit(entry.id, li));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "focus-entry-action destructive";
    deleteButton.textContent = "Eliminar";
    deleteButton.setAttribute("aria-label", `Eliminar objetivo: ${entry.task}`);
    deleteButton.addEventListener("click", () => removeFocusEntry(entry.id));

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    li.appendChild(content);
    li.appendChild(actions);
    elements.focusLog.appendChild(li);
  });
};

const addFocusEntry = (task) => {
  const trimmedTask = task.trim();
  if (!trimmedTask) return;

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.focusLog.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    task: trimmedTask,
    mode: state.mode,
    modeLabel: MODES[state.mode].label,
    timestamp,
  });

  renderFocusLog();
};

const setActiveModeButton = (mode) => {
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive);
  });
};

const updateFocusEntry = (id, task) => {
  const entry = state.focusLog.find((item) => item.id === id);
  if (!entry) return;
  entry.task = task;
  renderFocusLog();
};

const removeFocusEntry = (id) => {
  state.focusLog = state.focusLog.filter((item) => item.id !== id);
  renderFocusLog();
};

const startInlineEdit = (id, listItem) => {
  const entry = state.focusLog.find((item) => item.id === id);
  if (!entry || !listItem) return;

  const content = listItem.querySelector(".focus-entry-content");
  const actions = listItem.querySelector(".focus-entry-actions");
  if (!content || !actions) return;

  content.classList.add("editing");
  actions.classList.add("editing");

  const currentTask = entry.task;
  const editor = document.createElement("input");
  editor.type = "text";
  editor.value = currentTask;
  editor.maxLength = 140;
  editor.className = "focus-entry-editor";
  editor.setAttribute("aria-label", "Editar objetivo");

  const meta = content.querySelector(".focus-entry-meta");
  const taskNode = content.querySelector(".focus-entry-task");
  if (taskNode) {
    taskNode.style.display = "none";
  }

  content.insertBefore(editor, meta);
  editor.focus();
  editor.select();

  const cleanup = () => {
    editor.remove();
    if (taskNode) {
      taskNode.style.display = "";
    }
    content.classList.remove("editing");
    actions.classList.remove("editing");
  };

  const applyChanges = () => {
    const trimmed = editor.value.trim();
    if (!trimmed) {
      cleanup();
      return;
    }
    updateFocusEntry(id, trimmed);
  };

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyChanges();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cleanup();
    }
  });

  editor.addEventListener("blur", () => {
    applyChanges();
  });
};

const switchMode = (mode) => {
  state.mode = mode;
  state.remainingSeconds = MODES[mode].minutes * 60;
  state.endTime = null;
  setActiveModeButton(mode);
  updateDisplay();
  elements.toggle.textContent = "Iniciar";
};

const clearTimer = () => {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  state.isRunning = false;
  state.endTime = null;
};

const playChime = () => {
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gainNode = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audio.currentTime);

    gainNode.gain.setValueAtTime(0.001, audio.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1.2);

    oscillator.connect(gainNode);
    gainNode.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 1.3);
  } catch (error) {
    console.warn("Audio no disponible:", error);
  }
};

const handleCompletion = () => {
  playChime();
  launchConfetti();

  if (state.mode === "pomodoro") {
    state.completedSessions += 1;
    elements.sessions.textContent = state.completedSessions;
    const nextMode = state.completedSessions % 4 === 0 ? "longBreak" : "shortBreak";
    switchMode(nextMode);
  } else {
    switchMode("pomodoro");
  }
};

const tick = () => {
  const now = Date.now();
  state.remainingSeconds = Math.max(0, Math.round((state.endTime - now) / 1000));
  updateDisplay();

  if (state.remainingSeconds <= 0) {
    clearTimer();
    handleCompletion();
  }
};

const startTimer = () => {
  if (state.isRunning) return;
  state.isRunning = true;
  state.endTime = Date.now() + state.remainingSeconds * 1000;
  elements.toggle.textContent = "Pausar";
  state.intervalId = setInterval(tick, 250);
};

const pauseTimer = () => {
  if (!state.isRunning) return;
  clearTimer();
  elements.toggle.textContent = "Reanudar";
};

elements.toggle.addEventListener("click", () => {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

elements.extend.addEventListener("click", () => {
  state.remainingSeconds += EXTEND_SECONDS;
  if (state.endTime) {
    state.endTime += EXTEND_SECONDS * 1000;
  }
  updateDisplay();
});

elements.reset.addEventListener("click", () => {
  clearTimer();
  state.remainingSeconds = MODES[state.mode].minutes * 60;
  elements.toggle.textContent = "Iniciar";
  updateDisplay();
});

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    if (mode === state.mode) return;
    clearTimer();
    switchMode(mode);
  });
});

if (elements.focusInput) {
  elements.focusInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addFocusEntry(event.target.value);
    event.target.value = "";
  });
}

document.addEventListener("visibilitychange", () => {
  if (!state.isRunning || !state.endTime) return;
  if (document.visibilityState === "visible") {
    state.remainingSeconds = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
    updateDisplay();
  }
});

window.addEventListener("resize", () => {
  if (!confettiState.animationId) return;
  resizeConfettiCanvas();
});

updateDisplay();
renderFocusLog();
