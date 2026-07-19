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
  track.audio.addEventListener("play", updatePlayer);
  track.audio.addEventListener("pause", updatePlayer);
  track.audio.addEventListener("ended", playNextTrack);
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
