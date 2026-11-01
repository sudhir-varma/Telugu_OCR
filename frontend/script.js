let currentFileUrl = null;
let activeFileBlob = null;

function handleFileSelect() {
    const fileInput = document.getElementById("imageInput");
    const viewImageBtn = document.getElementById("viewImageBtn");
    const previewImg = document.getElementById("previewImg");

    if (fileInput.files && fileInput.files[0]) {
        activeFileBlob = fileInput.files[0];

        if (currentFileUrl) URL.revokeObjectURL(currentFileUrl);
        currentFileUrl = URL.createObjectURL(activeFileBlob);

        previewImg.src = currentFileUrl;
        viewImageBtn.style.display = "inline-block";
    } else {
        activeFileBlob = null;
        viewImageBtn.style.display = "none";
        hideImagePanel();
    }
}

async function captureLiveImage() {
    const captureBtn = document.getElementById("captureWebcamBtn");
    const viewImageBtn = document.getElementById("viewImageBtn");
    const previewImg = document.getElementById("previewImg");
    const fileInput = document.getElementById("imageInput");

    captureBtn.disabled = true;

    try {
        const response = await fetch("http://127.0.0.1:8000/capture-image");
        if (!response.ok) throw new Error("Capture cancelled or failed.");

        activeFileBlob = await response.blob();
        fileInput.value = "";

        if (currentFileUrl) URL.revokeObjectURL(currentFileUrl);
        currentFileUrl = URL.createObjectURL(activeFileBlob);

        previewImg.src = currentFileUrl;
        viewImageBtn.style.display = "inline-block";
    } catch (error) {
        console.error(error);
        if (!error.message.includes("cancelled")) {
            alert("Error accessing webcam. Ensure backend is running.");
        }
    } finally {
        captureBtn.disabled = false;
    }
}

function toggleViewImage() {
    const wrapper = document.getElementById("mainWrapper");
    if (!currentFileUrl) {
        alert("Please choose an image file first!");
        return;
    }
    wrapper.classList.toggle("show-image");
}

function hideImagePanel() {
    const wrapper = document.getElementById("mainWrapper");
    wrapper.classList.remove("show-image");
}

async function extractText() {
    const extractBtn = document.getElementById("extractBtn");
    const extractLoading = document.getElementById("extractLoading");
    const textInput = document.getElementById("textInput");

    if (!activeFileBlob) {
        alert("Please select a file or capture a live image first!");
        return;
    }

    const formData = new FormData();
    formData.append("file", activeFileBlob, "document.jpg");

    extractBtn.disabled = true;
    extractLoading.style.display = "block";
    textInput.value = "";

    try {
        const response = await fetch("http://127.0.0.1:8000/extract-text", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Failed to extract text from the server.");

        const data = await response.json();
        if (data.text) {
            textInput.value = data.text;
        } else {
            alert("No text was found in this document.");
        }
    } catch (error) {
        console.error(error);
        alert("Error extracting text. Make sure your FastAPI backend is running.");
    } finally {
        extractBtn.disabled = false;
        extractLoading.style.display = "none";
    }
}

async function generateSpeech() {
    const textInput = document.getElementById("textInput").value.trim();
    const generateBtn = document.getElementById("generateBtn");
    const audioLoading = document.getElementById("audioLoading");
    const audioPlayer = document.getElementById("audioPlayer");

    if (!textInput) {
        alert("Text box is empty! Please upload a file or type something manually.");
        return;
    }

    generateBtn.disabled = true;
    audioLoading.style.display = "block";
    audioPlayer.style.display = "none";

    try {
        const response = await fetch("http://127.0.0.1:8000/generate-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: textInput,
                target_language_code: "te-IN",
                speaker: "shubh_enhi_ads",
                model: "bulbul:v4-flash",
            }),
        });

        if (!response.ok) throw new Error("Server Error on TTS generation.");

        const blob = await response.blob();
        audioPlayer.src = URL.createObjectURL(blob);
        audioPlayer.style.display = "block";
        audioPlayer.play();
    } catch (error) {
        console.error(error);
        alert("Failed to generate audio.");
    } finally {
        generateBtn.disabled = false;
        audioLoading.style.display = "none";
    }
}

async function generateBraille() {
    const textInput = document.getElementById("textInput").value.trim();
    const brailleBtn = document.getElementById("brailleBtn");
    const brailleContainer = document.getElementById("brailleContainer");
    const brailleOutput = document.getElementById("brailleOutput");

    if (!textInput) {
        alert("Text box is empty! Please upload a document or type Telugu text first.");
        return;
    }

    brailleBtn.disabled = true;
    brailleBtn.textContent = "Translating...";

    try {
        const response = await fetch("http://127.0.0.1:8000/convert-braille", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textInput }),
        });

        if (!response.ok) throw new Error("Failed to convert to Braille.");
        const data = await response.json();

        brailleOutput.value = data.braille;
        brailleContainer.style.display = "block";
    } catch (error) {
        console.error(error);
        alert("Failed to generate Braille. Ensure the backend is running.");
    } finally {
        brailleBtn.disabled = false;
        brailleBtn.textContent = "Generate Braille";
    }
}

function downloadBRF() {
    const brailleText = document.getElementById("brailleOutput").value.trim();
    if (!brailleText) {
        alert("No Braille text available! Please generate the Braille translation first.");
        return;
    }
    const blob = new Blob([brailleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "telugu_document.brf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
