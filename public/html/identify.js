import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";
import { functions } from "./firebase.js";
import { getMushroomInfo } from "./mushroomInfo.js";

// Photo upload and result rendering for the identify page.
const app = document.getElementById('identify-app');
const fileInput = document.getElementById('identify-file');

// This script is optional: do nothing on pages without the identify form.
if (app && fileInput) {
    const dropZone = document.getElementById('identify-drop');
    const submitButton = document.getElementById('identify-submit');
    const removeButton = document.getElementById('identify-remove');
    const statusRegion = document.getElementById('identify-status');
    const errorRegion = document.getElementById('identify-error');
    const previewImage = document.getElementById('identify-preview-img');
    const previewFallback = document.getElementById('preview-fallback');
    const fileNameField = document.getElementById('identify-filename');
    const fileMetaField = document.getElementById('identify-filemeta');
    const resultHeading = document.getElementById('result-heading');
    const resultCard = document.getElementById('result-card');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Verdicts the renderer knows how to draw. Anything else falls back to
    // 'unknown' rather than rendering a blank verdict, which reads as "fine".
    const DANGEROUS = ['deadly', 'poisonous'];
    const KNOWN_TOXICITY = ['deadly', 'poisonous', 'inedible', 'caution', 'edible', 'unknown'];

    const identifyMushroom = httpsCallable(functions, 'identifyMushroom');

    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result));
            reader.addEventListener('error', () => reject(reader.error));
            reader.readAsDataURL(file);
        });
    }

    async function classifyImage(file) {
        const image = await readAsDataUrl(file);
        const response = await identifyMushroom({ image });
        return response.data;
    }

    function getWikipediaQuery(result) {
        if (typeof result.scientificName === 'string' && result.scientificName.trim()) {
            return result.scientificName.trim();
        }

        if (typeof result.commonNameEn !== 'string') return null;
        const commonName = result.commonNameEn.trim();
        return commonName === 'Identification unavailable' ? null : commonName;
    }

    async function enrichResultWithWikipedia(result) {
        const query = getWikipediaQuery(result);
        if (!query) return result;

        try {
            const information = await getMushroomInfo(query);
            if (!information) return result;

            return {
                ...result,
                commonNameEn: result.commonNameEn || information.title,
                wikipediaSummary: information.summary,
                wikipediaUrl: information.wikipediaUrl
            };
        } catch {
            // Wikipedia is supplementary; a lookup failure must not hide the
            // identifier result or make it appear that a mushroom is safe.
            return result;
        }
    }

    let state = 'empty';
    let previewUrl = null;
    let dragDepth = 0;

    // The only place state is written. It never renders: render first, then
    // flip the state to reveal DOM that is already filled in.
    function setState(next, statusText) {
        if (next === state) return;
        state = next;
        app.dataset.state = next;
        // Stays usable after a result so the same photo can be re-run.
        submitButton.disabled = next === 'empty' || next === 'loading' || next === 'error';
        submitButton.textContent = next === 'loading' ? 'Identifying…'
            : next === 'success' || next === 'unavailable' ? 'Identify again →'
            : 'Identify mushroom →';
        statusRegion.textContent = statusText || '';
    }

    function showError(message) {
        errorRegion.textContent = message;
    }

    function clearError() {
        errorRegion.textContent = '';
    }

    // The only place an object URL is released. Forgetting the call in
    // setFile() leaks one blob every time the visitor swaps photos.
    function releasePreview() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }
    }

    function formatSize(bytes) {
        return bytes < 1024 * 1024
            ? Math.round(bytes / 1024) + ' KB'
            : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function setFile(file) {
        releasePreview();

        if (!file.type.startsWith('image/')) {
            showError('That file is not an image. Choose a JPG, PNG, or WEBP photo.');
            fileInput.value = '';
            setState('error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('Choose an image smaller than 5 MB.');
            fileInput.value = '';
            setState('error');
            return;
        }

        clearError();
        previewUrl = URL.createObjectURL(file);
        previewFallback.hidden = true;
        previewImage.hidden = false;
        previewImage.src = previewUrl;
        previewImage.alt = 'Preview of ' + file.name;
        fileNameField.textContent = file.name;
        fileMetaField.textContent = (file.type.split('/')[1] || 'image').toUpperCase() + ' · ' + formatSize(file.size);
        setState('ready', 'Selected ' + file.name + ', ' + formatSize(file.size) + '. Ready to identify.');
    }

    function clearFile() {
        releasePreview();
        previewImage.removeAttribute('src');
        fileInput.value = '';
        clearError();
        setState('empty');
        fileInput.focus();
    }

    // Swap the whole className rather than adding a modifier: .notice and
    // .urgent change background, border and text colour as a set.
    function renderResult(result) {
        const toxicity = KNOWN_TOXICITY.includes(result.toxicity) ? result.toxicity : 'unknown';
        const riskLabel = document.getElementById('result-risk');

        resultCard.className = 'result-card ' + (DANGEROUS.includes(toxicity) ? 'urgent' : 'notice');
        riskLabel.className = 'risk-label' + (toxicity === 'edible' ? ' is-safe' : '');
        riskLabel.textContent = result.toxicityLabel || 'Toxicity unknown';
        document.getElementById('result-name-en').textContent = result.commonNameEn || 'Unnamed species';
        document.getElementById('result-name-zh').textContent = result.commonNameZh || '';
        document.getElementById('result-sci').textContent = result.scientificName || '';
        document.getElementById('result-note').textContent = result.wikipediaSummary || result.note || '';

        const wikipediaLink = document.getElementById('result-wikipedia');
        const wikipediaSource = document.getElementById('result-source');
        if (result.wikipediaUrl) {
            wikipediaLink.href = result.wikipediaUrl;
            wikipediaSource.hidden = false;
        } else {
            wikipediaLink.removeAttribute('href');
            wikipediaSource.hidden = true;
        }
    }

    // Focus first, scroll second: focus() scrolls on its own and would
    // cancel a smooth scroll started before it.
    function revealResults() {
        resultHeading.focus({ preventScroll: true });
        resultHeading.scrollIntoView({
            // Read at call time so a mid-session change to the OS setting is honoured.
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
            block: 'start'
        });
    }

    async function runIdentify() {
        const file = fileInput.files[0];
        if (!file) return;

        setState('loading', 'Analysing photo. This takes a few seconds.');
        revealResults();

        try {
            const classifierResult = await classifyImage(file);
            const result = await enrichResultWithWikipedia(classifierResult);
            if (!result) {
                setState('unavailable', 'The classifier backend is not connected yet.');
                return;
            }
            renderResult(result);
            setState('success', 'Result ready: ' + result.commonNameEn + ', ' + result.toxicityLabel + '.');
        } catch {
            showError('The identification service did not respond. Check your connection and try again.');
            setState('error');
        }
    }

    function resetDrag() {
        dragDepth = 0;
        delete dropZone.dataset.drag;
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) setFile(fileInput.files[0]);
    });
    submitButton.addEventListener('click', runIdentify);
    removeButton.addEventListener('click', clearFile);

    // Some formats decode nowhere but Safari. Keep the file usable, drop the preview.
    previewImage.addEventListener('error', () => {
        if (!previewImage.getAttribute('src')) return;
        previewImage.hidden = true;
        previewFallback.hidden = false;
    });

    // Without these, a photo dropped just outside the zone replaces the whole page.
    document.addEventListener('dragover', (event) => event.preventDefault());
    document.addEventListener('drop', (event) => event.preventDefault());

    dropZone.addEventListener('dragenter', (event) => {
        event.preventDefault();
        if (!Array.from(event.dataTransfer.types).includes('Files')) return;
        // dragenter and dragleave fire per descendant, so count depth instead of
        // toggling on every event, which makes the highlight strobe.
        dragDepth += 1;
        dropZone.dataset.drag = 'over';
    });

    dropZone.addEventListener('dragover', (event) => {
        // This is the call that marks the zone a valid drop target.
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    dropZone.addEventListener('dragleave', () => {
        dragDepth -= 1;
        if (dragDepth <= 0) resetDrag();
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        resetDrag();

        const file = event.dataTransfer.files[0];
        if (!file) return;

        // Write the file back into the input so it stays the single source of truth.
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        setFile(file);
    });

    // The depth counter sticks when a drag leaves the window, so reset it hard.
    dropZone.addEventListener('dragend', resetDrag);
    window.addEventListener('dragleave', (event) => {
        if (event.relatedTarget === null) resetDrag();
    });
    window.addEventListener('pagehide', releasePreview);
}
