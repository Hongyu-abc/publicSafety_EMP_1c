const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Fetches basic information about a mushroom from the English Wikipedia API.
 * Wikipedia information must not be used to decide whether a wild mushroom is
 * safe to eat.
 *
 * @param {string} name A common or scientific mushroom name to search for.
 * @returns {Promise<{title: string | null, description: string | null,
 * summary: string | null, imageUrl: string | null, wikipediaUrl: string | null,
 * isDisambiguation: boolean} | null>} Mushroom information, or `null`.
 * @throws {Error} If the input, request, or API response is invalid.
 */
export async function getMushroomInfo(name) {
  if (typeof name !== "string") {
    throw new Error("Mushroom name must be a string.");
  }

  const query = name.trim();
  if (!query) {
    throw new Error("Mushroom name cannot be blank.");
  }

  const searchData = await fetchWikipediaJson({
    action: "query", list: "search", srsearch: query, srnamespace: "0",
    srlimit: "1", format: "json", formatversion: "2", origin: "*",
  });
  const results = searchData?.query?.search;
  if (!Array.isArray(results)) {
    throw new Error("Wikipedia returned an unexpected search response.");
  }
  if (results.length === 0) return null;

  const title = results[0]?.title;
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Wikipedia returned a search result without a title.");
  }

  const pageData = await fetchWikipediaJson({
    action: "query", titles: title,
    prop: "description|extracts|pageimages|pageprops|info", inprop: "url",
    exintro: "1", explaintext: "1", piprop: "thumbnail", pithumbsize: "600",
    redirects: "1", format: "json", formatversion: "2", origin: "*",
  });
  const pages = pageData?.query?.pages;
  if (!Array.isArray(pages)) {
    throw new Error("Wikipedia returned an unexpected page response.");
  }

  const page = pages.find((candidate) => !candidate?.missing);
  if (!page) return null;
  if (typeof page !== "object") {
    throw new Error("Wikipedia returned an invalid page response.");
  }

  return {
    title: optionalString(page.title),
    description: optionalString(page.description),
    summary: optionalString(page.extract),
    imageUrl: optionalString(page.thumbnail?.source),
    wikipediaUrl: optionalString(page.fullurl),
    isDisambiguation: Object.prototype.hasOwnProperty.call(
        page.pageprops || {}, "disambiguation"),
  };
}

async function fetchWikipediaJson(parameters) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(WIKIPEDIA_API_URL);
  url.search = new URLSearchParams(parameters).toString();

  try {
    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" }, signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted || error?.name === "AbortError") {
        throw new Error("Wikipedia request timed out after 8 seconds.");
      }
      throw new Error(`Wikipedia request failed: ${error.message || "network error"}`);
    }
    if (!response.ok) {
      throw new Error(`Wikipedia request failed with HTTP ${response.status}.`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Wikipedia returned invalid JSON.");
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Wikipedia returned an unexpected JSON response.");
    }
    if (data.error) {
      throw new Error(`Wikipedia API error: ${data.error.info || "unknown error"}`);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Example:
// const mushroom = await getMushroomInfo("fly agaric");
// console.log(mushroom?.title);
