document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const grid = document.getElementById("songsGrid");
  const status = document.getElementById("songsStatus");

  const modal = document.getElementById("playlistModal");
  const list = document.getElementById("playlistList");
  const closeBtn = document.getElementById("closeModal");
  const createBtn = document.getElementById("createPlaylistBtn");
  const newNameInput = document.getElementById("newPlaylistName");

  let currentSongFromDB = null;

  status.textContent = "Busca una canción, artista o álbum (iTunes).";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    fetchSongsFromItunes(query);
  });

  async function fetchSongsFromItunes(query) {
    try {
      status.textContent = "Buscando en iTunes…";
      grid.innerHTML = "";

      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`;
      const resp = await fetch(url);
      const data = await resp.json();
      const itunesSongs = data.results || [];

      if (itunesSongs.length === 0) {
        status.textContent = "No se han encontrado canciones.";
        return;
      }

      const mapped = itunesSongs.map((s) => ({
        title: s.trackName,
        artist: s.artistName,
        album: s.collectionName || null,
        duration_ms: s.trackTimeMillis || 0,
        cover_url: s.artworkUrl100 || null,
        genre: s.primaryGenreName || null,
        purpose: null,
        year: null,
        license: "iTunes preview (educativo)",
        audio_url: s.previewUrl || null
      }));

      await fetch("/api/import-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs: mapped })
      });

      const dbResp = await fetch(`/api/songs?q=${encodeURIComponent(query)}`);
      const dbSongs = await dbResp.json();

      status.textContent = `Resultados guardados en tu catálogo: ${dbSongs.length}`;
      renderSongs(dbSongs);
    } catch (err) {
      console.error(err);
      status.textContent = "Error al cargar canciones.";
    }
  }

  function msToMMSS(ms) {
    const m = Math.floor(ms / 60000);
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${m}:${s}`;
  }

  function renderSongs(songs) {
  grid.innerHTML = "";

  songs.forEach((song, idx) => {
    const card = document.createElement("article");
    card.className = "song-card";

    card.innerHTML = `
      <div class="song-cover-wrap">
        <img src="${song.cover_url || "/assets/logo.png"}" class="song-cover" />
      </div>

      <div class="song-top-row">
        <span class="song-badge">${song.genre || "Song"}</span>
        <span class="song-duration">${msToMMSS(song.duration_ms || 0)}</span>
      </div>

      <div class="song-info">
        <h4 class="song-title"></h4>
        <p class="song-artist"></p>
        <p class="song-album"></p>
      </div>

      <div class="song-actions">
        <button class="btn-primary play-btn">▶ Reproducir</button>
        <button class="playlist-btn">➕ Playlist</button>
        <button class="fav-btn">❤️</button>
      </div>
    `;

    card.querySelector(".song-title").textContent = song.title;
    card.querySelector(".song-artist").textContent = song.artist;
    card.querySelector(".song-album").textContent = song.album || "—";

    card.querySelector(".play-btn").onclick = () => {
      if (!window.Player) return alert("Falta cargar player.js");

      // ✅ si no hay preview, no intentes reproducir
      if (!song.audio_url || String(song.audio_url).trim() === "") {
        return alert("Esta canción no tiene preview (audio).");
      }

      window.Player.setQueue(songs, idx);
      window.Player.play();
    };

    card.querySelector(".playlist-btn").onclick = () => {
      currentSongFromDB = song;
      openPlaylistModal();
    };

    card.querySelector(".fav-btn").onclick = async () => {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_id: song.id })
      });
      alert("Favorito actualizado ✅");
    };

    grid.appendChild(card);
  });
}

  async function openPlaylistModal() {
    modal.classList.remove("hidden");
    list.innerHTML = "";
    newNameInput.value = "";

    const resp = await fetch("/api/playlists");
    const playlists = await resp.json();

    if (playlists.length === 0) {
      list.innerHTML = "<p class='songs-status'>No hay playlists. Crea una nueva 👇</p>";
    }

    playlists.forEach((p) => {
      const btn = document.createElement("div");
      btn.className = "playlist-option";
      btn.textContent = p.name;

      btn.onclick = async () => {
        await fetch(`/api/playlists/${p.id}/songs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: currentSongFromDB.id })
        });
        modal.classList.add("hidden");
        alert("Canción añadida 🎶");
      };

      list.appendChild(btn);
    });

    createBtn.onclick = async () => {
      const name = newNameInput.value.trim();
      if (!name) return;

      const created = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_public: 0 })
      }).then(r => r.json());

      await fetch(`/api/playlists/${created.id}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: currentSongFromDB.id })
      });

      modal.classList.add("hidden");
      alert("Playlist creada + canción añadida 🎶");
    };
  }

  closeBtn.onclick = () => modal.classList.add("hidden");
});