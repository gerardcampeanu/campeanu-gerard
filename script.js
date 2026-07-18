const cards = Array.from(document.querySelectorAll(".music-card"));
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
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

  if (themeLabel) {
    themeLabel.textContent = darkMode ? "White" : "Black";
  }
}

applyTheme(window.localStorage.getItem(themeStorageKey));

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  window.localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});

function updateCard(card, playing) {
  const button = card.querySelector(".cover-button");
  const icon = card.querySelector(".play-button");
  const title = card.querySelector("h3")?.textContent ?? "track";

  card.classList.toggle("is-playing", playing);

  if (icon) {
    icon.textContent = playing ? "❚❚" : "▶";
  }

  if (button) {
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${title}`);
  }
}

cards.forEach((card) => {
  const audio = card.querySelector("audio");
  const button = card.querySelector(".cover-button");

  if (!audio || !button.matches("button")) {
    return;
  }

  button.addEventListener("click", () => {
    if (audio.paused) {
      cards.forEach((otherCard) => {
        const otherAudio = otherCard.querySelector("audio");
        if (otherAudio && otherAudio !== audio) {
          otherAudio.pause();
          updateCard(otherCard, false);
        }
      });
      audio.play();
      updateCard(card, true);
    } else {
      audio.pause();
      updateCard(card, false);
    }
  });

  audio.addEventListener("ended", () => updateCard(card, false));
});
