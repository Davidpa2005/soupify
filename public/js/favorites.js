document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favGrid");
  const status = document.getElementById("favStatus");

  const songs = await fetch("/api/favorites").then(r => r.json());
  status.textContent = `Favoritos: ${songs.length}`;

  if (!songs.length) {
    status.textContent = "No tienes favoritos aún.";
    return;
  }

  Player.setQueue(songs, 0);

  songs.forEach((song, idx) => {
    const card = document.createElement("article");
    card.className = "song-card";
    card.innerHTML = `
      <div class="song-cover-wrap">
        <img src="${song.cover_url || "/assets/logo.png"}" class="song-cover" />
      </div>
      <div class="song-info">
        <h4 class="song-title"></h4>
        <p class="song-artist"></p>
      </div>
      <div class="song-actions">
        <button class="btn-primary play-btn">▶</button>
        <button class="fav-btn">💔</button>
      </div>
    `;
    card.querySelector(".song-title").textContent = song.title;
    card.querySelector(".song-artist").textContent = song.artist;

    card.querySelector(".play-btn").onclick = () => {
      Player.setQueue(songs, idx);
      Player.play();
    };

    card.querySelector(".fav-btn").onclick = async () => {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: song.id })
      });
      location.reload();
    };

    grid.appendChild(card);
  });
});