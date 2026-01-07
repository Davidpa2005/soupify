document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("playlistList");
  const titleEl = document.getElementById("playlistTitle");
  const songsEl = document.getElementById("playlistSongs");

  // Si no estamos en playlist.html, salir
  if (!listEl || !titleEl || !songsEl) return;

  let playlists = await fetch("/api/playlists").then(r => r.json());
  let currentPlaylistId = playlists[0]?.id || null;

  if (!currentPlaylistId) {
    titleEl.textContent = "No hay playlists creadas";
    songsEl.innerHTML = "<p class='songs-status'>Crea una playlist desde Inicio.</p>";
    return;
  }

  renderSidebar();
  await showPlaylist(currentPlaylistId);

  function renderSidebar() {
    listEl.innerHTML = "";

    playlists.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "playlist-item";

      li.innerHTML = `
        <span class="playlist-name"></span>
        <button class="delete-playlist-btn" title="Eliminar">🗑️</button>
      `;

      li.querySelector(".playlist-name").textContent = p.name || `Playlist ${p.id}`;

      li.querySelector(".playlist-name").onclick = async () => {
        currentPlaylistId = p.id;
        document.querySelectorAll(".playlist-list li").forEach(el => el.classList.remove("active"));
        li.classList.add("active");
        await showPlaylist(p.id);
      };

      li.querySelector(".delete-playlist-btn").onclick = async (e) => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar la playlist "${p.name}"?`)) return;

        await fetch(`/api/playlists/${p.id}`, { method: "DELETE" });
        playlists = await fetch("/api/playlists").then(r => r.json());
        location.reload();
      };

      listEl.appendChild(li);

      if (i === 0) li.classList.add("active");
    });
  }

  function msToMMSS(ms) {
    const m = Math.floor((ms || 0) / 60000);
    const s = String(Math.floor(((ms || 0) % 60000) / 1000)).padStart(2, "0");
    return `${m}:${s}`;
  }

  async function showPlaylist(playlistId) {
    
    let data;
    try {
      data = await fetch(`/api/playlists/${playlistId}/songs`).then(r => r.json());
    } catch (e) {
      console.error(e);
      songsEl.innerHTML = "<p class='songs-status error'>Error cargando la playlist.</p>";
      return;
    }

    // ✅ Soporta 2 formatos:
    // A) { playlist: {...}, songs: [...] }
    // B) [ ...songs ]
    const playlist = data?.playlist || playlists.find(p => p.id === playlistId) || { name: "Playlist" };
    const songs = Array.isArray(data) ? data : (data?.songs || []);

    titleEl.textContent = playlist.name || "Playlist";
    songsEl.innerHTML = "";

    if (!songs.length) {
      songsEl.innerHTML = "<p class='songs-status'>Esta playlist no tiene canciones.</p>";
      return;
    }

    if (window.Player) Player.setQueue(songs, 0);

    songs.forEach((song, idx) => {
      const card = document.createElement("article");
      card.className = "song-card";

      card.innerHTML = `
        <div class="song-cover-wrap">
          <img src="${song.cover_url || "/assets/logo.png"}" class="song-cover" />
        </div>

        <div class="song-top-row">
          <span class="song-badge">${song.genre || "Song"}</span>
          <span class="song-duration">${msToMMSS(song.duration_ms)}</span>
        </div>

        <div class="song-info">
          <h4 class="song-title"></h4>
          <p class="song-artist"></p>
          <p class="song-album"></p>
        </div>

        <div class="song-actions">
          <button class="btn-primary play-btn">▶</button>
          <button class="playlist-btn">✖ Quitar</button>
          <button class="up-btn">⬆</button>
          <button class="down-btn">⬇</button>
        </div>
      `;

      card.querySelector(".song-title").textContent = song.title || "Sin título";
      card.querySelector(".song-artist").textContent = song.artist || "—";
      card.querySelector(".song-album").textContent = song.album || "—";

      card.querySelector(".play-btn").onclick = () => {
        if (!window.Player) return;
        Player.setQueue(songs, idx);
        Player.play();
      };

      card.querySelector(".playlist-btn").onclick = async () => {
        await fetch(`/api/playlists/${playlistId}/songs/${song.id}`, { method: "DELETE" });
        await showPlaylist(playlistId);
      };

      card.querySelector(".up-btn").onclick = async () => {
        if (idx === 0) return;
        const newOrder = songs.map(s => s.id);
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        await reorder(playlistId, newOrder);
      };

      card.querySelector(".down-btn").onclick = async () => {
        if (idx === songs.length - 1) return;
        const newOrder = songs.map(s => s.id);
        [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
        await reorder(playlistId, newOrder);
      };

      songsEl.appendChild(card);
    });
  }

  async function reorder(playlistId, orderedIds) {
    await fetch(`/api/playlists/${playlistId}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_song_ids: orderedIds })
    });
    await showPlaylist(playlistId);
  }
});