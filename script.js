// Configuration variables
const scheduledDateTime = new Date('2025-01-14T04:50:00+03:00');
const m3uLinks = {
  random: "https://www.streamadqfm.store/out-put.m3u",
  exclusive: "https://www.streamadqfm.store/%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A-.m3u",
  tobalawi: "https://www.streamadqfm.store/%D8%A7%D9%84%D8%B7%D8%A8%D9%84%D8%A7%D9%88%D9%8A-.m3u",
  manshawi: "https://www.streamadqfm.store/%D8%A7%D9%84%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8A-.m3u",
  abdbasat: "https://www.streamadqfm.store/%D8%B9%D8%A8%D8%AF-%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7.m3u",
  mahmoudbanna: "https://www.streamadqfm.store/%D9%85%D8%AD%D9%85%D9%88%D8%AF-%D8%A7%D9%84%D8%A8%D9%86%D8%A7.m3u",
  mahmoudeyup: "https://www.streamadqfm.store/%D9%85%D8%AD%D9%85%D8%AF%20%D8%A3%D9%8A%D9%88%D8%A8.m3u",
  SaadAlGhamdi: "https://www.streamadqfm.store/%D8%B3%D8%B9%D8%AF%20%D8%A7%D9%84%D8%BA%D8%A7%D9%85%D8%AF%D9%8A.m3u"
};

const translationFiles = {
  en: "https://www.streamadqfm.store/translated/en/main.json",
  de: "https://www.streamadqfm.store/translated/en/translation_de.json",
  fr: "https://www.streamadqfm.store/translated/en/translation_fr.json",
  hi: "https://www.streamadqfm.store/translated/en/translation_hi.json",
  id: "https://www.streamadqfm.store/translated/en/translation_id.json",
  it: "https://www.streamadqfm.store/translated/en/translation_it.json",
  ja: "https://www.streamadqfm.store/translated/en/translation_ja.json",
  ko: "https://www.streamadqfm.store/translated/en/translation_ko.json",
  nl: "https://www.streamadqfm.store/translated/en/translation_nl.json",
  pt: "https://www.streamadqfm.store/translated/en/translation_pt.json",
  ru: "https://www.streamadqfm.store/translated/en/translation_ru.json",
  sw: "https://www.streamadqfm.store/translated/en/translation_sw.json",
  tr: "https://www.streamadqfm.store/translated/en/translation_tr.json",
  zh: "https://www.streamadqfm.store/translated/en/translation_zh-cn.json"
};

// Global variables
let tracks = [];
let isTracksReady = false;
let currentTrackIndex = 0;
let currentReader = '';
let isPlaying = false;
let translations = {};
let isTranslated = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Check if the current device is an Apple device
const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
console.log("Is Apple device:", isAppleDevice);

// Load language preference from localStorage
const savedLanguage = localStorage.getItem('language') || 'ar';
isTranslated = savedLanguage !== 'ar';

/**
 * Properly encodes URL to handle special characters and Arabic text
 * @param {string} url - The URL to encode
 * @returns {string} - The encoded URL
 */
function encodeAudioUrl(url) {
  try {
    // First, break the URL into parts (protocol, domain, path)
    const urlObj = new URL(url);
    const baseUrl = urlObj.origin; // This gives us https://www.streamadqfm.store
    let pathParts = urlObj.pathname.split('/').filter(part => part !== '');
    
    // Encode each path part individually
    const encodedPathParts = pathParts.map(part => {
      // First try to decode in case it's already encoded
      try {
        const decoded = decodeURIComponent(part);
        return encodeURIComponent(decoded);
      } catch (e) {
        // If decoding fails, it might be partially encoded or not encoded at all
        return encodeURIComponent(part);
      }
    });
    
    // Reassemble the URL
    return `${baseUrl}/${encodedPathParts.join('/')}`;
  } catch (e) {
    console.error("Error encoding URL:", e);
    // If there's an error in encoding, return the original URL
    return url;
  }
}

/**
 * Loads tracks from M3U playlist URL
 * @param {string} url - The URL of the M3U playlist
 * @returns {Promise<boolean>} - Success status
 */
async function loadTracks(url) {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'block';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const lines = text.split("\n").filter(line => line.trim() !== "");
    tracks = [];
    let tempTrack = null;
    for (const line of lines) {
      if (line.startsWith("#EXTINF:")) {
        const parts = line.slice(8).split(",");
        const duration = Math.max(parseFloat(parts[0]) || 1800, 0);
        const name = parts[1]?.trim() || "Unknown Track";
        tempTrack = { duration, name };
      } else if (tempTrack && !line.startsWith("#")) {
        tempTrack.url = line.trim();
        tracks.push(tempTrack);
        tempTrack = null;
      }
    }
    isTracksReady = tracks.length > 0;
    displayTrackList();
    return true;
  } catch (error) {
    console.error('Error in loadTracks:', error);
    isTracksReady = false;
    tracks = [];
    alert(`Failed to load tracks: ${error.message}`);
    return false;
  } finally {
    spinner.style.display = 'none';
  }
}

/**
 * Displays the track list in the UI
 */
function displayTrackList() {
  const trackListDiv = document.getElementById('trackList');
  trackListDiv.innerHTML = tracks.map((track, index) => `
    <div class="trackItem ${index === currentTrackIndex ? 'active' : ''}" onclick="playTrack(${index})">
      ${translations[track.name] || track.name}
    </div>
  `).join('');
}

/**
 * Loads translations for a specific language
 * @param {string} lang - Language code
 */
async function loadTranslations(lang = 'en') {
  if (lang === 'ar') {
    translations = {};
    return;
  }
  
  const url = translationFiles[lang];
  if (!url) {
    console.error(`Translation file for language '${lang}' not found.`);
    return;
  }
  
  try {
    const response = await fetch(`${url}?v=${new Date().getTime()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    translations = await response.json();
    console.log(`Translations loaded for language: ${lang}`, translations);
  } catch (error) {
    console.error(`Error loading translations for language '${lang}':`, error);
    translations = {};
  }
}

/**
 * Translates the UI elements based on the selected language
 * @param {string} lang - Language code
 */
function translateUI(lang = 'ar') {
  const elementsToTranslate = document.querySelectorAll('[data-translate]');
  elementsToTranslate.forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[key] && lang !== 'ar') {
      element.textContent = translations[key];
    } else {
      element.textContent = element.getAttribute('data-ar');
    }
  });

  const trackItems = document.querySelectorAll('.trackItem');
  trackItems.forEach((item, index) => {
    const track = tracks[index];
    if (track && translations[track.name] && lang !== 'ar') {
      item.textContent = translations[track.name];
    } else if (track) {
      item.textContent = track.name;
    }
  });

  const selectOptions = document.querySelectorAll('#readerSelect option');
  selectOptions.forEach(option => {
    const key = option.getAttribute('data-translate');
    if (translations[key] && lang !== 'ar') {
      option.textContent = translations[key];
    } else {
      option.textContent = option.getAttribute('data-ar');
    }
  });

  const currentTrackDiv = document.getElementById("currentTrack");
  if (currentTrackDiv && (currentTrackDiv.textContent.includes("تستمعون الى:") || currentTrackDiv.textContent.includes("You are listening to:"))) {
    const trackName = currentTrackDiv.textContent.split(":")[1]?.trim();
    if (trackName) {
      const nowPlayingText = lang === 'ar' ? 'تستمعون الى:' : translations['تستمعون الى:'] || 'You are listening to:';
      currentTrackDiv.textContent = `${nowPlayingText} ${translations[trackName] || trackName}`;
    }
  }

  // Apply RTL or LTR direction based on the selected language
  const aboutText = document.querySelector('.about-text');
  if (aboutText) {
    if (lang === 'ar') {
      aboutText.classList.add('rtl');
      aboutText.classList.remove('ltr');
      document.documentElement.dir = 'rtl';
    } else {
      aboutText.classList.add('ltr');
      aboutText.classList.remove('rtl');
      document.documentElement.dir = 'ltr';
    }
  }
}

/**
 * Calculates which track to play based on the current time
 */
function calculateTrackToPlay() {
  const now = new Date();
  const button = document.getElementById('playButton');
  const loadingText = translations['جاري التجهيز...'] || 'جاري التجهيز...';
  button.textContent = loadingText;

  if (!isTracksReady || tracks.length === 0) {
    console.error('Tracks not ready or empty');
    alert('Please wait for tracks to load');
    button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
    return;
  }

  const totalDuration = tracks.reduce((acc, track) => acc + track.duration, 0);
  const elapsedSeconds = Math.floor((now - scheduledDateTime) / 1000);

  console.log('Total duration:', totalDuration, 'Elapsed seconds:', elapsedSeconds);

  let remainingTime = elapsedSeconds % totalDuration;
  let accumulatedTime = 0;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    accumulatedTime += track.duration;

    if (remainingTime < accumulatedTime) {
      const trackOffset = remainingTime - (accumulatedTime - track.duration);
      currentTrackIndex = i;

      console.log(`Playing track ${i} (${track.name}) from ${trackOffset}s`);

      setTimeout(() => {
        playTrack(i, trackOffset);
        button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
      }, 1000);
      return;
    }
  }

  setTimeout(() => {
    playTrack(0, 0);
    button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
  }, 1000);
}

/**
 * Try alternative audio formats and sources
 * @param {string} baseUrl - The original audio URL
 * @returns {Array} - Array of alternative URLs to try
 */
function getAudioAlternatives(baseUrl) {
  const alternatives = [];
  
  // Try different formats
  if (baseUrl.toLowerCase().endsWith('.ogg')) {
    alternatives.push(baseUrl.replace(/\.ogg$/i, '.mp3'));
    alternatives.push(baseUrl.replace(/\.ogg$/i, '.m4a'));
  } else if (baseUrl.toLowerCase().endsWith('.mp3')) {
    alternatives.push(baseUrl.replace(/\.mp3$/i, '.ogg'));
    alternatives.push(baseUrl.replace(/\.mp3$/i, '.m4a'));
  } else if (baseUrl.toLowerCase().endsWith('.m4a')) {
    alternatives.push(baseUrl.replace(/\.m4a$/i, '.mp3'));
    alternatives.push(baseUrl.replace(/\.m4a$/i, '.ogg'));
  }
  
  return alternatives;
}

/**
 * Plays a specific track
 * @param {number} index - Track index
 * @param {number} startTime - Start time in seconds
 * @param {boolean} isRandom - Whether it's a random track
 * @param {number} retryAttempt - Current retry attempt number
 * @param {Array} alternativeUrls - Alternative URLs to try
 */
function playTrack(index, startTime = 0, isRandom = false, retryAttempt = 0, alternativeUrls = []) {
  const audioPlayer = document.getElementById("audioPlayer");
  const currentTrackDiv = document.getElementById("currentTrack");

  // Reset retry count for a new track
  if (retryAttempt === 0) {
    retryCount = 0;
  }

  if (!tracks[index]) {
    console.error(`Invalid track index: ${index}`);
    return;
  }

  const track = tracks[index];
  currentTrackIndex = index;
  isPlaying = true;
  
  // Get appropriate URL based on device
  let audioUrl;
  
  // If we're retrying with alternative URLs
  if (alternativeUrls.length > 0 && retryAttempt < alternativeUrls.length) {
    audioUrl = alternativeUrls[retryAttempt];
    console.log(`Retry ${retryAttempt + 1}/${alternativeUrls.length} with alternative URL: ${audioUrl}`);
  } else {
    audioUrl = track.url;
    
    // For Apple devices, replace OGG with MP3
    if (isAppleDevice && audioUrl.toLowerCase().endsWith('.ogg')) {
      audioUrl = audioUrl.replace(/\.ogg$/i, '.mp3');
      console.log("Apple device detected, using MP3 version:", audioUrl);
    }
    
    // Encode the URL to handle special characters and Arabic text
    audioUrl = encodeAudioUrl(audioUrl);
  }
  
  console.log(`Playing track: ${track.name} from ${startTime}s`);
  console.log(`URL: ${audioUrl}`);
  
  // Set the audio source
  audioPlayer.src = audioUrl;
  
  // Update the UI with the current track name
  const nowPlayingText = isTranslated ? translations['تستمعون الى:'] || 'You are listening to:' : 'تستمعون الى:';
  currentTrackDiv.textContent = `${nowPlayingText} ${translations[track.name] || track.name}`;

  // Set up event handlers
  audioPlayer.onloadedmetadata = () => {
    try {
      audioPlayer.currentTime = startTime;
      audioPlayer.play()
        .catch(err => {
          console.error("Playback error:", err);
          handlePlaybackError(index, startTime, isRandom, retryAttempt, alternativeUrls);
        });
    } catch (e) {
      console.error("Error setting current time:", e);
      handlePlaybackError(index, startTime, isRandom, retryAttempt, alternativeUrls);
    }
  };

  audioPlayer.onended = () => {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex, 0, isRandom);
  };

  audioPlayer.onerror = (e) => {
    console.error("Audio error:", e);
    console.log("Audio error code:", audioPlayer.error ? audioPlayer.error.code : "unknown");
    
    handlePlaybackError(index, startTime, isRandom, retryAttempt, alternativeUrls);
  };

  // Update track list UI
  const trackItems = document.querySelectorAll('.trackItem');
  trackItems.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  const activeTrackItem = trackItems[index];
  if (activeTrackItem) {
    activeTrackItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Handle playback errors with retries and fallbacks
 * @param {number} index - Track index
 * @param {number} startTime - Start time in seconds
 * @param {boolean} isRandom - Whether it's a random track
 * @param {number} retryAttempt - Current retry attempt
 * @param {Array} alternativeUrls - Alternative URLs to try
 */
function handlePlaybackError(index, startTime, isRandom, retryAttempt, alternativeUrls) {
  const track = tracks[index];
  
  // If we don't have alternative URLs yet, generate them
  if (!alternativeUrls || alternativeUrls.length === 0) {
    alternativeUrls = getAudioAlternatives(track.url);
  }
  
  // If we have alternative URLs to try
  if (retryAttempt < alternativeUrls.length) {
    // Try the next alternative URL
    playTrack(index, startTime, isRandom, retryAttempt + 1, alternativeUrls);
  } else {
    // If we've tried all alternatives, move to the next track
    retryCount++;
    
    // If we've retried too many tracks, pause playback to avoid infinite loops
    if (retryCount > MAX_RETRIES) {
      console.error(`Too many errors (${retryCount}), stopping playback`);
      const audioPlayer = document.getElementById("audioPlayer");
      audioPlayer.pause();
      
      const currentTrackDiv = document.getElementById("currentTrack");
      const errorText = isTranslated ? 
        (translations['error_playing'] || 'Error playing tracks. Please try again later.') : 
        'حدث خطأ في تشغيل المقطع. يرجى المحاولة مرة أخرى لاحقاً.';
      currentTrackDiv.textContent = errorText;
      
      retryCount = 0;
      return;
    }
    
    // Move to the next track
    currentTrackIndex = (index + 1) % tracks.length;
    playTrack(currentTrackIndex, 0, isRandom);
  }
}

/**
 * Loads tracks for the selected reader
 */
async function loadSelectedReader() {
  const select = document.getElementById('readerSelect');
  currentReader = select.value;
  select.disabled = true;
  isTracksReady = false;
  tracks = [];

  const audioPlayer = document.getElementById('audioPlayer');
  audioPlayer.pause();
  audioPlayer.src = '';

  const success = await loadTracks(m3uLinks[currentReader]);
  select.disabled = false;

  if (success) {
    if (isPlaying) {
      calculateTrackToPlay();
    }
  }
}

/**
 * Toggles between main and about containers
 * @param {number} circleNumber - Circle number (1 or 2)
 */
function toggleCircle(circleNumber) {
  const mainContainer = document.getElementById('mainContainer');
  const secondContainer = document.getElementById('secondContainer');
  const circles = document.querySelectorAll('.circle');

  if (circleNumber === 2) {
    // Show container2 and hide container
    mainContainer.classList.add('active'); // Slide container to the left
    secondContainer.classList.add('active'); // Bring container2 from the right
  } else {
    // Show container and hide container2
    mainContainer.classList.remove('active'); // Bring container back to the center
    secondContainer.classList.remove('active'); // Slide container2 to the right
  }

  // Update active state for circles
  circles.forEach(circle => circle.classList.remove('active'));
  const selectedCircle = document.querySelector(`.circle:nth-child(${circleNumber})`);
  selectedCircle.classList.add('active');
}

/**
 * Opens the Google Play Store for the app
 */
function openGooglePlay() {
  // Try to open directly in Google Play app
  window.location.href = "market://details?id=com.adqfm.ARFM";
  
  // Fallback to web link if app can't be opened
  setTimeout(() => {
    window.open("https://play.google.com/store/apps/details?id=com.adqfm.ARFM", "_blank");
  }, 500);
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  const languageSelector = document.getElementById("languageSelect");
  if (languageSelector) {
    languageSelector.addEventListener("change", async function () {
      const selectedLanguage = this.value;
      localStorage.setItem('language', selectedLanguage);
      await loadTranslations(selectedLanguage);
      translateUI(selectedLanguage);
      
      // Apply direction change
      document.documentElement.dir = selectedLanguage === 'ar' ? 'rtl' : 'ltr';
      
      // Update about text alignment
      const aboutText = document.querySelector('.about-text');
      if (aboutText) {
        if (selectedLanguage === 'ar') {
          aboutText.classList.add('rtl');
          aboutText.classList.remove('ltr');
        } else {
          aboutText.classList.add('ltr');
          aboutText.classList.remove('rtl');
        }
      }
    });
  }
});

// Initialize the app when the page loads
window.onload = async () => {
  console.log('Page loaded, initializing player...');
  console.log('Device detection - Apple device:', isAppleDevice);
  
  // Load tracks for the selected reader
  loadSelectedReader();

  // Set language from localStorage
  const languageSelect = document.getElementById('languageSelect');
  const savedLanguage = localStorage.getItem('language') || 'ar';
  languageSelect.value = savedLanguage;

  // Load translations if needed
  if (savedLanguage !== 'ar') {
    await loadTranslations(savedLanguage);
    translateUI(savedLanguage);
  } else {
    translateUI('ar');
  }
};