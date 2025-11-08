// State
let selectedFile = null;
let currentMode = 'linear';
let isImageFile = false;

// Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const removeFileBtn = document.getElementById('removeFile');
const convertBtn = document.getElementById('convertBtn');
const loading = document.getElementById('loading');
const downloadBtn = document.getElementById('downloadBtn');
const counterValue = document.getElementById('counterValue');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const imageControls = document.getElementById('imageControls');

// Parameter elements
const height = document.getElementById('height');
const heightValue = document.getElementById('heightValue');
const twist = document.getElementById('twist');
const twistValue = document.getElementById('twistValue');
const scale = document.getElementById('scale');
const scaleValue = document.getElementById('scaleValue');
const modeLinear = document.getElementById('modeLinear');
const modeRotate = document.getElementById('modeRotate');
const modeValue = document.getElementById('modeValue');

// Image-specific parameters
const detail = document.getElementById('detail');
const detailValue = document.getElementById('detailValue');
const smoothness = document.getElementById('smoothness');
const smoothnessValue = document.getElementById('smoothnessValue');
const contrast = document.getElementById('contrast');
const contrastValue = document.getElementById('contrastValue');

// Fetch and display counter on page load
async function fetchCounter() {
    try {
        const response = await fetch('/api/counter');
        const data = await response.json();
        counterValue.textContent = data.count.toLocaleString();
    } catch (error) {
        console.error('Failed to fetch counter:', error);
    }
}

function updateCounter(count) {
    counterValue.textContent = count.toLocaleString();
}

// Load counter on startup
fetchCounter();

// Download button handler - tracks downloads
downloadBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/track-download', {
            method: 'POST'
        });
        const data = await response.json();
        if (data.count) {
            updateCounter(data.count);
        }
    } catch (error) {
        console.error('Failed to track download:', error);
    }
});

// File upload handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

removeFileBtn.addEventListener('click', () => {
    resetForm();
});

function handleFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'bmp'];

    if (!validExtensions.includes(ext)) {
        alert('Please select an SVG or image file');
        return;
    }

    selectedFile = file;
    isImageFile = ext !== 'svg';

    fileName.textContent = file.name;
    dropZone.style.display = 'none';
    preview.style.display = 'block';

    // Show/hide image-specific controls
    if (isImageFile) {
        imageControls.style.display = 'grid';
    } else {
        imageControls.style.display = 'none';
    }
}

// Mode selection
modeLinear.addEventListener('click', () => {
    currentMode = 'linear';
    modeLinear.classList.add('active');
    modeRotate.classList.remove('active');
    modeValue.textContent = 'Linear';
});

modeRotate.addEventListener('click', () => {
    currentMode = 'rotate';
    modeRotate.classList.add('active');
    modeLinear.classList.remove('active');
    modeValue.textContent = 'Rotate (Lathe)';
});

// Parameter updates
height.addEventListener('input', (e) => {
    heightValue.textContent = `${e.target.value}mm`;
});

twist.addEventListener('input', (e) => {
    twistValue.textContent = `${e.target.value}°`;
});

scale.addEventListener('input', (e) => {
    scaleValue.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
});

// Image parameter updates
detail.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    let label;
    if (value <= 3) label = 'Low';
    else if (value <= 7) label = 'Medium';
    else label = 'High';
    detailValue.textContent = label;
});

smoothness.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    let label;
    if (value <= 3) label = 'Sharp';
    else if (value <= 7) label = 'Medium';
    else label = 'Smooth';
    smoothnessValue.textContent = label;
});

contrast.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    let label;
    if (value <= 3) label = 'Dark';
    else if (value <= 7) label = 'Medium';
    else label = 'Light';
    contrastValue.textContent = label;
});

// Map simple sliders to technical parameters (for images)
function getImageConversionParams() {
    const detailValue = parseInt(detail.value);
    const smoothnessValue = parseInt(smoothness.value);
    const contrastValue = parseInt(contrast.value);

    // Map detail (1-10) to turdSize (20 to 1)
    let turdSize;
    if (detailValue <= 2) turdSize = 20;
    else if (detailValue <= 4) turdSize = 10;
    else if (detailValue <= 6) turdSize = 5;
    else if (detailValue <= 8) turdSize = 2;
    else turdSize = 1;

    // Map smoothness (1-10) to optTolerance (0.1 to 0.4)
    let optTolerance;
    if (smoothnessValue <= 3) optTolerance = 0.1;
    else if (smoothnessValue <= 7) optTolerance = 0.2;
    else optTolerance = 0.4;

    // Map contrast (1-10) to threshold (64 to 192)
    const threshold = Math.round(64 + (contrastValue - 1) * (192 - 64) / 9);

    return { threshold, turdSize, optTolerance };
}

// Convert button handler
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const successOverlay = document.getElementById('successOverlay');
    const progressFill = document.getElementById('progressFill');
    const stepText = document.getElementById('stepText');

    // Show loading overlay
    loading.style.display = 'flex';
    progressFill.style.width = '0%';

    try {
        // Build form data
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('height', height.value);
        formData.append('twistAngle', twist.value);
        formData.append('scale', scale.value);
        formData.append('mode', currentMode);

        // Add image-specific parameters
        if (isImageFile) {
            const imageParams = getImageConversionParams();
            formData.append('threshold', imageParams.threshold);
            formData.append('turdSize', imageParams.turdSize);
            formData.append('optTolerance', imageParams.optTolerance);
            formData.append('optCurve', 'true');
        }

        // Simulate progress
        stepText.textContent = isImageFile ? 'Vectorizing image...' : 'Parsing SVG...';
        progressFill.style.width = '30%';

        setTimeout(() => {
            stepText.textContent = 'Extruding to 3D...';
            progressFill.style.width = '60%';
        }, 500);

        setTimeout(() => {
            stepText.textContent = 'Generating STL...';
            progressFill.style.width = '80%';
        }, 1000);

        // Make API call
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.files && data.files.stl) {
            progressFill.style.width = '100%';
            stepText.textContent = 'Complete!';

            // Hide loading, show success
            setTimeout(() => {
                loading.style.display = 'none';
                successOverlay.style.display = 'flex';

                // Set up download button
                downloadBtn.href = data.files.stl;
                downloadBtn.download = data.files.stl.split('/').pop();

                // Hide success overlay and show glowing download button
                setTimeout(() => {
                    successOverlay.style.display = 'none';
                    downloadBtn.style.display = 'inline-flex';
                    downloadBtn.classList.remove('glow-hidden');
                    downloadBtn.classList.add('glow-active');
                }, 2000);
            }, 500);
        } else {
            throw new Error(data.message || 'Conversion failed');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        loading.style.display = 'none';
        alert(`Conversion failed: ${error.message}`);
    }
});

function resetForm() {
    selectedFile = null;
    isImageFile = false;
    fileInput.value = '';
    fileName.textContent = 'No file selected';
    preview.style.display = 'none';
    dropZone.style.display = 'block';
    loading.style.display = 'none';
    imageControls.style.display = 'none';

    // Hide and reset download button
    downloadBtn.classList.remove('glow-active');
    downloadBtn.classList.add('glow-hidden');
    setTimeout(() => {
        downloadBtn.style.display = 'none';
    }, 300);

    // Reset progress bar
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = '0%';

    // Reset parameters to defaults
    height.value = 5;
    heightValue.textContent = '5mm';
    twist.value = 0;
    twistValue.textContent = '0°';
    scale.value = 1;
    scaleValue.textContent = '1.0x';

    currentMode = 'linear';
    modeLinear.classList.add('active');
    modeRotate.classList.remove('active');
    modeValue.textContent = 'Linear';

    detail.value = 5;
    detailValue.textContent = 'Medium';
    smoothness.value = 5;
    smoothnessValue.textContent = 'Medium';
    contrast.value = 5;
    contrastValue.textContent = 'Medium';
}
