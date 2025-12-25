const videoInput = document.getElementById("videoInput");
const video = document.getElementById("videoPlayer");
const appContainer = document.getElementById("appContainer");
const chatBox = document.getElementById("chatBox");
const activeSubtitle = document.getElementById("activeSubtitle");
const statusText = document.getElementById("status");
const dropZone = document.getElementById("dropZone");
const videoContainer = document.getElementById("videoContainer");
const resetBtn = document.getElementById("resetBtn");

let timeline = [];
let lastIndex = -1;

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // Show the New Video button by default for the preview video
    resetBtn.style.display = "inline-block";
    statusText.textContent = "PREVIEW";
});

// --- RESET LOGIC ---
function resetUI() {
    video.pause();
    video.src = "";
    video.load();

    timeline = [];
    lastIndex = -1;
    chatBox.innerHTML = "";
    activeSubtitle.textContent = "";
    activeSubtitle.style.opacity = "0";

    // Switch view to Upload Zone
    videoContainer.style.display = "none";
    resetBtn.style.display = "none";
    dropZone.style.display = "flex";
    
    statusText.textContent = "READY";
    videoInput.value = ""; 
}

// --- UPLOAD LOGIC ---
videoInput.addEventListener("change", () => {
    if (videoInput.files[0]) handleFileUpload(videoInput.files[0]);
});

dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("drag-over"); });
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) handleFileUpload(file);
});

async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append("video", file);
    statusText.textContent = "UPLOADING...";

    try {
        const response = await fetch("/upload", { method: "POST", body: formData });
        const data = await response.json();
        
        timeline = data.timeline;
        video.src = `/videos/${data.filename}`;
        
        dropZone.style.display = "none";
        videoContainer.style.display = "flex";
        resetBtn.style.display = "inline-block";
        
        statusText.textContent = "CONNECTED";
        video.play();
    } catch (err) {
        statusText.textContent = "ERROR";
        console.error(err);
    }
}

// --- SYNC LOGIC ---
video.addEventListener("timeupdate", () => {
    if (timeline.length === 0) return;
    const current = video.currentTime;
    
    const currentIndex = timeline.findLastIndex(m => m.time <= current);
    if (currentIndex !== lastIndex) {
        lastIndex = currentIndex;
        chatBox.innerHTML = timeline
            .slice(0, currentIndex + 1)
            .map(m => `<div class="history-item">${m.text}</div>`)
            .join('');
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    const currentMsg = timeline.findLast(m => current >= m.time && current < m.time + 3);
    if (currentMsg) {
        activeSubtitle.textContent = currentMsg.text;
        activeSubtitle.style.opacity = "1";
    } else {
        activeSubtitle.style.opacity = "0";
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        appContainer.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
}