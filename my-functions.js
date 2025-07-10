console.log("my-functions.js loaded");

function hideMain() {
  const main = document.querySelector("main"); // HIDE main
  if (main) main.style.display = "none";
}

function extractTitle(doc) {
  return doc.querySelector(".entry-title a")?.innerText.trim() || "No title";
}

function extractCreators(doc) {
  const paragraphs = doc.querySelectorAll("p");
  const creators = Array.from(paragraphs)
    .filter((p) => p.innerText.startsWith("CV:"))
    .map((p) => p.innerText.slice(3).trim());

  if (creators.length === 1) return creators[0];
  if (creators.length > 1)
    return `${creators[0]} + ${creators.length - 1} others`;
  return "Unknown";
}

function getImage(doc) {
  const img = doc.querySelector(".op-square a img");
  if (!img) return null;

  if (img.hasAttribute("data-src")) {
    img.src = img.getAttribute("data-src");
  }

  return img;
}

// function createImgCard({ title, creatorText, img, link }) {
//   const imgCard = document.createElement("a");
//   imgCard.className = "img-card";
//   imgCard.href = link;

//   imgCard.appendChild(img);

//   const authorEl = document.createElement("div");
//   authorEl.className = "img-author";
//   authorEl.textContent = creatorText;
//   imgCard.appendChild(authorEl);

//   const info = document.createElement("div");
//   info.className = "img-info";

//   const titleEl = document.createElement("div");
//   titleEl.className = "img-title";
//   titleEl.textContent = title;
//   info.appendChild(titleEl);

//   imgCard.appendChild(info);
//   return imgCard;
// }

function createImgCard({ title, creatorText, img, link }) {
  const imgCard = document.createElement("a");
  imgCard.className = "img-card";
  imgCard.href = link;

  // Style card as vertical stack
  imgCard.style.display = "flex";
  imgCard.style.flexDirection = "column";
  imgCard.style.textDecoration = "none";
  imgCard.style.color = "inherit";
  imgCard.style.width = "100%";
  imgCard.style.maxWidth = "460px"; // mobile width limit

  // Style image (full width)
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.objectFit = "cover";
  // img.style.borderRadius = "8px"; // optional rounded corners
  imgCard.appendChild(img);

  // Title element
  const titleEl = document.createElement("div");
  titleEl.className = "img-title";
  titleEl.textContent = title;
  titleEl.style.fontWeight = "600";
  titleEl.style.fontSize = "16px";
  titleEl.style.marginTop = "8px";
  titleEl.style.marginBottom = "4px";
  titleEl.style.overflow = "hidden";
  titleEl.style.textOverflow = "ellipsis";
  titleEl.style.whiteSpace = "nowrap";

  imgCard.appendChild(titleEl);

  // Author element
  const authorEl = document.createElement("div");
  authorEl.className = "img-author2";
  authorEl.textContent = creatorText;
  authorEl.style.fontSize = "14px";
  authorEl.style.color = "#606060"; // gray text like YouTube

  imgCard.appendChild(authorEl);

  return imgCard;
}

function processCard(card, grid) {
  const titleAnchor = card.querySelector(".entry-title a");
  if (!titleAnchor) return;

  const title = extractTitle(card);
  const creatorText = extractCreators(card);
  const img = getImage(card);
  if (!img) return;

  const imgCard = createImgCard({
    title,
    creatorText,
    img,
    link: titleAnchor.href,
  });
  grid.appendChild(imgCard);
}

// Time formatter
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const hh = h > 0 ? h.toString().padStart(2, "0") + ":" : "";
  const mm = (h > 0 ? m.toString().padStart(2, "0") : m) + ":";
  const ss = s.toString().padStart(2, "0");
  return hh + mm + ss;
}

function createPlaybackControls() {
  const playbackControls = document.createElement("div");
  playbackControls.innerHTML = `
         <div id="player-controls" style="display: flex; flex-direction: column; align-items: center; font-family: sans-serif; gap: 10px; padding: 10px;">

        <div id="player-controls" style="display: flex; gap: 12px; align-items: center; justify-content: center; font-family: sans-serif;">
  <button id="rewind-60">⏪ -1 min</button>
  <button id="rewind-10">◀ -10 sec</button>
  <button id="play-pause">▶️ Play</button>
  <button id="forward-10">+10 sec ▶</button>
  <button id="forward-60">+1 min ⏩</button>
</div>
<div id="loop-container"></div>
<div class="slider-wrapper">
  <input type="range" id="seek-slider" value="0" min="0" max="100" step="0.1">
</div>
<div id="player-time">00:00 / 00:00</div>
</div>`;
  return playbackControls;
}

// For Loop Functionality
function createLoopControls(video) {
  let loopStart = null;
  let loopEnd = null;
  let looping = false;

  const btnStart = document.createElement("button");

  btnStart.textContent = "00:00:00";
  btnStart.onclick = () => {
    loopStart = video.currentTime;
    btnStart.textContent = formatTime(loopStart);
  };

  const btnEnd = document.createElement("button");

  btnEnd.textContent = "00:00:00";
  btnEnd.onclick = () => {
    loopEnd = video.currentTime;
    btnEnd.textContent = formatTime(loopEnd);
  };

  const btnToggle = document.createElement("button");
  btnToggle.textContent = "Loop";
  btnToggle.style.backgroundColor = "#555"; // default (inactive)
  btnToggle.style.color = "white";
  btnToggle.style.border = "none";
  btnToggle.style.padding = "6px 12px";
  btnToggle.style.borderRadius = "4px";
  btnToggle.style.cursor = "pointer";

  btnToggle.onclick = () => {
    looping = !looping;
    if (looping) {
      btnToggle.style.backgroundColor = "green";
    } else {
      btnToggle.style.backgroundColor = "#555";
    }
  };

  [btnStart, btnEnd, btnToggle].forEach((btn) => {
    btn.style.padding = "6px";
    btn.style.background = "#444";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.color = "white";
    btn.style.cursor = "pointer";
    btn.style.outline = "none";
  });

  video.addEventListener("timeupdate", () => {
    if (looping && loopStart !== null && loopEnd !== null) {
      if (video.currentTime >= loopEnd) {
        video.currentTime = loopStart;
        video.play();
      }
    }
  });

  return { btnStart, btnEnd, btnToggle };
}

// For Interacting with playback buttons
function addPlaybackListeners(video) {
  const $ = (id) => document.getElementById(id);

  const controls = {
    timeDisplay: $("player-time"),
    playPause: $("play-pause"),
    seekSlider: $("seek-slider"),
    loopContainer: $("loop-container"),
  };

  [
    ["rewind-60", -60],
    ["rewind-10", -10],
    ["forward-10", 10],
    ["forward-60", 60],
  ].forEach(([id, offset]) =>
    $(id)?.addEventListener(
      "click",
      () =>
        (video.currentTime = Math.min(
          video.duration,
          Math.max(0, video.currentTime + offset)
        ))
    )
  );

  controls.playPause?.addEventListener("click", () => {
    const playing = !video.paused;
    controls.playPause.textContent = playing ? "▶️ Play" : "⏸ Pause";
    playing ? video.pause() : video.play();
  });

  // 🎞 Update time + slider
  video.addEventListener("timeupdate", () => {
    const percent = (video.currentTime / video.duration) * 100;
    if (!controls.seekSlider.dragging) {
      controls.seekSlider.value = percent;
      updateSliderFill(percent);
    }
    if (controls.timeDisplay) {
      controls.timeDisplay.textContent = `${formatTime(
        video.currentTime
      )} / ${formatTime(video.duration)}`;
    }
  });

  // 👆 Slider interaction
  controls.seekSlider.addEventListener("input", () => {
    const percent = controls.seekSlider.value;
    video.currentTime = (percent / 100) * video.duration;
    updateSliderFill(percent);
  });
  ["mousedown", "touchstart"].forEach((evt) =>
    controls.seekSlider.addEventListener(
      evt,
      () => (controls.seekSlider.dragging = true)
    )
  );
  ["mouseup", "touchend"].forEach((evt) =>
    controls.seekSlider.addEventListener(
      evt,
      () => (controls.seekSlider.dragging = false)
    )
  );

  // 🎨 Slider fill
  function updateSliderFill(percent) {
    controls.seekSlider.style.backgroundImage = `
    linear-gradient(to right, #08f 0%, #08f ${percent}%, #444 ${percent}%, #444 100%)`;
  }

  return {
    loopContainer: controls.loopContainer,
    seekSlider: controls.seekSlider,
    updateSliderFill,
  };
}
