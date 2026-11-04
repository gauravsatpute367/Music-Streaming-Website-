const tracks = [
  { id: "khidki", title: "Khidki Se Aati Dhoop", artist: "Aarohi Sen", language: "Hindi", mood: "Easy mornings", duration: 142, cover: "cover-amber", symbol: "☼", root: 62, scale: [0, 2, 4, 7, 9], bpm: 82, waveform: "sine" },
  { id: "pahate", title: "Pahatecha Vaara", artist: "Neel Kulkarni", language: "Marathi", mood: "Slow living", duration: 158, cover: "cover-blue", symbol: "≈", root: 57, scale: [0, 2, 5, 7, 9], bpm: 76, waveform: "triangle" },
  { id: "smallhours", title: "The Small Hours", artist: "June & The Satellites", language: "English", mood: "After hours", duration: 176, cover: "cover-plum", symbol: "☾", root: 60, scale: [0, 3, 5, 7, 10], bpm: 72, waveform: "sine" },
  { id: "manat", title: "Manatla Paus", artist: "Ira Deshmukh", language: "Marathi", mood: "Soft focus", duration: 151, cover: "cover-green", symbol: "❋", root: 55, scale: [0, 2, 3, 7, 9], bpm: 88, waveform: "triangle" },
  { id: "paperplanes", title: "Paper Planes at 2AM", artist: "Milo Park", language: "English", mood: "After hours", duration: 189, cover: "cover-indigo", symbol: "✧", root: 65, scale: [0, 2, 4, 7, 11], bpm: 92, waveform: "sine" },
  { id: "chandni", title: "Chandni Ka Khat", artist: "Reva Noor", language: "Hindi", mood: "Soft focus", duration: 164, cover: "cover-rose", symbol: "☾", root: 59, scale: [0, 2, 5, 7, 9], bpm: 80, waveform: "triangle" },
  { id: "bluehour", title: "Blue Hour Bicycle", artist: "The Sunday People", language: "English", mood: "Easy mornings", duration: 147, cover: "cover-teal", symbol: "↗", root: 62, scale: [0, 2, 4, 7, 9], bpm: 96, waveform: "sine" },
  { id: "sajna", title: "Sajna, Thoda Thamb", artist: "Kabir & Meera", language: "Hindi", mood: "Slow living", duration: 173, cover: "cover-gold", symbol: "✳", root: 57, scale: [0, 3, 5, 7, 10], bpm: 84, waveform: "triangle" },
];

const state = {
  view: "discover",
  language: "All",
  query: "",
  mood: null,
  activeTrack: null,
  playing: false,
  elapsed: 0,
  liked: new Set(JSON.parse(localStorage.getItem("svara-liked") || "[]")),
  shuffle: false,
  repeat: false,
  muted: false,
  volume: 0.7,
};

const grid = document.querySelector("#track-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const audio = {
  context: null,
  timer: null,
  beat: 0,
  melodyStep: 0,
};

function getVisibleTracks() {
  let list = [...tracks];
  if (state.view === "favorites") list = list.filter((track) => state.liked.has(track.id));
  if (state.language !== "All") list = list.filter((track) => track.language === state.language);
  if (state.mood) list = list.filter((track) => track.mood === state.mood);
  const query = state.query.trim().toLocaleLowerCase();
  if (query) {
    list = list.filter((track) =>
      [track.title, track.artist, track.language, track.mood].some((value) =>
        value.toLocaleLowerCase().includes(query),
      ),
    );
  }
  if (state.view === "trending") list.sort((a, b) => a.bpm - b.bpm);
  return list;
}

function renderTracks() {
  const visible = getVisibleTracks();
  grid.innerHTML = visible.map((track) => {
    const liked = state.liked.has(track.id);
    const active = state.activeTrack?.id === track.id;
    return `
      <article class="track-card${active ? " is-playing" : ""}" data-track-id="${track.id}">
        <div class="cover-art ${track.cover}">
          <span class="cover-symbol">${track.symbol}</span>
          <span class="cover-caption">SVARA · 0${tracks.indexOf(track) + 1}</span>
          ${active && state.playing ? '<span class="playing-bars" aria-label="Now playing"><i></i><i></i><i></i></span>' : ""}
        </div>
        <div class="track-info">
          <div class="track-topline"><span class="language-label">${track.language}</span><span class="track-duration">${formatTime(track.duration)}</span></div>
          <h3 class="track-title" title="${escapeHtml(track.title)}">${escapeHtml(track.title)}</h3>
          <p class="track-artist">${escapeHtml(track.artist)}</p>
          <div class="track-bottom">
            <span class="track-mood">${escapeHtml(track.mood)}</span>
            <span class="track-actions">
              <button class="icon-button card-like${liked ? " liked" : ""}" data-like="${track.id}" aria-label="${liked ? "Unlike" : "Like"} ${escapeHtml(track.title)}">${liked ? "♥" : "♡"}</button>
              <button class="card-play" data-play="${track.id}" aria-label="${active && state.playing ? "Pause" : "Play"} ${escapeHtml(track.title)}">${active && state.playing ? "Ⅱ" : "▶"}</button>
            </span>
          </div>
        </div>
      </article>`;
  }).join("");
  grid.hidden = visible.length === 0;
  emptyState.hidden = visible.length > 0;
  document.querySelector("#section-title").innerHTML =
    state.view === "favorites" ? 'Your favorites<span>.</span>' :
      state.view === "trending" ? 'Slow it down, or speed it up<span>.</span>' :
        state.mood ? `${escapeHtml(state.mood)}<span>.</span>` :
          state.language !== "All" ? `${state.language} sounds<span>.</span>` :
            state.query ? "A little something for you<span>.</span>" : 'Made for this moment<span>.</span>';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2300);
}

function updatePlayer() {
  const track = state.activeTrack;
  document.querySelector("#player-title").textContent = track?.title || "Pick a little something";
  document.querySelector("#player-artist").textContent = track?.artist || "Your next favorite is waiting";
  document.querySelector("#player-cover").className = `mini-cover ${track?.cover || "cover-amber"}`;
  document.querySelector("#player-cover").innerHTML = `<span>${track?.symbol || "✳"}</span>`;
  document.querySelector("#play-button").textContent = state.playing ? "Ⅱ" : "▶";
  document.querySelector("#play-button").setAttribute("aria-label", state.playing ? "Pause" : "Play");
  document.querySelector("#total-time").textContent = track ? formatTime(track.duration) : "0:00";
  document.querySelector("#elapsed-time").textContent = formatTime(state.elapsed);
  const progress = document.querySelector("#progress-slider");
  progress.value = track ? Math.min(100, (state.elapsed / track.duration) * 100) : 0;
  progress.style.background = `linear-gradient(to right, #e9b68f ${progress.value}%, #44403c ${progress.value}%)`;
  const like = document.querySelector("#player-like");
  const liked = track && state.liked.has(track.id);
  like.textContent = liked ? "♥" : "♡";
  like.classList.toggle("liked", Boolean(liked));
  like.setAttribute("aria-label", liked ? "Unlike this track" : "Like this track");
}

function ensureAudio() {
  if (!audio.context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      showToast("Your browser does not support audio previews.");
      return false;
    }
    audio.context = new AudioContext();
  }
  if (audio.context.state === "suspended") audio.context.resume();
  return true;
}

function note(frequency, start, duration, waveform, loudness, detune = 0) {
  const context = audio.context;
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const master = context.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.setValueAtTime(detune, start);
  master.gain.setValueAtTime(state.muted ? 0 : state.volume, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, loudness), start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(master);
  master.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function midiFrequency(noteNumber) {
  return 440 * (2 ** ((noteNumber - 69) / 12));
}

function playBeat() {
  const track = state.activeTrack;
  if (!track || !audio.context) return;
  const now = audio.context.currentTime;
  const beat = audio.beat;
  const scale = track.scale;
  if (beat % 2 === 0) {
    const degree = [0, 2, 4, 3][Math.floor(beat / 8) % 4];
    const octave = beat % 8 === 0 ? 12 : 0;
    const melodyNote = track.root + 12 + scale[degree];
    note(midiFrequency(melodyNote + octave), now, 0.42, track.waveform, 0.12);
    audio.melodyStep += 1;
  }
  const bassRoot = track.root + [0, 0, 5, 3][Math.floor(beat / 8) % 4];
  note(midiFrequency(bassRoot - 12), now, 0.32, "sine", 0.15);
  if (beat % 4 === 0) {
    const chord = [0, 2, 4].map((degree) => midiFrequency(track.root + scale[degree] + 12));
    chord.forEach((frequency, index) => note(frequency, now, 1.7, "sine", index === 0 ? 0.026 : 0.016, index * 3));
  }
  if (beat % 2 === 1) {
    note(midiFrequency(track.root + 36), now, 0.055, "sine", 0.018);
  }
  audio.beat += 1;
}

function startAudio() {
  if (!ensureAudio()) return;
  clearInterval(audio.timer);
  audio.beat = 0;
  playBeat();
  audio.timer = setInterval(() => {
    if (!state.playing) return;
    playBeat();
    state.elapsed += (60_000 / state.activeTrack.bpm) / 2 / 1_000;
    if (state.elapsed >= state.activeTrack.duration) {
      if (state.repeat) state.elapsed = 0;
      else nextTrack();
    }
    updatePlayer();
  }, (60_000 / state.activeTrack.bpm) / 2);
}

function playTrack(track) {
  if (state.activeTrack?.id === track.id && state.playing) {
    pauseTrack();
    return;
  }
  if (state.activeTrack?.id !== track.id) state.elapsed = 0;
  state.activeTrack = track;
  state.playing = true;
  startAudio();
  updatePlayer();
  renderTracks();
}

function pauseTrack() {
  state.playing = false;
  clearInterval(audio.timer);
  updatePlayer();
  renderTracks();
}

function nextTrack() {
  const list = getVisibleTracks().length ? getVisibleTracks() : tracks;
  if (!list.length) return;
  let index = list.findIndex((track) => track.id === state.activeTrack?.id);
  index = state.shuffle ? Math.floor(Math.random() * list.length) : (index + 1) % list.length;
  state.activeTrack = list[index];
  state.elapsed = 0;
  state.playing = true;
  startAudio();
  updatePlayer();
  renderTracks();
}

function previousTrack() {
  if (state.elapsed > 4) {
    state.elapsed = 0;
    if (state.playing) startAudio();
    updatePlayer();
    return;
  }
  const list = getVisibleTracks().length ? getVisibleTracks() : tracks;
  let index = list.findIndex((track) => track.id === state.activeTrack?.id);
  index = (index - 1 + list.length) % list.length;
  state.activeTrack = list[index];
  state.elapsed = 0;
  state.playing = true;
  startAudio();
  updatePlayer();
  renderTracks();
}

function toggleLike(id) {
  if (state.liked.has(id)) state.liked.delete(id);
  else state.liked.add(id);
  localStorage.setItem("svara-liked", JSON.stringify([...state.liked]));
  renderTracks();
  updatePlayer();
}

function setLanguage(language) {
  state.view = "discover";
  state.language = language;
  state.mood = null;
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.view === "discover"),
  );
  document.querySelectorAll(".filter-chip").forEach((chip) =>
    chip.classList.toggle("selected", chip.dataset.language === language),
  );
  renderTracks();
}

function changeView(view) {
  state.view = view;
  state.mood = null;
  state.language = "All";
  state.query = "";
  searchInput.value = "";
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.view === view),
  );
  document.querySelectorAll(".filter-chip").forEach((chip) =>
    chip.classList.toggle("selected", chip.dataset.language === "All"),
  );
  renderTracks();
  document.querySelector("#section-title").scrollIntoView({ behavior: "smooth", block: "center" });
}

function setMood(mood) {
  state.view = "discover";
  state.mood = mood;
  state.language = "All";
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.view === "discover"),
  );
  document.querySelectorAll(".filter-chip").forEach((chip) =>
    chip.classList.toggle("selected", chip.dataset.language === "All"),
  );
  renderTracks();
  document.querySelector("#music-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function refreshClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.querySelector("#greeting").innerHTML = `${greeting}<span class="heading-period">.</span>`;
  document.querySelector("#current-date").textContent =
    new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(now).toUpperCase();
  document.querySelector("#updated-time").textContent =
    `UPDATED ${new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(now)}`;
}

function createPlaylist() {
  const name = window.prompt("Give your playlist a name");
  if (!name?.trim()) return;
  const item = document.createElement("button");
  item.className = "library-item";
  item.innerHTML = `<span class="library-dot dot-peach"></span> ${escapeHtml(name.trim())}`;
  item.addEventListener("click", () => showToast("Your new playlist is ready for songs."));
  document.querySelector(".library-list").append(item);
  showToast(`“${name.trim()}” is ready for its first song.`);
}

grid.addEventListener("click", (event) => {
  const likeButton = event.target.closest("[data-like]");
  if (likeButton) {
    toggleLike(likeButton.dataset.like);
    return;
  }
  const playButton = event.target.closest("[data-play]");
  if (playButton) {
    const track = tracks.find((item) => item.id === playButton.dataset.play);
    if (track) playTrack(track);
  }
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => setLanguage(chip.dataset.language));
});
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => changeView(link.dataset.view));
});
document.querySelectorAll("[data-mood]").forEach((button) => {
  button.addEventListener("click", () => setMood(button.dataset.mood));
});
searchInput.addEventListener("input", () => {
  state.view = "discover";
  state.query = searchInput.value;
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.view === "discover"),
  );
  renderTracks();
});
document.querySelector("#clear-filters").addEventListener("click", () => {
  state.view = "discover";
  state.language = "All";
  state.mood = null;
  state.query = "";
  searchInput.value = "";
  document.querySelectorAll(".nav-link").forEach((link) =>
    link.classList.toggle("active", link.dataset.view === "discover"),
  );
  setLanguage("All");
});
document.querySelector("#hero-play").addEventListener("click", () => playTrack(tracks[0]));
document.querySelector("#hero-explore").addEventListener("click", () =>
  document.querySelector("#music-section").scrollIntoView({ behavior: "smooth" }),
);
document.querySelector("#see-all").addEventListener("click", () => changeView("trending"));
document.querySelector("#play-button").addEventListener("click", () => {
  if (!state.activeTrack) playTrack(tracks[0]);
  else if (state.playing) pauseTrack();
  else {
    state.playing = true;
    startAudio();
    updatePlayer();
    renderTracks();
  }
});
document.querySelector("#next-button").addEventListener("click", nextTrack);
document.querySelector("#previous-button").addEventListener("click", previousTrack);
document.querySelector("#player-like").addEventListener("click", () => {
  if (state.activeTrack) toggleLike(state.activeTrack.id);
});
document.querySelector("#shuffle-button").addEventListener("click", (event) => {
  state.shuffle = !state.shuffle;
  event.currentTarget.classList.toggle("active", state.shuffle);
  showToast(state.shuffle ? "Shuffle is on." : "Shuffle is off.");
});
document.querySelector("#repeat-button").addEventListener("click", (event) => {
  state.repeat = !state.repeat;
  event.currentTarget.classList.toggle("active", state.repeat);
  showToast(state.repeat ? "Repeat is on." : "Repeat is off.");
});
document.querySelector("#progress-slider").addEventListener("input", (event) => {
  if (!state.activeTrack) return;
  state.elapsed = (Number(event.target.value) / 100) * state.activeTrack.duration;
  updatePlayer();
});
document.querySelector("#volume-slider").addEventListener("input", (event) => {
  state.volume = Number(event.target.value) / 100;
  if (state.muted && state.volume > 0) state.muted = false;
});
document.querySelector("#volume-icon").addEventListener("click", () => {
  state.muted = !state.muted;
  document.querySelector("#volume-icon").textContent = state.muted ? "×" : "◖";
});
document.querySelector("#radio-button").addEventListener("click", () => {
  const candidates = tracks.filter((track) => track.id !== state.activeTrack?.id);
  playTrack(candidates[Math.floor(Math.random() * candidates.length)]);
});
document.querySelector("#new-playlist").addEventListener("click", createPlaylist);
document.querySelector("#queue-button").addEventListener("click", () => showToast("Your queue is this collection of original previews."));
document.querySelector("#profile-button").addEventListener("click", () => showToast("You’re listening as a guest. Your favorites stay on this device."));
document.querySelector("#back-button").addEventListener("click", () => window.history.back());
document.querySelector("#forward-button").addEventListener("click", () => window.history.forward());

const menuButton = document.querySelector("#menu-button");
const sidebar = document.querySelector("#sidebar");
const backdrop = document.querySelector("#mobile-backdrop");
function closeMenu() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
}
menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  backdrop.classList.toggle("show");
});
backdrop.addEventListener("click", closeMenu);
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    closeMenu();
    searchInput.blur();
  }
});

refreshClock();
setInterval(refreshClock, 60_000);
renderTracks();
updatePlayer();
