import {getMushroomInfo} from "./mushroomInfo.js";

// Text-only Wikipedia lookup. This page does not identify mushrooms from
// photographs or make an edibility verdict.
const app = document.getElementById("identify-app");
const nameInput = document.getElementById("mushroom-name");

if (app && nameInput) {
  const submitButton = document.getElementById("identify-submit");
  const statusRegion = document.getElementById("identify-status");
  const errorRegion = document.getElementById("identify-error");
  const resultHeading = document.getElementById("result-heading");
  const resultCard = document.getElementById("result-card");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state = "empty";

  function setState(next, statusText = "") {
    state = next;
    app.dataset.state = next;
    submitButton.disabled = next === "loading";
    submitButton.textContent = next === "loading" ? "Searching…" :
      "Search Wikipedia →";
    statusRegion.textContent = statusText;
  }

  function revealResults() {
    resultHeading.focus({preventScroll: true});
    resultHeading.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  }

  function renderResult(info) {
    resultCard.className = "result-card notice";
    document.getElementById("result-risk").textContent = info.isDisambiguation ?
      "Wikipedia disambiguation page" : "Wikipedia information";
    document.getElementById("result-name-en").textContent = info.title || "Unnamed page";
    document.getElementById("result-name-zh").textContent = "";
    document.getElementById("result-sci").textContent = info.description || "";
    document.getElementById("result-note").textContent = info.summary ||
      "Wikipedia does not have a summary for this page.";

    const wikipediaLink = document.getElementById("result-wikipedia");
    const wikipediaSource = document.getElementById("result-source");
    if (info.wikipediaUrl) {
      wikipediaLink.href = info.wikipediaUrl;
      wikipediaSource.hidden = false;
    } else {
      wikipediaLink.removeAttribute("href");
      wikipediaSource.hidden = true;
    }
  }

  async function searchMushroom() {
    const name = nameInput.value.trim();
    errorRegion.textContent = "";

    if (!name) {
      errorRegion.textContent = "Enter a mushroom name before searching.";
      setState("error");
      nameInput.focus();
      return;
    }

    setState("loading", "Searching Wikipedia for “" + name + "”…");
    revealResults();

    try {
      const info = await getMushroomInfo(name);
      if (!info) {
        setState("not-found", "No Wikipedia result was found for “" + name + "”.");
        return;
      }

      renderResult(info);
      setState("success", "Wikipedia result ready: " + (info.title || name) + ".");
    } catch (error) {
      errorRegion.textContent = error.message ||
        "Wikipedia search failed. Please try again.";
      setState("error");
    }
  }

  submitButton.addEventListener("click", searchMushroom);
  nameInput.addEventListener("input", () => {
    if (state === "error") setState("empty");
    errorRegion.textContent = "";
  });
  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchMushroom();
  });
}
