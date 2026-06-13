const cards = Array.from(document.querySelectorAll(".music-card"));

function updateCard(card, playing) {
  const button = card.querySelector(".cover-button");
  const icon = card.querySelector(".play-button");
  const title = card.querySelector("h3")?.textContent ?? "track";

  card.classList.toggle("is-playing", playing);
  icon.textContent = playing ? "❚❚" : "▶";
  button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${title}`);
}

cards.forEach((card) => {
  const audio = card.querySelector("audio");
  const button = card.querySelector(".cover-button");

  button.addEventListener("click", () => {
    if (audio.paused) {
      cards.forEach((otherCard) => {
        const otherAudio = otherCard.querySelector("audio");
        if (otherAudio !== audio) {
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
