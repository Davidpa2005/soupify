document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("adminStatus");
  const statUsers = document.getElementById("statUsers");
  const statSongs = document.getElementById("statSongs");
  const statPlaylists = document.getElementById("statPlaylists");

  const songsGrid = document.getElementById("songsAdminGrid");
  const playlistsList = document.getElementById("playlistsAdminList");

  try {

    // Stats
    const stats = await fetch("/api/admin/stats").then(r => r.json());
    statUsers.textContent = (stats.users === null) ? "Tabla no detectada" : stats.users;
    statSongs.textContent = stats.songs;
    statPlaylists.textContent = stats.playlists;

    // Songs
    const songs = await fetch("/api/admin/songs").then(r => r.json());
    renderSongs(songs);

    // Playlists
    const pls = await fetch("/api/admin/playlists").then(r => r.json());
    renderPlaylists(pls);

  } catch (e) {
    console.error(e);
  }

  function renderSongs(songs) {
    songsGrid.innerHTML = "";

    songs.forEach(song => {
      const card = document.createElement("article");
      card.className = "song-card";

      card.innerHTML = `
        <div class="song-info">
          <h4 class="song-title"></h4>
          <p class="song-artist"></p>
          <p class="song-album"></p>
          <p class="song-album">Repro: ${song.play_count ?? 0}</p>
        </div>
        <div class="song-actions">
          <button class="btn-primary delete-btn">🗑️ Borrar</button>
        </div>
      `;

      card.querySelector(".song-title").textContent = `${song.title || "—"} (#${song.id})`;
      card.querySelector(".song-artist").textContent = song.artist || "—";
      card.querySelector(".song-album").textContent = song.album || "—";

      card.querySelector(".delete-btn").onclick = async () => {
        if (!confirm(`¿Borrar canción "${song.title}"?`)) return;
        await fetch(`/api/admin/songs/${song.id}`, { method: "DELETE" });
        card.remove();
      };

      songsGrid.appendChild(card);
    });
  }

  function renderPlaylists(pls) {
    playlistsList.innerHTML = "";

    pls.forEach(p => {
      const row = document.createElement("div");
      row.className = "playlist-card";
      row.style.marginBottom = "10px";

      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <h3 style="margin:0;">${p.name} (#${p.id})</h3>
            <p class="playlist-songs" style="margin:6px 0 0;">owner: ${p.user_id} · public: ${p.is_public ? "sí" : "no"}</p>
          </div>
          <button class="btn-primary del-pl">🗑️</button>
        </div>
      `;

      row.querySelector(".del-pl").onclick = async () => {
        if (!confirm(`¿Borrar playlist "${p.name}"?`)) return;
        await fetch(`/api/admin/playlists/${p.id}`, { method: "DELETE" });
        row.remove();
      };

      playlistsList.appendChild(row);
    });
  }
});