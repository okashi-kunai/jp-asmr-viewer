// Block window.open
window.open = function () {
  console.warn("Blocked window.open()");
  return null;
};

// Block redirect methods
window.location.assign = function (url) {
  console.warn("Blocked location.assign:", url);
};

window.location.replace = function (url) {
  console.warn("Blocked location.replace:", url);
};

history.pushState = function () {
  console.warn("Blocked history.pushState");
};

history.replaceState = function () {
  console.warn("Blocked history.replaceState");
};

// Block links that open in new tab
document.addEventListener(
  "click",
  (e) => {
    const link = e.target.closest("a");
    if (link && link.target === "_blank") {
      e.preventDefault();
      console.warn("Blocked link opening in new tab:", link.href);
    }
  },
  true
); // Use capture phase

// Prevent beforeunload confirmation
// window.addEventListener("beforeunload", (e) => {
//   e.preventDefault();
//   e.returnValue = "";
//   console.warn("Blocked beforeunload prompt");
// });

(function () {
  "use strict";
  console.log("✅ Userscript injected:", window.location.href);

  function waitForCloudflareBypass(
    callback,
    initialMaxWait = 1000,
    extendedMaxWait = 15000
  ) {
    const startTime = Date.now();
    let challengeDetected = false;

    const interval = setInterval(() => {
      const cfChallengePresent =
        document.querySelector("#cf-challenge") ||
        document.querySelector("iframe[src*='challenge']");
      const hasCookie = document.cookie.includes("__cf_bm");
      const elapsed = Date.now() - startTime;

      // Detect if challenge shows up anytime during wait
      if (cfChallengePresent) {
        challengeDetected = true;
        console.log("⚠️ Cloudflare challenge detected, extending wait...");
      }

      // Decide which timeout to use
      const maxWait = challengeDetected ? extendedMaxWait : initialMaxWait;

      // Condition to proceed:
      // - Challenge gone and cookie set, or
      // - Timed out according to current maxWait
      if ((!cfChallengePresent && hasCookie) || elapsed > maxWait) {
        clearInterval(interval);
        console.log("✅ Proceeding after Cloudflare check or timeout");
        callback();
      } else {
        console.log(`⏳ Waiting on Cloudflare... (${elapsed}ms elapsed)`);
      }
    }, 200);
  }

  // 2. Wait for DOM ready
  function onDOMReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
  onDOMReady(() => {
    console.log("DOM has loeaded.");
    waitForCloudflareBypass(() => {
      const url = window.location.href;
      console.log(url);

      const homePageRegex =
        /^https?:\/\/japaneseasmr\.com\/(?:tag\/[^\/]+)?\/?$/;
      // Matches:
      //   - https://japaneseasmr.com/
      //   - https://japaneseasmr.com/tags/something
      // Trailing slash optional

      const videoPageRegex = /^https?:\/\/japaneseasmr\.com\/\d+\/?$/;
      // Matches:
      //   - https://japaneseasmr.com/123
      //   - https://japaneseasmr.com/123/

      const homepage = url.match(homePageRegex);
      const videopage = url.match(videoPageRegex);

      const logoDiv = createLogoDiv();
      changeLogo(logoDiv);

      if (homepage) {
        homePageCode(logoDiv);
      } else if (videopage) {
        videoPageCode();
      } else {
        // Code for any other page matched by your @match (if any)
        console.log("Other pages");
      }
    });
  });
})();

async function homePageCode(logoDiv) {
  removeLoadingScreen();
  addHomeGradient();
  hideMain();

  // Get Bookmark data
  const bmDataObj = await getBMData("recent");
  const bmRjCodesArr = Object.keys(bmDataObj);

  const header = findElement("header"); // FIND header element
  const container = createElement("div"); // CREATE container element for grid
  container.id = "img-grid-container";
  header.appendChild(container); // APPEND container in header

  const { bannerDiv } = createScrolledBanner();
  container.parentNode.insertBefore(bannerDiv, container);

  let showBookmarks = false;

  const bookmarkPageButton = createBookmarkPageButton();

  logoDiv.appendChild(bookmarkPageButton);

  const grid = createElement("div");
  grid.id = "img-grid";

  // Start with cards
  let scrollHandler = fetchAndFormatCards(grid, bmRjCodesArr);

  bookmarkPageButton.onclick = () => {
    if (showBookmarks) {
      // Click means don't show bookmarks so show cards
      showBookmarks = false;
      console.log("Showing cards");
      scrollHandler = fetchAndFormatCards(grid, bmRjCodesArr);
      bookmarkPageButton.style.opacity = "";
    } else {
      // Click means don't show cards so show bookmarks
      showBookmarks = true;
      console.log("Showing bookmarks");
      bookmarkPageButton.style.setProperty("opacity", "1", "important");
      window.removeEventListener("scroll", scrollHandler);
      eraseHTML(grid);
      bmRjCodesArr.map((rj) => {
        const bookmarkData = bmDataObj[rj];
        const img = new Image();
        img.src = bookmarkData.imageUrl;
        const cardInfo = {
          title: bookmarkData.title,
          creatorArr: bookmarkData.cvs,
          img: img,
          href: bookmarkData.url,
        };

        const isBookmarked = bmRjCodesArr.includes(rj);
        processCard(grid, isBookmarked, cardInfo);
      });
      container.appendChild(grid);
    }
  };

  function fetchAndFormatCards(grid, bmRjCodesArr) {
    eraseHTML(grid);

    container.appendChild(grid);
    const fetchCardSpinner = createFetchCardSpinner();
    container.append(fetchCardSpinner);

    const lastPage = getTotalPages();

    let page = 2;
    let isLoading = false;

    (function initialRenderPage() {
      // Add second page on intitial so content fills grid enough to become scrollable
      loadNextPage(page);
      page++;
      // Renders first page videos since it is already in DOM
      renderCardsFromDom(document, grid, bmRjCodesArr);
    })();

    // Infinite scroll loading next pages
    const scrollHandler = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 300;

      if (page > lastPage) {
        window.removeEventListener("scroll", scrollHandler);
        console.log("✅ Reached final page, scroll listener removed.");
        return;
      }

      if (nearBottom && !isLoading) {
        isLoading = true;
        fetchCardSpinner.style.display = "block"; // show spinner
        loadNextPage(page);
        page++;
      }
    };
    window.addEventListener("scroll", scrollHandler);

    function loadNextPage(page) {
      const iframe = createElement("iframe");
      iframe.style.display = "none"; // hide iframe from view

      const currentPath = window.location.pathname;

      let pageToQuery = "";
      if (currentPath.startsWith("/tag/")) {
        const paths = currentPath.split("/");
        pageToQuery = "/" + paths[1] + "/" + paths[2];
        console.log(paths);
        // pageToQuery = currentPath.split('/')
      }

      iframe.src = `https://japaneseasmr.com${pageToQuery}/page/${page}/`;

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
        renderCardsFromDom(doc, grid, bmRjCodesArr);

        iframe.remove(); // clean up iframe when done
        isLoading = false;
        fetchCardSpinner.style.display = "none";
      };

      document.body.appendChild(iframe); // add iframe to DOM so it loads
    }

    return scrollHandler;
  } // FETCHES and FORMATS cards

  const backToTopBtn = createBackToTopButton();
  document.body.appendChild(backToTopBtn);
}

function videoPageCode() {
  // Code for other pages
  console.log("Video code running");

  hideMain();

  const header = findElement("header"); // FIND header element

  const wrapDiv = createElement("div");
  wrapDiv.className = "wrap-div";
  const { clickOverlay, darkOverlay } = addVideoProgressOverlay(wrapDiv);
  wrapDiv.appendChild(darkOverlay);
  wrapDiv.appendChild(clickOverlay);

  const wrapDivPadding = createElement("div");
  wrapDivPadding.className = "wrap-div-padding";
  wrapDivPadding.appendChild(wrapDiv);
  header.appendChild(wrapDivPadding);

  const playbackControls = createPlaybackControls();
  header.appendChild(playbackControls);

  // HOOK UP BUTTONS TO VIDEO ---------------------------------------------------------------------------------

  const video = document.querySelector(".plyr__video-wrapper video");
  if (!video) {
    console.warn("Video element not found.");
    return;
  }

  // If element doesn't have crossorigin, set cors
  !video.hasAttribute("crossorigin") && setCorsHeader(video);

  const { loopContainer, seekSlider, updateSliderFill } = addPlaybackListeners(
    video,
    clickOverlay,
    darkOverlay
  );

  // Chapters
  const chapterTable = findElement("#plyr-chapter-playlist");
  if (chapterTable) {
    const chapterDiv = createElement("div");
    chapterDiv.id = "chapter-div";
    chapterDiv.appendChild(chapterTable);

    header.appendChild(chapterDiv);
  }

  removePrimaryMenu();

  // Get image from DL site
  const { dlSiteImageUrl, rjCode } = getDLSiteImg();
  injectBgGradient(dlSiteImageUrl);

  const { canvas, audioCtx, source } = createAudioVisualizer(video);
  header.appendChild(canvas);

  const postData = {
    title: extractVideoTitle(),
    tags: extractVideoTags(),
    cvs: extractVideoCVs(),
    url: extractVideoUrl(),
    imageUrl: dlSiteImageUrl,
  };
  async function createBookmarkButton(postId, postData) {
    const firebase = await waitForFirebase();
    const user = await getCurrentUser(); // waits for login state

    const btn = document.createElement("button");
    btn.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    padding: 10px;
    z-index: 9999;
    background: gold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  `;

    const uid = user.uid;
    const db = firebase.firestore();
    const bookmarkDocRef = db
      .collection("users")
      .doc(uid)
      .collection("bookmarks")
      .doc(postId);

    let isBookmarked = (await bookmarkDocRef.get()).exists;
    btn.textContent = isBookmarked ? "🔖 Remove Bookmark" : "🔖 Bookmark";

    btn.addEventListener("click", async () => {
      if (!user) return alert("Please log in");

      if (isBookmarked) {
        bookmarkDocRef
          .delete()
          .then(() => {
            console.log("✅ Bookmark deleted");
            btn.textContent = "🔖 Bookmark";
            isBookmarked = false;
          })
          .catch((error) => {
            console.error("❌ Error deleting bookmark:", error);
          });
      } else {
        try {
          await bookmarkDocRef.set({
            ...postData,
            addedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ Bookmark added");
          btn.textContent = "🔖 Remove Bookmark";
          isBookmarked = true;
        } catch (err) {
          console.error("❌ Error adding bookmark:", err);
        }
      }
    });

    document.body.appendChild(btn);
  }

  createBookmarkButton(rjCode, postData);

  function createVolumeSlider(audioCtx, source) {
    const gainNode = audioCtx.createGain();
    // 4. Connect video audio to gain node
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const volumeSlider = createElement("div");
    volumeSlider.innerHTML = volumeSliderHTML();

    header.appendChild(volumeSlider);

    const slider = document.getElementById("volume-slider");
    const volumeLevel = document.getElementById("volume-level");

    gainNode.gain.value = 0;

    slider.addEventListener("input", () => {
      console.log(slider.value);
      gainNode.gain.value = slider.value / 2;

      // Optional: update the bar visually if you have one
      volumeLevel.style.width = slider.value * 10 + "%";
    });
  }

  createVolumeSlider(audioCtx, source);
}

function volumeSliderHTML() {
  return `
    <div id="volume-container" style="width: 300px; margin: 20px;">
      <input
        id="volume-slider"
        type="range"
        min="0"
        max="10"
        value="0"
        step="1"
        style="width: 100%;"
      />
      <div
        id="volume-bar"
        style="
      height: 10px;
      background-color: lightgray;
      margin-top: 5px;
      border-radius: 5px;
      position: relative;
    "
      >
        <div
          id="volume-level"
          style="
        height: 100%;
        width: 0%;
        background-color: #4caf50;
        border-radius: 5px;
        transition: width 0.2s ease;
      "
        ></div>
      </div>
    </div>
  
`;
}
function waitForFirebase() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (typeof firebase !== "undefined") {
        clearInterval(interval);
        resolve(firebase);
      }
    }, 50);
  });
}

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      unsubscribe(); // stop listening once we get the user
      resolve(user);
    });
  });
}
