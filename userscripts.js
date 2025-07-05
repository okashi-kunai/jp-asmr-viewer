(function () {
  "use strict";
  console.log("✅ Userscript injected:", window.location.href);

  function waitForCloudflareBypass(callback, maxWait = 1000) {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const cfGone =
        !document.querySelector("#cf-challenge") &&
        !document.querySelector("iframe[src*='challenge']");
      const hasCookie = document.cookie.includes("__cf_bm");
      const timedOut = Date.now() - startTime > maxWait;

      if ((cfGone && hasCookie) || timedOut) {
        console.log("✅ Proceeding after Cloudflare check or timeout");
        clearInterval(interval);
        callback();
      } else {
        console.log("⏳ Waiting on Cloudflare...");
      }
    }, 500);
  } // Wait for Cloudflare check

  waitForCloudflareBypass(() => {
    const overlay = document.getElementById("cf-loading-overlay");
    if (overlay) overlay.remove();

    const url = window.location.href;
    console.log(url);

    if (url.match(/^https?:\/\/japaneseasmr\.com\/$/)) {
      // Code for main page
      console.log("Main page code running");

      const header = document.querySelector("header"); // FIND header element

      const container = document.createElement("div"); // CREATE container element for grid
      container.id = "cv-grid-container";
      header.appendChild(container); // APPEND container in header

      if (container) {
        // Create banner
        const banner = document.createElement("div");
        banner.id = "top-banner";
        banner.textContent = "Most Recent";

        container.parentNode.insertBefore(banner, container);

        let lastScrollY = window.scrollY;
        window.addEventListener("scroll", () => {
          const currentScrollY = window.scrollY;

          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            // Scrolling down — show banner
            banner.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            banner.style.transform = "translateY(0)";
            banner.style.opacity = "1";
          } else if (currentScrollY <= 50) {
            banner.style.transition = "none";
            banner.style.transform = "translateY(0)";
            banner.style.opacity = "1";
          } else {
            // Scrolling up — hide banner
            banner.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            banner.style.transform = "translateY(-100%)";
            banner.style.opacity = "0";
          }
          lastScrollY = currentScrollY;
        });
      } // CREATE banner

      (function createGrid() {
        const grid = document.createElement("div");
        grid.id = "cv-grid";
        container.appendChild(grid);
      })();

      (function hideMain() {
        const main = document.querySelector("main"); // HIDE main
        if (main) main.style.display = "none";
      })();

      (function () {
        const grid = document.querySelector("#cv-grid");
        if (!grid) return;

        let page = 2;
        let isLoading = false;

        (function createFetchCardSpinner() {
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
          container.append(fetchCardSpinner); // APPEND to bottom of container
        })();

        const fetchCardSpinner = document.getElementById("loading-spinner");

        // Render cards from any parsed document (initial or fetched)
        function renderCardsFromDocument(doc) {
          const cards = doc.querySelectorAll(".entry-preview-wrapper");
          if (!cards.length) {
            console.log("No cards found.");
            return;
          }

          cards.forEach((card) => {
            const entryTitle = card.querySelector(".entry-title a");
            const title = entryTitle ? entryTitle.innerText.trim() : "No title";

            const creatorParagraphs = Array.from(
              card.querySelectorAll("p")
            ).filter((p) => p.innerText.startsWith("CV:"));
            const creators = creatorParagraphs.map((p) =>
              p.innerText.slice(3).trim()
            );
            let creatorText = "Unknown";
            if (creators.length === 1) {
              creatorText = creators[0];
            } else if (creators.length > 1) {
              creatorText = `${creators[0]} + ${creators.length - 1} others`;
            }

            const img = card.querySelector(".op-square a img");
            if (!img) return;

            // Fix lazy-loaded images
            if (img.hasAttribute("data-src")) {
              img.src = img.getAttribute("data-src");
            }

            // Avoid duplicate cards by checking if image is already in container
            // (Optional: add better duplicate prevention logic if needed)

            const cvCard = document.createElement("div");
            cvCard.className = "cv-card";

            // Move image element to new card
            cvCard.appendChild(img);

            const authorEl = document.createElement("div");
            authorEl.className = "cv-author";
            authorEl.textContent = creatorText;
            cvCard.appendChild(authorEl);

            const info = document.createElement("div");
            info.className = "cv-info";

            const titleEl = document.createElement("div");
            titleEl.className = "cv-title";
            titleEl.textContent = title;
            info.appendChild(titleEl);

            cvCard.appendChild(info);

            grid.appendChild(cvCard);
          });
        }

        // Initial render: use current page's document
        renderCardsFromDocument(document);

        loadNextPage(page, () => {
          page++;

          // Check if page height is still not enough for scrolling
          if (document.body.scrollHeight <= window.innerHeight) {
            loadNextPage(page, () => {
              page++; // Now infinite scroll continues from page 3
            });
          }
        });

        // Infinite scroll loading next pages
        window.addEventListener("scroll", () => {
          const nearBottom =
            window.innerHeight + window.scrollY >=
            document.body.scrollHeight - 300;

          if (nearBottom && !isLoading) {
            isLoading = true;
            fetchCardSpinner.style.display = "block"; // show spinner
            loadNextPage(page);
            page++;
          }
        });

        function loadNextPage(page) {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none"; // hide iframe from view
          iframe.src = `https://japaneseasmr.com/page/${page}/`;

          iframe.onload = () => {
            const doc = iframe.contentDocument;
            if (!doc) {
              console.warn("Iframe document not accessible");
              isLoading = false;
              fetchCardSpinner.style.display = "none";
              return;
            }

            // Now you can safely query elements inside the iframe doc
            const cards = doc.querySelectorAll(".entry-preview-wrapper");
            console.log(`Loaded page ${page}: found ${cards.length} cards`);

            // Your existing function to process and render cards from that doc
            renderCardsFromDocument(doc);

            iframe.remove(); // clean up iframe when done
            isLoading = false;
            fetchCardSpinner.style.display = "none";
          };

          document.body.appendChild(iframe); // add iframe to DOM so it loads
        }
      })(); // FETCHES and FORMATS cards

      // your main page code here
    } else if (url.match(/^https?:\/\/japaneseasmr\.com\/36749/)) {
      // Code for other pages
      console.log("Other page code running");

      (function createPlaybackControls() {
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

        const videoDiv = document.querySelector(".plyr");
        videoDiv.insertAdjacentElement("afterend", playbackControls);
      })();

      // HOOK UP BUTTONS TO VIDEO ---------------------------------------------------------------------------------

      const video = document.querySelector(".plyr__video-wrapper video");
      if (!video) {
        console.warn("Video element not found.");
      } else {
        const timeDisplay = document.getElementById("player-time");
        const rewind60 = document.getElementById("rewind-60");
        const rewind10 = document.getElementById("rewind-10");
        const playPause = document.getElementById("play-pause");
        const forward10 = document.getElementById("forward-10");
        const forward60 = document.getElementById("forward-60");
        const seekSlider = document.getElementById("seek-slider");
        const loopContainer = document.getElementById("loop-container");

        rewind60?.addEventListener("click", () => {
          video.currentTime = Math.max(0, video.currentTime - 60);
        });
        rewind10?.addEventListener("click", () => {
          video.currentTime = Math.max(0, video.currentTime - 10);
        });
        forward10?.addEventListener("click", () => {
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
        });
        forward60?.addEventListener("click", () => {
          video.currentTime = Math.min(video.duration, video.currentTime + 60);
        });
        playPause?.addEventListener("click", () => {
          if (video.paused) {
            video.play();
            playPause.textContent = "⏸ Pause";
          } else {
            video.pause();
            playPause.textContent = "▶️ Play";
          }
        });

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
        video.addEventListener("timeupdate", () => {
          const current = formatTime(video.currentTime);
          const total = formatTime(video.duration);
          timeDisplay.textContent = `${current} / ${total}`;
        });

        // ⏱️ Sync slider with video
        video.addEventListener("timeupdate", () => {
          if (!seekSlider.dragging) {
            seekSlider.value = (video.currentTime / video.duration) * 100;
          }
        });

        // 👆 Scrub video on slider input
        seekSlider.addEventListener("input", () => {
          const percent = seekSlider.value;
          video.currentTime = (percent / 100) * video.duration;
        });

        // Optional: prevent conflict during drag
        seekSlider.addEventListener("mousedown", () => {
          seekSlider.dragging = true;
        });
        seekSlider.addEventListener("mouseup", () => {
          seekSlider.dragging = false;
        });

        const wrapper = document.querySelector(".slider-wrapper");

        video.addEventListener("timeupdate", () => {
          const percent = (video.currentTime / video.duration) * 100;
          seekSlider.value = percent;
          updateSliderFill(percent);
        });

        // Seek video when slider changes
        seekSlider.addEventListener("input", () => {
          const seekTime = (seekSlider.value / 100) * video.duration;
          video.currentTime = seekTime;
          updateSliderFill(seekSlider.value);
        });

        // Update slider background fill
        function updateSliderFill(percent) {
          seekSlider.style.backgroundImage = `linear-gradient(to right, #08f 0%, #08f ${percent}%, #444 ${percent}%, #444 100%)`;
        }

        let loopStart = null;
        let loopEnd = null;
        let looping = false;

        createControls(video);

        video.addEventListener("timeupdate", () => {
          if (looping && loopStart !== null && loopEnd !== null) {
            if (video.currentTime >= loopEnd) {
              video.currentTime = loopStart;
              video.play();
            }
          }
        });

        // For Loop Functionality
        function createControls(video) {
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

          loopContainer.appendChild(btnStart);
          loopContainer.appendChild(btnEnd);
          loopContainer.appendChild(btnToggle);
        }
      }
    } else {
      // Code for any other page matched by your @match (if any)
      console.log("Other pages");
    }
  });
})();
