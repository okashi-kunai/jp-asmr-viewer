// (function () {
//   "use strict";

//   // Block window.open spam
//   const originalOpen = window.open;
//   window.open = function (url, ...args) {
//     console.log("[Blocker] window.open blocked:", url);
//     return null;
//   };

//   // Block window.close
//   window.close = function () {
//     console.log("[Blocker] window.close() prevented");
//   };

//   // Remove known popunder ad elements
//   const adSelectors = [
//     'script[src*="pemsrv.com"]',
//     'script[src*="exoclick.com"]',
//     'script:contains("popMagic")',
//     'script:contains("AdProvider")',
//     "ins.adsbyexoclick",
//     'script[src*="venor.php"]',
//     'script[src*="popunder"]',
//   ];

//   const observer = new MutationObserver(() => {
//     adSelectors.forEach((sel) => {
//       document.querySelectorAll(sel).forEach((el) => {
//         el.remove();
//         console.log(`[Blocker] Removed ad element:`, sel);
//       });
//     });
//   });

//   observer.observe(document.documentElement, {
//     childList: true,
//     subtree: true,
//   });

//   // Remove inline ad elements on page load
//   window.addEventListener("load", () => {
//     adSelectors.forEach((sel) => {
//       document.querySelectorAll(sel).forEach((el) => {
//         el.remove();
//       });
//     });

//     // Extra: Kill global ad object
//     delete window.popMagic;
//     delete window.AdProvider;
//     console.log("[Blocker] Removed popMagic and AdProvider objects");
//   });
// })();

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
    (function ifLoadedRemoveLoadingOverlay() {
      const overlay = document.getElementById("cf-loading-overlay");
      if (overlay) overlay.remove();
    })();

    const url = window.location.href;
    console.log(url);

    const homePageRegex = /^https?:\/\/japaneseasmr\.com\/$/;
    const videoPageRegex = /^https?:\/\/japaneseasmr\.com\/\d+\/?$/;

    const homepage = url.match(homePageRegex);
    const videopage = url.match(videoPageRegex);

    const logo = document.querySelector("img.custom-logo");
    logo && changeLogo(logo);

    if (homepage) {
      homePageCode();
    } else if (videopage) {
      videoPageCode();
    } else {
      // Code for any other page matched by your @match (if any)
      console.log("Other pages");
    }
  });
})();

function homePageCode() {
  const header = findElement("header"); // FIND header element

  const container = createElement("div"); // CREATE container element for grid
  container.id = "img-grid-container";
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
    const grid = createElement("div");
    grid.id = "img-grid";
    container.appendChild(grid);
  })();

  (function hideMain() {
    const main = findElement("main"); // HIDE main
    if (main) main.style.display = "none";
  })();

  (function fetchAndFormatCards() {
    const grid = findElement("#img-grid");
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
        processCard(card, grid);
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
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 300;

      if (nearBottom && !isLoading) {
        isLoading = true;
        fetchCardSpinner.style.display = "block"; // show spinner
        loadNextPage(page);
        page++;
      }
    });

    function loadNextPage(page) {
      const iframe = createElement("iframe");
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
}

function videoPageCode() {
  // Code for other pages
  console.log("Other page code running");

  hideMain();

  const header = findElement("header"); // FIND header element
  const fotorama = document.querySelector(".fotorama");

  const fotoramaWrap = document.querySelector(".fotorama__wrap");
  if (fotoramaWrap) {
    fotoramaWrap.style.display = "flex";
    fotoramaWrap.style.flexDirection = "column";
    fotoramaWrap.style.alignItems = "center";
  }

  const clone = fotoramaWrap.cloneNode(true); // true = deep clone (includes children)

  const fotoramaImg = clone.querySelector(".fotorama__stage");
  fotoramaImg.style.position = "relative";

  const { wrapDiv, clickOverlay, darkOverlay } = addVideoProgressOverlay();
  header.appendChild(wrapDiv);

  const playbackControls = createPlaybackControls();
  header.appendChild(playbackControls);

  // HOOK UP BUTTONS TO VIDEO ---------------------------------------------------------------------------------

  const video = document.querySelector(".plyr__video-wrapper video");
  if (!video) {
    console.warn("Video element not found.");
    return;
  }
  const { loopContainer, seekSlider, updateSliderFill } =
    addPlaybackListeners(video);

  clickOverlay.addEventListener("click", (e) => {
    const xCoord = e.offsetX; // X within the div
    console.log("Clicked X within div:", xCoord);
    let playbackDivWidth = clickOverlay.getBoundingClientRect().width;

    console.log("xCoord is", xCoord, "and total width is", playbackDivWidth);
    const percentage = (xCoord / playbackDivWidth) * 100;
    console.log(percentage);
    video.currentTime = (percentage / 100) * video.duration;
    seekSlider.value = percentage;
    updateSliderFill(percentage);
  });

  let currentPercent = 0;

  video.addEventListener("timeupdate", () => {
    currentPercent = (video.currentTime / video.duration) * 100;

    darkOverlay.style.width = `${100 - currentPercent}%`;
    // console.log(currentPercent);
  });
  const { btnStart, btnEnd, btnToggle } = createLoopControls(video);
  loopContainer.appendChild(btnStart);
  loopContainer.appendChild(btnEnd);
  loopContainer.appendChild(btnToggle);

  // Chapters

  const chapterTable = findElement("#plyr-chapter-playlist");
  if (chapterTable) {
    chapterTable.style.paddingLeft = "20px";
    chapterTable.style.paddingRight = "20px";
    const chapterDiv = createElement("div");
    chapterDiv.id = "chapter-div";
    chapterDiv.appendChild(chapterTable);

    header.appendChild(chapterDiv);
  }

  const primaryMenu = findElement("#site-section-primary-menu");
  if (primaryMenu) {
    primaryMenu.remove();
  }

  const rjCode = extractRJCode();
  const rjCodeGroup = getDLSiteUrl(rjCode);
  const dlSiteImageUrl = `https://img.dlsite.jp/modpub/images2/work/doujin/${rjCodeGroup}/${rjCode}_img_main.webp`;
  console.log("DL Site Image is", dlSiteImageUrl);

  const { script } = injectColorThief();
  script.onload = () => {
    console.log("ColorThief loaded", window.ColorThief);
    initGradient(dlSiteImageUrl);
  };

  createAudioVisualizer(video);
}
