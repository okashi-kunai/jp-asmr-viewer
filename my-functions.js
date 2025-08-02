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
    .filter((p) => p.innerText.startsWith("CV:"))[0]
    .innerText.slice(3)
    .split(",")
    .map((s) => s.trim());

  // if (creators.length === 1) return creators[0];
  // if (creators.length > 1)
  //   return `${creators[0]} + ${creators.length - 1} others`;
  // For some reason creators is an array of array.
  if (creators.length > 0) return creators;
  return "Unknown";
}

function getImage(doc) {
  let RJ = extractRJCode(doc);

  if (!RJ) {
    const paragraphs = doc.querySelectorAll("p");
    const titleWithRJ = Array.from(paragraphs)
      .filter((p) => p.querySelector("strong")) // only <p> with <strong>
      .map((p) => p.querySelector("strong").innerText); // get <strong>'s innerText

    const removeSquareBracketsRegex = /[\[\]]/g;

    RJ = titleWithRJ[0]
      .split(" ")
      .pop()
      .replace(removeSquareBracketsRegex, "")
      .trim();
  }

  const dlSiteImageUrl = getDLSiteImgFromRJ(RJ);
  // console.log(dlSiteImageUrl);

  const img = new Image();
  img.src = dlSiteImageUrl;

  return img;
}

function createGridCard({ title, creatorText, img, link }) {
  const gridCard = document.createElement("a");
  gridCard.className = "img-card";
  gridCard.href = link;

  // Style card as vertical stack
  gridCard.style.display = "flex";
  gridCard.style.flexDirection = "column";
  gridCard.style.textDecoration = "none";
  gridCard.style.color = "inherit";
  gridCard.style.width = "100%";
  gridCard.style.maxWidth = "460px"; // mobile width limit

  // Style image (full width)
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.objectFit = "cover";

  const skeleton = document.createElement("div");
  skeleton.className = "skeleton";

  gridCard.appendChild(skeleton);

  skeleton.style.opacity = 1;
  img.onload = () => {
    skeleton.style.opacity = 0;
    skeleton.remove();
    // setTimeout(() => skeleton.remove(), 300); // Give it time to fade out
    // continue with your logic, e.g. createBackgroundGradient(img.src)
  };

  gridCard.appendChild(img);

  // Title element
  const titleEl = document.createElement("div");
  titleEl.className = "img-title";
  titleEl.textContent = title;

  gridCard.appendChild(titleEl);

  // Author element
  const authorEl = document.createElement("div");
  // authorEl.className = "author-tag";
  // authorEl.textContent = creatorText;
  const authorTagsDiv = createElement("div");
  authorTagsDiv.className = "author-div";

  creatorText.map((creator) => {
    const newAuthorDiv = createElement("a");
    newAuthorDiv.className = "author-tag";
    newAuthorDiv.textContent = creator;
    const creatorHref = creator.toLowerCase().replace(" ", "-");
    newAuthorDiv.href = `/tag/${creatorHref}`;
    authorTagsDiv.appendChild(newAuthorDiv);
  });
  authorEl.appendChild(authorTagsDiv);

  gridCard.appendChild(authorEl);
  return gridCard;
}

function processCard(card, grid) {
  const titleAnchor = card.querySelector(".entry-title a");
  if (!titleAnchor) return;

  const title = extractTitle(card);
  const creatorText = extractCreators(card);
  const img = getImage(card);

  const gridCard = createGridCard({
    title,
    creatorText,
    img,
    link: titleAnchor.href,
  });
  grid.appendChild(gridCard);
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
      viewBox="0 0 24 24" fill="transparent" stroke=${svgColor} stroke-width="2" stroke-linecap="round" 
      stroke-linejoin="round" class="lucide lucide-arrow-big-left-dash-icon lucide-arrow-big-left-dash">
      <path d="M19 15V9"/><path d="M15 15h-3v4l-7-7 7-7v4h3v6z"/>
      </svg>`;
    const arrowBigLeftSvg = `
 <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
    viewBox="0 0 24 24" fill="transparent" stroke=${svgColor} stroke-width="2" 
    stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-big-left-icon lucide-arrow-big-left">
    <path d="M18 15h-6v4l-7-7 7-7v4h6v6z"/>
    </svg> `;
    const playSvg = `
  <svg id="play-svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" 
    viewBox="0 0 24 24" fill="transparent" stroke=${svgColor}
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-play-icon lucide-play">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>`;
    const pauseSvg = `
    <svg id="pause-svg" style="position:absolute; top:0; left:0; opacity:0;" xmlns="http://www.w3.org/2000/svg" width=${buttonRadius}px height=${buttonRadius}px
    viewBox="0 0 24 24" fill="transparent" stroke=${svgColor} stroke-width="2" 
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

  <button id="play-pause" style="all: unset; cursor: pointer;width:${buttonRadius}px; height:${buttonRadius}px; border-radius: 100%; border: 4px solid ${svgColor};padding:10px;"> 
  <div style="position: relative;">
    ${playSvg}
    ${pauseSvg}
    </div>
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
        <h6 id="playback-button-text" >-60s</h6>
      </div>
      <div id='playback-button'>
        ${rewind10Button}
        <h6 id="playback-button-text">-10s</h6>
      </div>
      <div id='playback-button'>
        ${playButton}
        <h6 id="playback-button-text" style="opacity:0;">-:1</h6>
      </div>
      <div id='playback-button'>
        ${forward10Button}
        <h6 id="playback-button-text">+10s</h6>
      </div>
      <div id='playback-button'>
        ${forward60Button}
        <h6 id="playback-button-text">+60s</h6>
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
    ${sliderHTML}
      <div> 
        ${playbackButtonsHTML}
      </div>
      ${loopControlHTML}
      
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

  btnStart.textContent = "から";
  btnStart.onclick = () => {
    loopStart = video.currentTime;
    btnStart.textContent = formatTime(loopStart);
  };

  const btnEnd = document.createElement("button");

  btnEnd.textContent = "まで";
  btnEnd.onclick = () => {
    loopEnd = video.currentTime;
    btnEnd.textContent = formatTime(loopEnd);
  };

  const btnToggle = document.createElement("button");
  // btnToggle.textContent = "Loop";
  btnToggle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" 
    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="lucide lucide-infinity-icon lucide-infinity">
    <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8"/>
    </svg>`;

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
      btnToggle.style.backgroundColor = "transparent";
    }
  };

  [btnStart, btnEnd, btnToggle].forEach((btn) => {
    btn.style.padding = "6px";
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.color = "white";
    btn.style.cursor = "pointer";
    btn.style.outline = "none";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
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
function addPlaybackListeners(video, clickOverlay, darkOverlay) {
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

  // Click overlay to progress through video
  clickOverlay.addEventListener("click", (e) => {
    const xCoord = e.offsetX; // X within the div
    console.log("Clicked X within div:", xCoord);
    let playbackDivWidth = clickOverlay.getBoundingClientRect().width;

    console.log("xCoord is", xCoord, "and total width is", playbackDivWidth);
    const percentage = (xCoord / playbackDivWidth) * 100;
    console.log(percentage);
    video.currentTime = (percentage / 100) * video.duration;
    controls.seekSlider.value = percentage;
    updateSliderFill(percentage);
  });

  // Update overlay percentage as video progresses
  let currentPercent = 0;
  video.addEventListener("timeupdate", () => {
    currentPercent = (video.currentTime / video.duration) * 100;
    darkOverlay.style.width = `${100 - currentPercent}%`;
  });

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
    linear-gradient(to right, #08f 0%, #08f ${percent}%, transparent ${percent}%, transparent 100%)`;
  }

  const { btnStart, btnEnd, btnToggle } = createLoopControls(video);
  const dividerLine = createDividerLine();

  controls.loopContainer.appendChild(btnStart);
  controls.loopContainer.appendChild(dividerLine);
  controls.loopContainer.appendChild(btnEnd);
  controls.loopContainer.appendChild(dividerLine.cloneNode(true));
  controls.loopContainer.appendChild(btnToggle);

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

  const rjPrefix = rjText.slice(0, 2).toUpperCase();

  const firstUrlCode = rjPrefix + customRoundWithZero(rjNumber);

  return firstUrlCode;
}

function extractRJCode(doc = document) {
  const paragraphs = doc.querySelectorAll("p");
  const rjCodeElem = Array.from(paragraphs).filter((p) =>
    p.innerText.startsWith("RJ Code:")
  );
  if (rjCodeElem.length > 0) return rjCodeElem[0]?.innerText?.split(" ")[2];
  else return null;
}

function changeLogo() {
  const logo = document.querySelector("img.custom-logo");
  if (logo) {
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
  } else {
    console.error("No logo found on page");
  }
}

const findElement = (elem) => document.querySelector(elem);
const createElement = (elem) => document.createElement(elem);

function addVideoProgressOverlay(wrapDiv) {
  const rjCode = extractRJCode();
  const dlSiteImageUrl = getDLSiteImgFromRJ(rjCode);
  const videoImg = findElement("img.fotorama__img");

  if (!videoImg) {
    console.error("Couldn't find video div");
    return;
  }

  videoImg.className = "video-img";
  videoImg.style.width = "100%";
  videoImg.src = dlSiteImageUrl;

  // Insert the wrapper before the img
  videoImg.parentNode.insertBefore(wrapDiv, videoImg);

  // Move the img into the wrapper
  wrapDiv.appendChild(videoImg);

  const clickOverlay = document.createElement("div");
  clickOverlay.className = "click-overlay";

  const darkOverlay = document.createElement("div");
  darkOverlay.className = "dark-overlay";

  return { clickOverlay, darkOverlay };
}

function createAudioVisualizer(video) {
  // 2. Create canvas for visualizer
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 300;
  canvas.style.maxWidth = "800px";
  canvas.style.width = "100%";

  canvas.style.display = "block";
  canvas.style.margin = "20px auto";
  canvas.style.background = "transparent";
  canvas.style.borderBottom = "2px white solid";

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      ctx.fillStyle = `rgb(${barHeight + 100}, ${200 - barHeight}, 150)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    // const targetR = 50;
    // const targetG = 150;
    // const targetB = 200;

    // for (let i = 0; i < bufferLength; i++) {
    //   const barHeight = dataArray[i]; // 0 to 255

    //   // Calculate progress (0 to 1)
    //   const t = barHeight / 255;

    //   // Interpolate between white (255,255,255) and your color
    //   const r = 255 + t * (targetR - 255);
    //   const g = 255 + t * (targetG - 255);
    //   const b = 255 + t * (targetB - 255);

    //   ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    //   ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
    //   x += barWidth;
    // }
  }

  // 6. Wait until video plays to start
  video.addEventListener("play", () => {
    audioCtx.resume(); // required in some browsers
    draw();
  });

  return { canvas };
}

function injectColorThief() {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js";

  document.head.appendChild(script);
  return { script };
}

async function createBackgroundGradient(imageUrl) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl; // Safe for CORS

  img.style.display = "none";
  document.body.appendChild(img);

  // img.onload = () => {
  //   console.log("image loaded");
  //   const colorThief = new ColorThief();
  //   const palette = colorThief.getPalette(img, 3);

  //   Vibrant.from(img)
  //     .getPalette()
  //     .then((palette) => {
  //       console.log("Palette:", palette);
  //       const bgColor = palette.Vibrant.hex;

  //       // Apply chroma.js enhancements to each color
  //       // const color1 = chroma(palette[0]).brighten(1).saturate(1).rgb(); // [r,g,b]
  //       // const color2 = chroma(palette[1]).brighten(1).saturate(1).rgb();
  //       // const color3 = chroma(palette[2]).brighten(1).saturate(1).rgb();

  //       // const [r1, g1, b1] = color1;
  //       // const [r2, g2, b2] = color2;
  //       // const [r3, g3, b3] = color3;

  //       const bg = document.createElement("div");
  //       bg.className = "gradient-bg";
  //       bg.style.position = "fixed";
  //       bg.style.inset = "0";
  //       bg.style.zIndex = "-1";
  //       bg.style.filter = "blur(60px)";
  //       bg.style.background = `linear-gradient(135deg, ${bgColor})`;

  //       findElement("header").appendChild(bg);
  //     });
  // };

  await new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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
        return `rgb(${Math.round(r / len)}, ${Math.round(
          g / len
        )}, ${Math.round(b / len)})`;
      };

      const top = avg(topColors);
      const bottom = avg(bottomColors);
      const left = avg(leftColors);
      const right = avg(rightColors);

      const color1 = chroma(top).brighten(1).saturate(1).rgb();
      const color2 = chroma(bottom).brighten(1).saturate(1).rgb();
      const color3 = chroma(left).brighten(1).saturate(1).rgb();
      const color4 = chroma(right).brighten(1).saturate(1).rgb();

      const [r1, g1, b1] = color1;
      const [r2, g2, b2] = color2;
      const [r3, g3, b3] = color3;
      const [r4, g4, b4] = color4;

      const bg = document.createElement("div");
      bg.className = "gradient-bg";
      bg.style.position = "fixed";
      bg.style.inset = "0";
      bg.style.zIndex = "-1";
      bg.style.filter = "blur(60px)";
      bg.style.background = `
        linear-gradient(to top, rgba(${r1},${g1},${b1}), rgba(${r2},${g2},${b2})),
        linear-gradient(to left, rgba(${r3},${g3},${b3}), rgba(${r4},${g4},${b4}))
      `;
      bg.style.backgroundRepeat = "no-repeat";
      bg.style.backgroundSize = "cover";

      findElement("header").appendChild(bg);

      resolve(); // Notify that processing is done
    };
  });
}

function getDLSiteImgFromRJ(rjCode) {
  const rjCodeGroup = getDLSiteUrl(rjCode);
  let rjCodeHeader = "doujin";
  if (rjCode.charAt(0) === "R") {
    rjCodeHeader = "doujin";
  } else if (rjCode.charAt(0) === "V") {
    rjCodeHeader = "professional";
  } else if (rjCode.charAt(0) === "B") {
    rjCodeHeader = "books";
  }
  const dlSiteImageUrl = `https://img.dlsite.jp/modpub/images2/work/${rjCodeHeader}/${rjCodeGroup}/${rjCode}_img_main.webp`;
  return dlSiteImageUrl;
}

function createScrolledBanner() {
  const bannerDiv = document.createElement("div");
  bannerDiv.id = "top-banner";
  bannerDiv.textContent = "Most Recent";

  const scrollThreshold = 250;

  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
      // Scrolling down — show banner
      bannerDiv.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      bannerDiv.style.transform = "translateY(0)";
      bannerDiv.style.opacity = "1";
    } else if (currentScrollY <= scrollThreshold) {
      bannerDiv.style.transition = "none";
      bannerDiv.style.transform = "translateY(0)";
      bannerDiv.style.opacity = "1";
    } else {
      // Scrolling up — hide banner
      bannerDiv.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      bannerDiv.style.transform = "translateY(-100%)";
      bannerDiv.style.opacity = "0";
    }
    lastScrollY = currentScrollY;
  });

  return { bannerDiv };
}

function createDividerLine() {
  const dividerLine = createElement("div");
  dividerLine.style.width = "2px";
  dividerLine.style.height = "100%";
  dividerLine.style.backgroundColor = "white";
  return dividerLine;
}

function removeLoadingScreen() {
  const overlay = document.getElementById("cf-loading-overlay");
  if (overlay) {
    overlay.remove();
  } else {
    console.error("Couldn't remove loading screen");
  }
}

function addHomeGradient() {
  const homeBg = findElement("#site-masthead");
  if (homeBg) {
    // homeBg.style.background = "linear-gradient(to right, #ef8796, #914ba3)";
    // homeBg.style.background = "linear-gradient(to right, #0d324d, #7f5a83)";

    homeBg.style.background = "linear-gradient(to right, #2c003e, #120a4f)";
  } else {
    console.error("Couldn't add home linear gradient");
  }
}
// document.body.style.opacity = "0.8";

function createFetchCardSpinner() {
  const fetchCardSpinner = document.createElement("div"); //CREATE await spinner
  fetchCardSpinner.id = "loading-spinner";
  fetchCardSpinner.style.display = "none"; // hide initially
  fetchCardSpinner.innerHTML = `
              <svg
                width="40" height="40"
                viewBox="0 0 50 50"
                style="margin: 20px auto; display: block;"
              >
                <circle
                  cx="25" cy="25" r="20"
                  fill="none" stroke="#fff" stroke-width="5"
                  stroke-linecap="round"
                  stroke-dasharray="31.4 31.4"
                  transform="rotate(0 25 25)"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 25 25"
                    to="360 25 25"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            `;

  return fetchCardSpinner;
}

function createBackToTopButton() {
  // Create button container
  const backToTopBtn = document.createElement("button");
  backToTopBtn.style.position = "fixed";
  backToTopBtn.style.bottom = "20px";
  backToTopBtn.style.right = "20px";
  backToTopBtn.style.padding = "16px";
  backToTopBtn.style.border = "none";
  backToTopBtn.style.borderRadius = "50%";
  backToTopBtn.style.background = "rgba(0,0,0,0.8)";
  backToTopBtn.style.cursor = "pointer";
  backToTopBtn.style.zIndex = 10000;
  backToTopBtn.style.display = "none"; // hidden initially
  backToTopBtn.style.alignItems = "center";
  backToTopBtn.style.justifyContent = "center";

  // Insert your SVG inside the button
  backToTopBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" 
viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-up-icon lucide-chevrons-up">
  <path d="m17 11-5-5-5 5"/>
  <path d="m17 18-5-5-5 5"/>
</svg>`;

  // Show button after scrolling down 200px
  window.addEventListener("scroll", () => {
    backToTopBtn.style.display = window.scrollY > 200 ? "flex" : "none";
  });

  // Smooth scroll to top on click
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  return backToTopBtn;
}

function renderCardsFromDom(doc, grid) {
  const cards = doc.querySelectorAll(".entry-preview-wrapper");
  if (!cards.length) {
    console.log("No cards found.");
    return;
  }

  cards.forEach((card) => {
    processCard(card, grid);
  });
}

function getDLSiteImg() {
  const rjCode = extractRJCode();
  if (!rjCode) {
    console.log("No RJ code extracted");
    return;
  }
  const dlSiteImageUrl = getDLSiteImgFromRJ(rjCode);
  console.log("DL Site Image is", dlSiteImageUrl);
  return { dlSiteImageUrl, rjCode };
}

function injectBgGradient(dlSiteImageUrl) {
  // Wait for background color to update before showing video page
  const { script } = injectColorThief();
  script.onload = async () => {
    console.log("ColorThief loaded", window.ColorThief);
    await createBackgroundGradient(dlSiteImageUrl);
    removeLoadingScreen();
  };
}

function removePrimaryMenu() {
  const primaryMenu = findElement("#site-section-primary-menu");
  if (!primaryMenu) {
    console.log("No Primary Menu found");
    return;
  }
  primaryMenu.remove();
}

function showTags() {
  const tagsElArr = document.querySelectorAll(".post-meta.post-tags a");
  tagsElArr.forEach((el) => console.log(el.innerText));
}

// Get Post Data

function extractVideoTitle() {
  const title = document.querySelector(".page-title");
  if (!title) {
    console.log("Video title element not found");
    return "";
  }
  return title.innerText;
}

function extractVideoTags() {
  const tagsElArr = document.querySelectorAll(".post-meta.post-tags a");
  if (tagsElArr.length === 0) {
    console.log("Video tag element not found");
    return [];
  }
  const tagsArr = Array.from(tagsElArr).map((el) => el.innerText);
  return tagsArr;
}

function extractVideoCVs() {
  const cvEl = document.getElementById("voice_actors");
  if (!cvEl) {
    console.log("No Video CV found");
    return [];
  }

  const cvArr = cvEl.innerText
    .slice(3)
    .trim()
    .split(",")
    .map((cv) => cv.trim());

  if (cvArr.length > 0) return cvArr;
  return [];
}

function extractVideoUrl() {
  return window.location.href;
}
