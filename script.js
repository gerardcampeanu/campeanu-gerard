const cards = Array.from(document.querySelectorAll(".music-card"));
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeStorageKey = "gerard-theme";

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const darkMode = nextTheme === "dark";

  document.documentElement.dataset.theme = nextTheme;

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(darkMode));
    themeToggle.setAttribute(
      "aria-label",
      darkMode ? "Switch to white theme" : "Switch to black theme"
    );
  }
}

applyTheme(window.localStorage.getItem(themeStorageKey));

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  window.localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});

const miniPlayer = document.querySelector("[data-mini-player]");
const playerCover = document.querySelector("[data-player-cover]");
const playerTitle = document.querySelector("[data-player-title]");
const playerSubtitle = document.querySelector("[data-player-subtitle]");
const playerToggle = document.querySelector("[data-player-toggle]");
const playerPrev = document.querySelector("[data-player-prev]");
const playerNext = document.querySelector("[data-player-next]");
const playerClose = document.querySelector("[data-player-close]");
const playerProgress = document.querySelector("[data-player-progress]");
const playerProgressFill = document.querySelector("[data-player-progress-fill]");
const playerTime = document.querySelector("[data-player-time]");
const playerWaveform = document.querySelector("[data-player-waveform]");
const waveformPattern = [38, 66, 48, 84, 58, 72, 42, 90, 54, 76, 34, 68, 88, 46, 60, 80, 50, 70, 40, 92, 56, 74, 44, 64, 86, 52, 78, 36];
const waveformBars = [];

if (playerWaveform) {
  waveformPattern.forEach((height, index) => {
    const bar = document.createElement("span");

    bar.className = "waveform-bar";
    bar.style.setProperty("--bar-height", `${height}%`);
    bar.style.setProperty("--bar-delay", `${index * -47}ms`);
    playerWaveform.append(bar);
    waveformBars.push(bar);
  });
}

const playlist = cards
  .map((card) => {
    const audio = card.querySelector("audio");
    const button = card.querySelector(".cover-button");
    const coverVideo = card.querySelector(".cover-media");
    const coverImage = card.querySelector(".cover-button img");
    const title = card.querySelector("h3")?.textContent?.trim() ?? "Untitled song";
    const subtitle = card.querySelector("p")?.textContent?.trim() ?? "CyberBeats";
    const cover = coverVideo?.getAttribute("poster") ?? coverImage?.getAttribute("src") ?? "";

    if (!audio || !button?.matches("button")) {
      return null;
    }

    return { audio, button, card, cover, coverVideo, subtitle, title };
  })
  .filter(Boolean);

let activeIndex = -1;
let progressAnimationFrame = 0;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function setPlayerProgress(track) {
  const audio = track?.audio;
  const duration = audio?.duration ?? 0;
  const currentTime = audio?.currentTime ?? 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const playedBars = Math.round((progress / 100) * waveformBars.length);

  playerProgress?.style.setProperty("--player-progress", progress);
  playerProgress?.setAttribute("aria-valuenow", String(Math.round(progress)));
  playerProgressFill?.style.setProperty("--player-progress", progress);

  waveformBars.forEach((bar, index) => {
    bar.classList.toggle("is-played", index < playedBars);
  });

  if (playerTime) {
    playerTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }
}

function stopProgressLoop() {
  if (progressAnimationFrame) {
    window.cancelAnimationFrame(progressAnimationFrame);
    progressAnimationFrame = 0;
  }
}

function startProgressLoop() {
  stopProgressLoop();

  const tick = () => {
    const activeTrack = playlist[activeIndex];

    setPlayerProgress(activeTrack);

    if (activeTrack && !activeTrack.audio.paused) {
      progressAnimationFrame = window.requestAnimationFrame(tick);
    }
  };

  tick();
}

function resetCoverVideo(video) {
  if (!video) {
    return;
  }

  video.pause();

  try {
    video.currentTime = 0;
  } catch {
    // Some browsers wait for metadata before allowing a seek.
  }
}

function updatePlayer() {
  const activeTrack = playlist[activeIndex];
  const isPlaying = Boolean(activeTrack && !activeTrack.audio.paused);

  miniPlayer?.classList.toggle("is-playing", isPlaying);

  playlist.forEach((track, index) => {
    const active = index === activeIndex && isPlaying;

    track.card.classList.toggle("is-playing", active);
    track.button.setAttribute("aria-label", `Play ${track.title} in mini player`);
  });

  if (activeTrack) {
    miniPlayer.hidden = false;
    playerCover.src = activeTrack.cover;
    playerCover.alt = `${activeTrack.title} cover art`;
    playerTitle.textContent = activeTrack.title;
    playerSubtitle.textContent = activeTrack.subtitle;
    setPlayerProgress(activeTrack);
  }

  if (playerToggle) {
    playerToggle.textContent = isPlaying ? "❚❚" : "▶";
    playerToggle.setAttribute("aria-label", isPlaying ? "Pause song" : "Play song");
  }
}

function pauseActiveTrack() {
  const activeTrack = playlist[activeIndex];

  if (activeTrack) {
    activeTrack.audio.pause();
  }

  updatePlayer();
}

function playTrack(index, restart = true) {
  if (!playlist.length) {
    return;
  }

  const nextIndex = (index + playlist.length) % playlist.length;
  const nextTrack = playlist[nextIndex];
  const changingTrack = nextIndex !== activeIndex;

  playlist.forEach((track, trackIndex) => {
    if (trackIndex !== nextIndex) {
      track.audio.pause();
      track.audio.currentTime = 0;
    }
  });

  activeIndex = nextIndex;

  if (restart || changingTrack) {
    nextTrack.audio.currentTime = 0;
  }

  nextTrack.audio.play().then(updatePlayer).catch(updatePlayer);
}

function playNextTrack() {
  playTrack(activeIndex + 1, true);
}

function playPreviousTrack() {
  playTrack(activeIndex - 1, true);
}

playlist.forEach((track, index) => {
  resetCoverVideo(track.coverVideo);

  track.button.addEventListener("mouseenter", () => {
    track.coverVideo?.play().catch(() => {});
  });

  track.button.addEventListener("mouseleave", () => {
    resetCoverVideo(track.coverVideo);
  });

  track.card.addEventListener("click", () => {
    playTrack(index, activeIndex !== index);
  });

  track.card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playTrack(index, activeIndex !== index);
    }
  });

  track.card.tabIndex = 0;
  track.audio.addEventListener("loadedmetadata", () => setPlayerProgress(track));
  track.audio.addEventListener("timeupdate", () => setPlayerProgress(track));
  track.audio.addEventListener("play", () => {
    updatePlayer();
    startProgressLoop();
  });
  track.audio.addEventListener("pause", () => {
    updatePlayer();
    stopProgressLoop();
  });
  track.audio.addEventListener("ended", playNextTrack);
});

playerProgress?.addEventListener("click", (event) => {
  const activeTrack = playlist[activeIndex];

  if (!activeTrack || !Number.isFinite(activeTrack.audio.duration)) {
    return;
  }

  const bounds = playerProgress.getBoundingClientRect();
  const clickProgress = (event.clientX - bounds.left) / bounds.width;

  activeTrack.audio.currentTime = Math.max(0, Math.min(clickProgress, 1)) * activeTrack.audio.duration;
  setPlayerProgress(activeTrack);
});

playerToggle?.addEventListener("click", () => {
  const activeTrack = playlist[activeIndex];

  if (!activeTrack) {
    playTrack(0, true);
    return;
  }

  if (activeTrack.audio.paused) {
    playTrack(activeIndex, false);
  } else {
    pauseActiveTrack();
  }
});

playerPrev?.addEventListener("click", playPreviousTrack);
playerNext?.addEventListener("click", playNextTrack);

playerClose?.addEventListener("click", () => {
  pauseActiveTrack();
  miniPlayer.hidden = true;
});
