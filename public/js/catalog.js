document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const grid = document.getElementById("songsGrid");
  const status = document.getElementById("songsStatus");

  // Si no estamos en catalog.html, salir
  if (!form || !input || !grid || !status) return;

  let filtersWrap = document.getElementById("filtersWrap");
  if (!filtersWrap) {
    filtersWrap = document.createElement("div");
    filtersWrap.id = "filtersWrap";
    filtersWrap.style.display = "flex";
    filtersWrap.style.gap = "10px";
    filtersWrap.style.margin = "10px 0";
    document.querySelector(".home-card").insertBefore(filtersWrap, grid);
  }

  filtersWrap.innerHTML = `
    <select id="genreFilter"><option value="">Género (todos)</option></select>
    <select id="purposeFilter"><option value="">Propósito (todos)</option></select>
    <select id="sortFilter">
      <option value="">Orden: recientes</option>
      <option value="most_played">Más reproducidas</option>
    </select>
    <button id="refreshBtn" class="btn-primary">Aplicar</button>
  `;

  const genreFilter = document.getElementById("genreFilter");
  const purposeFilter = document.getElementById("purposeFilter");
  const sortFilter = document.getElementById("sortFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  const filters = await fetch("/api/songs/filters").then(r => r.json());
  (filters.genres || []).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreFilter.appendChild(opt);
  });
  (filters.purposes || []).forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    purposeFilter.appendChild(opt);
  });

  async function loadSongs() {
    const q = input.value.trim();
    const genre = genreFilter.value;
    const purpose = purposeFilter.value;
    const sort = sortFilter.value;

    const url = new URL(location.origin + "/api/songs");
    if (q) url.searchParams.set("q", q);
    if (genre) url.searchParams.set("genre", genre);
    if (purpose) url.searchParams.set("purpose", purpose);
    if (sort) url.searchParams.set("sort", sort);

    status.textContent = "Cargando canciones…";
    const songs = await fetch(url).then(r => r.json());
    status.textContent = `Resultados: ${songs.length}`;
    renderSongs(songs);
  }

  function msToMMSS(ms) {
    const m = Math.floor(ms / 60000);
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${m}:${s}`;
  }

  function renderSongs(songs) {
    grid.innerHTML = "";
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
          <span class="song-duration">${msToMMSS(song.duration_ms || 0)}</span>
        </div>
        <div class="song-info">
          <h4 class="song-title"></h4>
          <p class="song-artist"></p>
          <p class="song-album"></p>
          <p class="song-album">Repro: ${song.play_count}</p>
        </div>
        <div class="song-actions">
          <button class="btn-primary play-btn">▶</button>
          <button class="playlist-btn">➕ Playlist</button>
          <button class="fav-btn">❤️</button>
        </div>
      `;

      card.querySelector(".song-title").textContent = song.title;
      card.querySelector(".song-artist").textContent = song.artist;
      card.querySelector(".song-album").textContent = song.album || "—";

      card.querySelector(".play-btn").onclick = () => {
        if (!window.Player) return;
        Player.setQueue(songs, idx);
        Player.play();
      };

      card.querySelector(".playlist-btn").onclick = async () => {
        const pls = await fetch("/api/playlists").then(r => r.json());
        const name = prompt("Escribe el nombre EXACTO de tu playlist:\n" + pls.map(p => p.name).join("\n"));
        if (!name) return;

        const selected = pls.find(p => p.name === name);
        if (!selected) return alert("No existe esa playlist");

        await fetch(`/api/playlists/${selected.id}/songs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: song.id })
        });

        alert("Añadida ✅");
      };

      card.querySelector(".fav-btn").onclick = async () => {
        await fetch("/api/favorites/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: song.id })
        });
        alert("Favorito actualizado ✅");
      };

      grid.appendChild(card);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    loadSongs();
  });

  refreshBtn.onclick = () => loadSongs();

  loadSongs();
});