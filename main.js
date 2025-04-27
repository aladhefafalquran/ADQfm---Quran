// Improved iOS detection
const isAppleDevice = /iPad|iPhone|iPod|Mac/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
console.log("Is Apple device:", isAppleDevice);

// Check if OGG format is supported
function isOggSupported() {
  const audio = document.createElement('audio');
  return !!audio.canPlayType && audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
}
const canPlayOgg = isOggSupported();
console.log("OGG format supported:", canPlayOgg);

// Configuration for the audio player
const scheduledDateTime = new Date('2025-01-14T04:50:00+03:00');
const m3uLinks = {
  random: "https://www.streamadqfm.store/output.m3u",
  exclusive: "https://www.streamadqfm.store/%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A.m3u",
  tobalawi: "https://www.streamadqfm.store/%D8%A7%D9%84%D8%B7%D8%A8%D9%84%D8%A7%D9%88%D9%8A.m3u",
  manshawi: "https://www.streamadqfm.store/%D8%A7%D9%84%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8A.m3u",
  abdbasat: "https://www.streamadqfm.store/%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7.m3u",
  mahmoudbanna: "https://www.streamadqfm.store/%D9%85%D8%AD%D9%85%D9%88%D8%AF%20%D8%A7%D9%84%D8%A8%D9%86%D8%A7.m3u",
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

// Function to modify URL based on device capabilities
function getCompatibleAudioUrl(url) {
  if (!url) return url;
  
  // For Apple devices, always use MP3 instead of OGG
  if (isAppleDevice && url.toLowerCase().endsWith('.ogg')) {
    return url.replace(/\.ogg$/i, '.mp3');
  }
  
  return url;
}

// Load tracks from an M3U file
async function loadTracks(url) {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'block';
  
  // Quick check if the URL is valid
  if (!url) {
    console.error('No valid M3U link found for this reader');
    alert('No valid link provided for this reciter.');
    spinner.style.display = 'none';
    return false;
  }

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
    return isTracksReady;
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

// Display the list of tracks in the UI
function displayTrackList() {
  const trackListDiv = document.getElementById('trackList');
  trackListDiv.innerHTML = tracks.map((track, index) => `
    <div class="trackItem ${index === currentTrackIndex ? 'active' : ''}" onclick="playTrack(${index})">
      ${translations[track.name] || track.name}
    </div>
  `).join('');
}

// Load translations for the selected language
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
    console.log(`Translations loaded for language: ${lang}`);
  } catch (error) {
    console.error(`Error loading translations for language '${lang}':`, error);
    translations = {};
  }
}

// Update the UI with translations
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
  if (currentTrackDiv.textContent.includes("تستمعون الى:") || currentTrackDiv.textContent.includes("You are listening to:")) {
    const trackName = currentTrackDiv.textContent.split(":")[1]?.trim();
    if (trackName) {
      const nowPlayingText = lang === 'ar' ? 'تستمعون الى:' : translations['تستمعون الى:'] || 'You are listening to:';
      currentTrackDiv.textContent = `${nowPlayingText} ${translations[trackName] || trackName}`;
    }
  }

  // Apply RTL or LTR direction based on the selected language
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  const aboutText = document.querySelector('.about-text');
  if (aboutText) {
    if (lang === 'ar') {
      aboutText.classList.add('rtl');
      aboutText.classList.remove('ltr');
      aboutText.style.textAlign = "right";
      aboutText.style.direction = "rtl";
    } else {
      aboutText.classList.add('ltr');
      aboutText.classList.remove('rtl');
      aboutText.style.textAlign = "left";
      aboutText.style.direction = "ltr";
    }
  }
}

// Calculate which track to play based on schedule
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

// Enhanced playTrack function with better format handling
function playTrack(index, startTime = 0, isRandom = false) {
  const audioPlayer = document.getElementById("audioPlayer");
  const currentTrackDiv = document.getElementById("currentTrack");

  if (!tracks[index]) {
    console.error(`Invalid track index: ${index}`);
    return;
  }

  const track = tracks[index];
  currentTrackIndex = index;
  isPlaying = true;
  
  // Get the original URL and track file extension
  const originalUrl = track.url;
  const fileExtension = originalUrl.split('.').pop().toLowerCase();
  
  // Get compatible URL for this device
  let audioUrl = getCompatibleAudioUrl(originalUrl);
  console.log(`Original URL: ${originalUrl}`);
  console.log(`Compatible URL: ${audioUrl}`);
  
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
          tryAlternateFormat();
        });
    } catch (e) {
      console.error("Error setting current time:", e);
      tryAlternateFormat();
    }
  };

  audioPlayer.onended = () => {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex, 0, isRandom);
  };

  audioPlayer.onerror = (e) => {
    console.error("Audio error:", e);
    console.log("Audio error code:", audioPlayer.error ? audioPlayer.error.code : "unknown");
    tryAlternateFormat();
  };
  
  // Try alternate format or move to next track
  function tryAlternateFormat() {
    // If we're using the modified URL and it failed, try the original format
    if (audioUrl !== originalUrl) {
      console.log("Modified URL failed, trying original format:", originalUrl);
      audioPlayer.src = originalUrl;
      audioPlayer.load();
      audioPlayer.play().catch(err => {
        console.error("Original format also failed:", err);
        tryM4AFormat();
      });
    } 
    // If we're using OGG and it failed, try MP3
    else if (fileExtension === 'ogg') {
      const mp3Url = originalUrl.replace(/\.ogg$/i, '.mp3');
      console.log("OGG failed, trying MP3 format:", mp3Url);
      audioPlayer.src = mp3Url;
      audioPlayer.load();
      audioPlayer.play().catch(err => {
        console.error("MP3 format also failed:", err);
        tryM4AFormat();
      });
    }
    // In all other cases, just move to the next track
    else {
      tryM4AFormat();
    }
  }
  
  // Try M4A as a last resort
  function tryM4AFormat() {
    // Try M4A as a last resort
    if (fileExtension !== 'm4a') {
      const m4aUrl = originalUrl.replace(/\.(ogg|mp3)$/i, '.m4a');
      console.log("Trying M4A format as last resort:", m4aUrl);
      audioPlayer.src = m4aUrl;
      audioPlayer.load();
      audioPlayer.play().catch(err => {
        console.error("M4A format also failed:", err);
        nextTrack();
      });
    } else {
      nextTrack();
    }
  }
  
  // Move to next track when all formats fail
  function nextTrack() {
    console.log("All formats failed, moving to next track");
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex, 0, isRandom);
  }

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

// Load the selected reader's tracks
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

  if (success && isPlaying) {
    calculateTrackToPlay();
  }
}

// Toggle between main content and about page
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

// Open Google Play store link
function openGooglePlay() {
  // Try to open directly in Google Play app
  window.location.href = "market://details?id=com.adqfm.ARFM";
  
  // Fallback to web link if app can't be opened
  setTimeout(() => {
    window.open("https://play.google.com/store/apps/details?id=com.adqfm.ARFM", "_blank");
  }, 500);
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Language selection handling
  const languageSelector = document.getElementById("languageSelect");
  if (languageSelector) {
    languageSelector.addEventListener("change", async function() {
      const selectedLanguage = this.value;
      localStorage.setItem('language', selectedLanguage);
      isTranslated = selectedLanguage !== 'ar';
      await loadTranslations(selectedLanguage);
      translateUI(selectedLanguage);
    });
  }
});

// Initialize everything when the page loads
window.onload = async () => {
  console.log('Page loaded, initializing player...');
  console.log('Device detection - Apple device:', isAppleDevice);
  console.log('OGG format supported:', canPlayOgg);
  
  // Set language from localStorage
  const savedLanguage = localStorage.getItem('language') || 'ar';
  isTranslated = savedLanguage !== 'ar';
  
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) languageSelect.value = savedLanguage;
  
  // Load translations if needed
  if (savedLanguage !== 'ar') {
    await loadTranslations(savedLanguage);
  }
  
  // Apply translations to UI
  translateUI(savedLanguage);
  
  // Load tracks for the selected reader
  loadSelectedReader();
};