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

      changeLogo();

      if (homepage) {
        homePageCode();
      } else if (videopage) {
        videoPageCode();
      } else {
        // Code for any other page matched by your @match (if any)
        console.log("Other pages");
      }
    });
  });
})();

function homePageCode() {
  removeLoadingScreen();
  addHomeGradient();

  const header = findElement("header"); // FIND header element

  const container = createElement("div"); // CREATE container element for grid
  container.id = "img-grid-container";
  header.appendChild(container); // APPEND container in header

  const { bannerDiv } = createScrolledBanner();
  container.parentNode.insertBefore(bannerDiv, container);

  hideMain();
  (function fetchAndFormatCards() {
    const grid = createElement("div");
    grid.id = "img-grid";
    container.appendChild(grid);

    const pageNumElArr = document.querySelectorAll(".page-numbers");
    const finalPageNum = parseInt(
      pageNumElArr[pageNumElArr.length - 2].innerText.replace(/,/g, "")
    );

    let page = 2;
    let isLoading = false;

    const fetchCardSpinner = createFetchCardSpinner();
    container.append(fetchCardSpinner);

    // Add second page on intitial so content fills grid enough to become scrollable
    loadNextPage(page);
    page++;

    // Renders first page videos since it is already in DOM
    renderCardsFromDom(document, grid);

    // Infinite scroll loading next pages
    const scrollHandler = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 300;

      if (page > finalPageNum) {
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
        renderCardsFromDom(doc, grid);

        iframe.remove(); // clean up iframe when done
        isLoading = false;
        fetchCardSpinner.style.display = "none";
      };

      document.body.appendChild(iframe); // add iframe to DOM so it loads
    }
  })(); // FETCHES and FORMATS cards

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

  const { canvas } = createAudioVisualizer(video);
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

  showTags();
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
