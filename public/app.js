// State Management
let currentLocation = null;
let currentDigipin = null;
let map = null;
let marker = null;

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const loadingMsg = document.getElementById('loadingMsg');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const resultSection = document.getElementById('resultSection');
const digipinCode = document.getElementById('digipinCode');
const coordsText = document.getElementById('coordsText');
const copyBtn = document.getElementById('copyBtn');
const googleMapsBtn = document.getElementById('googleMapsBtn');
const shareBtn = document.getElementById('shareBtn');

const decodeInput = document.getElementById('decodeInput');
const decodeBtn = document.getElementById('decodeBtn');
const decodeResult = document.getElementById('decodeResult');
const decodeLat = document.getElementById('decodeLat');
const decodeLon = document.getElementById('decodeLon');
const showDecodeMapBtn = document.getElementById('showDecodeMapBtn');

const toast = document.getElementById('toast');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// API Base URL
const API_BASE = window.location.origin;

// Utility Functions
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showError(message) {
    errorText.textContent = message;
    errorMsg.style.display = 'flex';
    loadingMsg.style.display = 'none';
}

function hideError() {
    errorMsg.style.display = 'none';
}

function showLoading() {
    loadingMsg.style.display = 'flex';
    hideError();
}

function hideLoading() {
    loadingMsg.style.display = 'none';
}

function switchTab(tabId) {
    // Update buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Find the tab content to show
    const targetContent = document.getElementById(tabId + 'Tab');
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// Get User Location
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                let message = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location unavailable. Check GPS.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Call DIGIPIN Encode API
async function encodeDigipin(latitude, longitude) {
    const response = await fetch(
        `${API_BASE}/api/digipin/encode?latitude=${latitude}&longitude=${longitude}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate DIGIPIN');
    }

    return await response.json();
}

// Call DIGIPIN Decode API
async function decodeDigipin(digipin) {
    const response = await fetch(
        `${API_BASE}/api/digipin/decode?digipin=${digipin}`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decode DIGIPIN');
    }

    return await response.json();
}

// Initialize Map
function initMap(latitude, longitude, digipinLabel) {
    // If map container is hidden or not in DOM, this might fail, but it's inside resultSection which we show first.
    
    // If map already exists, remove it
    if (map) {
        map.remove();
        map = null;
    }

    // Create new map
    map = L.map('map').setView([latitude, longitude], 18);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Create custom icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: #2563eb;
            color: white;
            padding: 6px 10px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            white-space: nowrap;
            display: inline-block;
        ">${digipinLabel}</div>`,
        iconSize: [100, 30],
        iconAnchor: [50, 30]
    });

    // Add marker
    marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

    // Add popup
    marker.bindPopup(`
        <div style="text-align: center;">
            <strong>${digipinLabel}</strong><br>
            <small>${latitude.toFixed(6)}, ${longitude.toFixed(6)}</small>
        </div>
    `).openPopup();

    // Add circle to show precision area
    L.circle([latitude, longitude], {
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.15,
        radius: 2.83
    }).addTo(map);
    
    // Trigger resize to ensure map renders correctly if it was hidden
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Generate DIGIPIN Handler
async function handleGenerate() {
    generateBtn.disabled = true;
    showLoading();
    hideError();
    resultSection.style.display = 'none';

    try {
        // Step 1: Get user location
        currentLocation = await getUserLocation();

        // Step 2: Encode to DIGIPIN
        const data = await encodeDigipin(currentLocation.latitude, currentLocation.longitude);
        currentDigipin = data.digipin;

        // Step 3: Display results
        hideLoading();
        displayResults();

    } catch (error) {
        hideLoading();
        showError(error.message);
    } finally {
        generateBtn.disabled = false;
    }
}

// Display Results
function displayResults() {
    digipinCode.textContent = currentDigipin;
    coordsText.textContent = `📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;

    resultSection.style.display = 'block';

    // Initialize map
    initMap(currentLocation.latitude, currentLocation.longitude, currentDigipin);

    // Scroll to results if needed
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy DIGIPIN to Clipboard
function copyToClipboard() {
    if (!currentDigipin) return;
    navigator.clipboard.writeText(currentDigipin).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

// Open in Google Maps
function openGoogleMaps() {
    if (!currentLocation) return;
    const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
    window.open(url, '_blank');
}

// Share DIGIPIN
async function shareDigipin() {
    if (!currentDigipin || !currentLocation) return;
    
    const shareText = `My DIGIPIN: ${currentDigipin}\nLocation: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My DIGIPIN',
                text: shareText,
                url: `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`
            });
            showToast('Shared successfully!');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard();
            }
        }
    } else {
        copyToClipboard();
    }
}

// Decode DIGIPIN Handler
async function handleDecode() {
    const inputDigipin = decodeInput.value.trim().toUpperCase();

    if (!inputDigipin) {
        showToast('Please enter a DIGIPIN');
        return;
    }

    decodeBtn.disabled = true;
    decodeBtn.textContent = '...';
    decodeResult.style.display = 'none';

    try {
        const data = await decodeDigipin(inputDigipin);

        decodeLat.textContent = data.latitude;
        decodeLon.textContent = data.longitude;
        decodeResult.style.display = 'block';

        // Store for map display
        decodeResult.dataset.lat = data.latitude;
        decodeResult.dataset.lon = data.longitude;
        decodeResult.dataset.digipin = inputDigipin;

    } catch (error) {
        showToast(error.message);
    } finally {
        decodeBtn.disabled = false;
        decodeBtn.textContent = 'Find';
    }
}

// Show Decoded Location on Map
function showDecodeOnMap() {
    const lat = parseFloat(decodeResult.dataset.lat);
    const lon = parseFloat(decodeResult.dataset.lon);
    const digipin = decodeResult.dataset.digipin;

    // Switch to Generate Tab (which has the map)
    switchTab('generate');
    
    // Update current location state
    currentLocation = { latitude: lat, longitude: lon };
    currentDigipin = digipin;

    // Display results in the main result section
    digipinCode.textContent = digipin;
    coordsText.textContent = `📍 ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    resultSection.style.display = 'block';

    // Init map
    initMap(lat, lon, digipin);
}

// Format DIGIPIN Input
decodeInput.addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add hyphens at positions 3 and 6
    if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    }
    if (value.length > 7) {
        value = value.slice(0, 7) + '-' + value.slice(7);
    }

    e.target.value = value;
});

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
copyBtn.addEventListener('click', copyToClipboard);
googleMapsBtn.addEventListener('click', openGoogleMaps);
shareBtn.addEventListener('click', shareDigipin);
decodeBtn.addEventListener('click', handleDecode);
showDecodeMapBtn.addEventListener('click', showDecodeOnMap);

// Allow Enter key to decode
decodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDecode();
    }
});

// Check geolocation on load
window.addEventListener('load', () => {
    if (!navigator.geolocation) {
        // Just show a subtle toast or disable button visually if needed
        // generateBtn.disabled = true; // Optional: Keep enabled to let user try and fail gracefully with error msg
    }
});
