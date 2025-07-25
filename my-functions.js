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

  const buttonRadius = 48;

  const {
    rewind60Button,
    rewind10Button,
    playButton,
    forward10Button,
    forward60Button,
  } = (function getSvgButtons() {
    const svgColor = "rgba(255,255,255,0.6)";
    const arrowBigLeftDashSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
      viewBox="0 0 24 24" fill="currentColor" stroke=${svgColor} stroke-width="2" stroke-linecap="round" 
      stroke-linejoin="round" class="lucide lucide-arrow-big-left-dash-icon lucide-arrow-big-left-dash">
      <path d="M19 15V9"/><path d="M15 15h-3v4l-7-7 7-7v4h3v6z"/>
      </svg>`;
    const arrowBigLeftSvg = `
 <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
    viewBox="0 0 24 24" fill="currentColor" stroke=${svgColor} stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-big-left-icon lucide-arrow-big-left">
    <path d="M18 15h-6v4l-7-7 7-7v4h6v6z"/>
    </svg> `;
    const playSvg = `
  <svg id="play-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" 
    viewBox="0 0 24 24" fill="currentColor" stroke=${svgColor}
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-play-icon lucide-play">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>`;
    const pauseSvg = `
    <svg id="pause-svg" style="position:absolute; top:0; left:0; opacity:0;" xmlns="http://www.w3.org/2000/svg" width=${buttonRadius}px height=${buttonRadius}px
    viewBox="0 0 24 24" fill=${svgColor} stroke="currentColor" stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause-icon lucide-pause">
    <rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>
    </svg>`;

    const rewind60Button = `
  <button id="rewind-60" style="all: unset; cursor: pointer; width:${buttonRadius}px; height:${buttonRadius}px; border-bottom: 2px solid white;"> 
      ${arrowBigLeftDashSvg}
  </button>
`;
    const rewind10Button = `
  <button id="rewind-10" style="all: unset; cursor: pointer; width:${buttonRadius}px; height:${buttonRadius}px; border-bottom: 2px solid white;"> 
    ${arrowBigLeftSvg}
  </button>
`;
    const playButton = `
  <button  id="play-pause" style="all: unset;position: relative; cursor: pointer;width:${buttonRadius}px; height:${buttonRadius}px"> 
    ${playSvg}
    ${pauseSvg}
  </button>
`;
    const forward10Button = `
  <button id="forward-10" style="all: unset; cursor: pointer;transform: scaleX(-1);width:${buttonRadius}px; height:${buttonRadius}px; border-bottom: 2px solid white;"> 
    ${arrowBigLeftSvg}
  </button>
`;
    const forward60Button = `
  <button id="forward-60" style="all: unset; cursor: pointer;transform: scaleX(-1); width:${buttonRadius}px; height:${buttonRadius}px; border-bottom: 2px solid white;"> 
      ${arrowBigLeftDashSvg}
  </button>
`;

    return {
      rewind60Button,
      rewind10Button,
      playButton,
      forward10Button,
      forward60Button,
    };
  })();

  const playbackButtonsHTML = `
      <div  style="display: flex; gap: 12px; align-items: center; justify-content: center; font-family: sans-serif;">
      <div id='playback-button' >
        ${rewind60Button}
        <h6 style="color:white;font-size:10px;">-1:</h6>
      </div>
      <div id='playback-button'>
        ${rewind10Button}
        <h6 style="color:white;font-size:10px;">-:1</h6>
      </div>
      <div id='playback-button'>
        ${playButton}
        <h6 style="color:white;font-size:10px;opacity:0;">-:1</h6>
      </div>
      <div id='playback-button'>
        ${forward10Button}
        <h6 style="color:white;font-size:10px;">-:1</h6>
      </div>
      <div id='playback-button'>
        ${forward60Button}
        <h6 style="color:white;font-size:10px;">-1:</h6>
      </div>
      </div>
      `;

  const playerTimeHTML = `<div id="player-time">00:00 / 00:00</div>`;

  const sliderHTML = `<div class="slider-wrapper">
        <input type="range" id="seek-slider" value="0" min="0" max="100" step="0.1">
      </div>`;

  const loopControlHTML = `<div id="loop-container"></div>`;

  playbackControls.innerHTML = `
    <div id="player-controls" >
      <div> 
        ${playbackButtonsHTML}
      </div>
      ${loopControlHTML}
      ${sliderHTML}
    ${playerTimeHTML}
  </div>
</div>`;
  return playbackControls;
}

// For Loop Functionality
function createLoopControls(video) {
  let loopStart = null;
  let loopEnd = null;
  let looping = false;

  const btnStart = document.createElement("button");

  btnStart.textContent = "--:--";
  btnStart.onclick = () => {
    loopStart = video.currentTime;
    btnStart.textContent = formatTime(loopStart);
  };

  const btnEnd = document.createElement("button");

  btnEnd.textContent = "--:--";
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
    playing ? video.pause() : video.play();

    console.log("video paused?", video.paused);
    if ($("play-svg")) $("play-svg").style.opacity = !video.paused ? 0 : 1;
    if ($("pause-svg")) $("pause-svg").style.opacity = !video.paused ? 1 : 0;
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

function customRound(num) {
  const rounded = Math.ceil(num / 1000) * 1000;
  return rounded;
}

function customRoundWithZero(strNum) {
  let num = parseInt(strNum, 10);
  let rounded = Math.ceil(num / 1000) * 1000;
  return rounded.toString().padStart(strNum.length, "0");
}

function getDLSiteUrl(rjCode) {
  const { rjText, rjNumber } = {
    rjText: rjCode.slice(0, 2),
    rjNumber: rjCode.slice(2),
  };

  const firstUrlCode = "RJ" + customRoundWithZero(rjNumber);

  return firstUrlCode;
}

function extractRJCode() {
  const paragraphs = document.querySelectorAll("p");
  const rjCodeElem = Array.from(document.querySelectorAll("p")).filter((p) =>
    p.innerText.startsWith("RJ Code:")
  );
  if (rjCodeElem) return rjCodeElem[0]?.innerText?.split(" ")[2];
  else return "No RJ Code";
}

function changeLogo(logo) {
  const okayuAhe =
    "https://raw.githubusercontent.com/okashi-kunai/jp-asmr-viewer/refs/heads/main/public/okayu-transparent.png";
  logo.src = okayuAhe;
  logo.srcset = okayuAhe;
  logo.style.width = "200px";
  logo.style.height = "auto";
  logo.sizes = null;
  logo.onclick = function () {
    window.location.href = "/";
  };
  logo.style.cursor = "pointer";
  document.querySelector("header").appendChild(logo);
}

const findElement = (elem) => document.querySelector(elem);
const createElement = (elem) => document.createElement(elem);

function addVideoProgressOverlay() {
  const videoImg = findElement("img.fotorama__img");

  if (videoImg) {
    videoImg.className = "video-img";
    videoImg.style.width = "100%";
  }

  const wrapDiv = createElement("div");
  wrapDiv.style.position = "relative";
  wrapDiv.style.width = "fit-content";
  wrapDiv.style.margin = "0 auto";
  wrapDiv.style.borderRadius = "40px";
  wrapDiv.style.overflow = "hidden";

  // Insert the wrapper before the img
  videoImg.parentNode.insertBefore(wrapDiv, videoImg);

  // Move the img into the wrapper
  wrapDiv.appendChild(videoImg);

  const clickOverlay = document.createElement("div");
  clickOverlay.className = "click-overlay";

  const darkOverlay = document.createElement("div");
  darkOverlay.className = "dark-overlay";

  wrapDiv.appendChild(darkOverlay);
  wrapDiv.appendChild(clickOverlay);
  return { wrapDiv, clickOverlay, darkOverlay };
}

function createAudioVisualizer(video) {
  // 2. Create canvas for visualizer
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 300;
  canvas.style.display = "block";
  canvas.style.margin = "20px auto";
  canvas.style.background = "#000";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // 3. Set up Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // 4. Connect video audio to analyser
  const source = audioCtx.createMediaElementSource(video);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  // 5. Drawing loop
  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      ctx.fillStyle = `rgb(${barHeight + 100}, ${200 - barHeight}, 150)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }

  // 6. Wait until video plays to start
  video.addEventListener("play", () => {
    audioCtx.resume(); // required in some browsers
    draw();
  });
}

function injectColorThief() {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js";

  document.head.appendChild(script);
  return { script };
}

function initGradient(imageUrl) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl; // Safe for CORS

  img.style.display = "none";
  document.body.appendChild(img);

  // img.onload = () => {
  //   console.log("image loaded");
  //   const colorThief = new ColorThief();
  //   const palette = colorThief.getPalette(img, 3);

  //   const [r1, g1, b1] = palette[0];
  //   const [r2, g2, b2] = palette[1];
  //   const [r3, g3, b3] = palette[2];

  //   const bg = document.createElement("div");
  //   bg.className = "gradient-bg";
  //   bg.style.position = "fixed";
  //   bg.style.inset = "0";
  //   bg.style.zIndex = "-1";
  //   bg.style.filter = "blur(60px)";
  //   bg.style.background = `linear-gradient(135deg, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}), rgb(${r3},${g3},${b3}))`;

  //   findElement("header").appendChild(bg);
  // };
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const step = 10;
    const topColors = [],
      bottomColors = [],
      leftColors = [],
      rightColors = [];

    for (let i = 0; i < img.width; i += step) {
      topColors.push(ctx.getImageData(i, 0, 1, 1).data);
      bottomColors.push(ctx.getImageData(i, img.height - 1, 1, 1).data);
    }

    for (let i = 0; i < img.height; i += step) {
      leftColors.push(ctx.getImageData(0, i, 1, 1).data);
      rightColors.push(ctx.getImageData(img.width - 1, i, 1, 1).data);
    }

    const avg = (colors) => {
      let r = 0,
        g = 0,
        b = 0;
      colors.forEach((data) => {
        r += data[0];
        g += data[1];
        b += data[2];
      });
      const len = colors.length;
      return `rgb(${Math.round(r / len)}, ${Math.round(g / len)}, ${Math.round(
        b / len
      )})`;
    };

    const top = avg(topColors);
    const bottom = avg(bottomColors);
    const left = avg(leftColors);
    const right = avg(rightColors);
    const bg = document.createElement("div");

    // Apply gradient background
    bg.className = "gradient-bg";
    bg.style.position = "fixed";
    bg.style.inset = "0";
    bg.style.zIndex = "-1";
    bg.style.filter = "blur(60px)";
    bg.style.background = `
    linear-gradient(135deg , ${left}, ${right})
  `;
    findElement("header").appendChild(bg);
  };
}
