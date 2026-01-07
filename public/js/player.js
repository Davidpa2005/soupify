const Player = (() => {
  let audio = null;
  let queue = [];
  let currentIndex = -1;
  let onSongChange = () => {};
  console.log("✅ PLAYER LOADED v=20260104");

  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('ended', () => next());

    // ✅ Si hay errores de carga del audio, verás el motivo
    audio.addEventListener('error', () => {
      const err = audio.error;
      console.error("❌ Audio error:", err);
      alert("Error cargando audio (mira consola/Network).");
    });
  }

  function getAudioUrl(song) {
    if (!song) return null;
    return (
      song.audio_url ||
      song.audioUrl ||
      song.preview_url ||
      song.previewUrl ||
      song.audio_file ||
      song.audio_path ||
      song.file_url ||
      null
    );
  }

  function setQueue(newQueue, startIndex = 0) {
    ensureAudio();
    queue = Array.isArray(newQueue) ? newQueue.slice() : [];
    currentIndex = Math.min(Math.max(startIndex, 0), queue.length - 1);
    loadCurrent(false);
    renderQueue();
  }

  async function registerPlay(song, source, playlistId) {
    try {
      await fetch(`/api/play/${song.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source || 'catalog',
          playlist_id: playlistId || null
        })
      });
    } catch (e) {}
  }

async function loadCurrent(autoplay = true, meta = {}) {
  if (queue.length === 0) return;

  // Si currentIndex es inválido, ponlo a 0
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= queue.length) currentIndex = queue.length - 1;

  // ✅ Busca una canción con audio_url empezando desde currentIndex
  let idx = currentIndex;
  let tries = 0;

  while (tries < queue.length) {
    const song = queue[idx];
    if (song && song.audio_url && String(song.audio_url).trim() !== "") {
      // Encontrada
      currentIndex = idx;
      ensureAudio();
      audio.src = song.audio_url;
      audio.load(); // recomendado
      onSongChange(song, currentIndex);
      await registerPlay(song, meta.source, meta.playlist_id);

      if (autoplay) play();
      renderQueue();
      return;
    }
    idx = (idx + 1) % queue.length;
    tries++;
  }

  // ❌ Ninguna tiene audio
  alert("No hay ninguna canción con preview (audio_url) en esta lista.");
}

  // ✅ AQUÍ ESTÁ LA CLAVE: capturar el error real
function play() {
  ensureAudio();
  console.log("▶ play() src =", audio.src);

  const p = audio.play();
  if (p && typeof p.catch === "function") {
    p.catch((e) => {
      console.error("❌ audio.play() rechazado:", e);
      alert("No se pudo reproducir. Mira consola (error de play) + Network (audio).");
    });
  }
}

  function pause() { ensureAudio(); audio.pause(); }
  function stop() { ensureAudio(); audio.pause(); audio.currentTime = 0; }

  function next(meta = {}) {
    if (queue.length === 0) return;
    currentIndex = (currentIndex + 1) % queue.length;
    loadCurrent(true, meta);
  }

  function prev(meta = {}) {
    if (queue.length === 0) return;
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
    loadCurrent(true, meta);
  }

  function setVolume(v) { ensureAudio(); audio.volume = Math.min(1, Math.max(0, v)); }
  function toggleMute() { ensureAudio(); audio.muted = !audio.muted; }

  function bindUI() {
    ensureAudio();
    const wrap = document.getElementById('globalPlayer');
    if (!wrap) return;

    const title = wrap.querySelector('#gpTitle');
    const artist = wrap.querySelector('#gpArtist');
    const cover = wrap.querySelector('#gpCover');

    const btnPlay = wrap.querySelector('#gpPlay');
    const btnPause = wrap.querySelector('#gpPause');
    const btnStop = wrap.querySelector('#gpStop');
    const btnPrev = wrap.querySelector('#gpPrev');
    const btnNext = wrap.querySelector('#gpNext');
    const progress = wrap.querySelector('#gpProgress');
    const time = wrap.querySelector('#gpTime');
    const vol = wrap.querySelector('#gpVolume');
    const mute = wrap.querySelector('#gpMute');

    btnPlay.onclick = () => play();
    btnPause.onclick = () => pause();
    btnStop.onclick = () => stop();
    btnPrev.onclick = () => prev();
    btnNext.onclick = () => next();

    vol.oninput = () => setVolume(Number(vol.value));
    mute.onclick = () => toggleMute();

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      progress.value = (audio.currentTime / audio.duration) * 100;

      const mmss = (t) => {
        const m = Math.floor(t / 60);
        const s = String(Math.floor(t % 60)).padStart(2,'0');
        return `${m}:${s}`;
      };
      time.textContent = `${mmss(audio.currentTime)} / ${mmss(audio.duration)}`;
    });

    progress.oninput = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    };

    onSongChange = (song) => {
      title.textContent = song.title || '—';
      artist.textContent = song.artist || '';
      cover.src = song.cover_url || '/assets/logo.png';
    };
  }

  function renderQueue() {
    const q = document.getElementById('gpQueue');
    if (!q) return;
    q.innerHTML = '';

    queue.forEach((song, idx) => {
      const li = document.createElement('li');
      li.className = 'gp-queue-item' + (idx === currentIndex ? ' active' : '');
      li.textContent = `${song.title} · ${song.artist}`;
      li.onclick = () => {
        currentIndex = idx;
        loadCurrent(true);
      };
      q.appendChild(li);
    });
  }

  return { bindUI, setQueue, play, pause, stop, next, prev };
})();

window.Player = Player;