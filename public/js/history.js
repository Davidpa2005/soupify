document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("histGrid");
  const status = document.getElementById("histStatus");

  const rows = await fetch("/api/history").then(r => r.json());
  status.textContent = `Reproducciones recientes: ${rows.length}`;

  if (!rows.length) {
    status.textContent = "Aún no has reproducido canciones.";
    return;
  }

  const songs = rows.map(r => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    cover_url: r.cover_url,
    audio_url: r.audio_url
  }));

  Player.setQueue(songs, 0);

  rows.forEach((r, idx) => {
    const card = document.createElement("article");
    card.className = "song-card";
    card.innerHTML = `
      <div class="song-cover-wrap">
        <img src="${r.cover_url || "/assets/logo.png"}" class="song-cover" />
      </div>
      <div class="song-info">
        <h4 class="song-title"></h4>
        <p class="song-artist"></p>
        <p class="song-album">Played at: ${new Date(r.played_at).toLocaleString()}</p>
      </div>
      <div class="song-actions">
        <button class="btn-primary play-btn">▶</button>
      </div>
    `;
    card.querySelector(".song-title").textContent = r.title;
    card.querySelector(".song-artist").textContent = r.artist;

    card.querySelector(".play-btn").onclick = () => {
      Player.setQueue(songs, idx);
      Player.play();
    };

    grid.appendChild(card);
  });
});