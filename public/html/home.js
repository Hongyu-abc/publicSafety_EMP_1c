// Respect reduced motion and let visitors pause the decorative video.
const video = document.getElementById('home-video');
const toggle = document.querySelector('.video-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function updateLabel() {
    toggle.textContent = video.paused ? 'Play background video' : 'Pause background video';
}

async function playVideo() {
    try {
        await video.play();
    } catch {
        // The static background and page content remain usable if playback is blocked.
        updateLabel();
    }
}

toggle.hidden = false;
toggle.addEventListener('click', () => {
    if (video.paused) playVideo();
    else video.pause();
});
video.addEventListener('play', updateLabel);
video.addEventListener('pause', updateLabel);
video.addEventListener('error', () => { toggle.hidden = true; });
video.querySelector('source').addEventListener('error', () => { toggle.hidden = true; });
reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) video.pause();
});
if (!reducedMotion.matches) playVideo();