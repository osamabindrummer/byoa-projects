const MODES = {
  pomodoro: { label: "Trabajo", minutes: 25 },
  shortBreak: { label: "Pausa corta", minutes: 5 },
  longBreak: { label: "Pausa larga", minutes: 15 },
};

const elements = {
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  toggle: document.getElementById("toggle"),
  reset: document.getElementById("reset"),
  sessions: document.getElementById("sessions"),
  modeButtons: document.querySelectorAll(".mode-button"),
};

const state = {
  mode: "pomodoro",
  remainingSeconds: MODES.pomodoro.minutes * 60,
  isRunning: false,
  intervalId: null,
  endTime: null,
  completedSessions: 0,
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

const updateDisplay = () => {
  const { mins, secs } = formatTime(state.remainingSeconds);
  elements.minutes.textContent = mins;
  elements.seconds.textContent = secs;
  document.title = `${mins}:${secs} · ${MODES[state.mode].label}`;
};

const setActiveModeButton = (mode) => {
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive);
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

elements.reset.addEventListener("click", () => {
  clearTimer();
  state.remainingSeconds = MODES[state.mode].minutes * 60;
  elements.toggle.textContent = "Iniciar";
  updateDisplay();
});

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    clearTimer();
    switchMode(mode);
  });
});

document.addEventListener("visibilitychange", () => {
  if (!state.isRunning || !state.endTime) return;
  if (document.visibilityState === "visible") {
    state.remainingSeconds = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
    updateDisplay();
  }
});

updateDisplay();
