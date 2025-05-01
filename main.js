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
let iosErrorCount = 0;
const MAX_IOS_ERRORS = 5;

// Enhanced iOS detection with broader device coverage
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Browser compatibility checks
function checkBrowserCompatibility() {
  // Check if Audio element is supported
  if (typeof Audio === 'undefined') {
    showMessage('Your browser does not support HTML5 Audio. Please update to a modern browser.', 'error');
    return false;
  }
  
  // Check if Fetch API is supported
  if (typeof fetch === 'undefined') {
    showMessage('Your browser does not support the Fetch API. Please update to a modern browser.', 'error');
    return false;
  }
  
  // Check if audio formats are supported
  const audio = document.createElement('audio');
  const canPlayMP3 = audio.canPlayType('audio/mpeg') !== '';
  const canPlayOGG = audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
  
  if (!canPlayMP3 && !canPlayOGG) {
    showMessage('Your browser does not support MP3 or OGG audio formats. Please use a different browser.', 'error');
    return false;
  }
  
  console.log('Browser compatibility: MP3 support:', canPlayMP3, 'OGG support:', canPlayOGG);
  
  // iOS-specific checks
  if (isIOSDevice) {
    console.log("iOS device detected - running compatibility checks");
    runIOSCompatibilityCheck();
  }
  
  return true;
}

// Run iOS system check and log results
function runIOSCompatibilityCheck() {
  if (!isIOSDevice) return true; // Skip if not iOS
  
  console.log("=== iOS COMPATIBILITY CHECK ===");
  
  // Check Safari version
  const userAgent = navigator.userAgent;
  let safariVersion = "Unknown";
  
  const versionMatch = userAgent.match(/Version\/(\d+\.\d+)/);
  if (versionMatch) {
    safariVersion = versionMatch[1];
    console.log(`iOS Safari version: ${safariVersion}`);
  }
  
  // Check audio capabilities
  const audio = document.createElement('audio');
  
  const formats = {
    mp3: audio.canPlayType('audio/mpeg'),
    ogg: audio.canPlayType('audio/ogg; codecs="vorbis"'),
    aac: audio.canPlayType('audio/aac'),
    mp4: audio.canPlayType('audio/mp4')
  };
  
  console.log("iOS Audio Format Support:");
  for (const [format, support] of Object.entries(formats)) {
    console.log(`- ${format.toUpperCase()}: ${support || 'no support'}`);
  }
  
  // Record device details
  const pixelRatio = window.devicePixelRatio || 1;
  const screenWidth = window.screen.width * pixelRatio;
  const screenHeight = window.screen.height * pixelRatio;
  
  console.log(`iOS Device Screen: ${screenWidth}x${screenHeight} (${pixelRatio}x pixel ratio)`);
  console.log("=== END iOS CHECK ===");
  
  // Set iOS-specific optimizations
  setupIOSOptimizations();
  
  return true;
}

// Setup iOS-specific optimizations
function setupIOSOptimizations() {
  // 1. Force low-latency audio loading
  const audioPlayer = document.getElementById("audioPlayer");
  if (audioPlayer) {
    audioPlayer.preload = "metadata";
    
    // Disable browser cache for audio (can help with iOS Safari cache issues)
    audioPlayer.addEventListener('loadstart', function() {
      if (this.src.indexOf('?') === -1) {
        this.src = this.src + '?nocache=' + new Date().getTime();
      }
    });
    
    // Handle stuck playback recovery
    audioPlayer.addEventListener('timeupdate', function() {
      // Clear stored time for stuck detection
      window.lastPlaybackTime = this.currentTime;
    });
    
    // Set up periodic check for stuck audio
    setInterval(function() {
      if (!audioPlayer || audioPlayer.paused) return;
      
      const now = audioPlayer.currentTime;
      const last = window.lastPlaybackTime || 0;
      
      // If time hasn't updated for 3 seconds but player is not paused
      if (Math.abs(now - last) < 0.1 && !audioPlayer.paused && audioPlayer.readyState > 2) {
        console.warn("iOS: Detected stuck playback, attempting recovery");
        
        // Try to recover
        const curTime = audioPlayer.currentTime;
        audioPlayer.currentTime = curTime + 0.1;
        
        // Last resort: skip to next track if still stuck
        setTimeout(function() {
          if (Math.abs(audioPlayer.currentTime - curTime) < 0.2) {
            console.error("iOS: Stuck playback recovery failed, skipping track");
            if (tracks.length > 0) {
              currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
              playTrack(currentTrackIndex, 0);
            }
          }
        }, 2000);
      }
      
      window.lastPlaybackTime = now;
    }, 3000);
  }
  
  // 2. Add iOS volume control workaround
  document.body.addEventListener('touchstart', function() {
    // This empty handler enables proper volume control on iOS
  }, false);
  
  // 3. Mark scrollable elements for iOS
  document.querySelectorAll('#trackList, .about-content').forEach(el => {
    if (el) el.classList.add('scrollable');
  });
  
  // 4. Special Safari-specific handlers
  if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
    console.log("Safari browser detected on iOS - adding special handlers");
    
    // Safari can pause audio when switching tabs or minimizing
    document.addEventListener('visibilitychange', function() {
      const audioPlayer = document.getElementById("audioPlayer");
      
      if (document.visibilityState === 'visible') {
        // Resumed viewing
        if (audioPlayer && audioPlayer.paused && isPlaying) {
          console.log("iOS Safari: Page visible again, resuming playback");
          audioPlayer.play().catch(err => console.warn("iOS resume failed:", err));
        }
      }
    });
  }
}

// Enhanced URL helper for iOS
function getAudioUrlForDevice(originalUrl) {
  // Only convert for iOS devices
  if (isIOSDevice && originalUrl.toLowerCase().endsWith('.ogg')) {
    const mp3Url = originalUrl.replace(/\.ogg$/i, '.mp3');
    console.log("iOS: Using MP3 instead:", mp3Url);
    return mp3Url;
  }
  
  return originalUrl;
}

// Load tracks from an M3U file
async function loadTracks(url) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'block';
  
  if (!url) {
    console.error('No valid M3U link found for this reader');
    showMessage('No valid link provided for this reciter.', 'error');
    if (spinner) spinner.style.display = 'none';
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'no-store' // Prevent caching issues
    });
    
    clearTimeout(timeoutId);
    
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
        // Store the original URL without conversion (will be converted when playing if needed)
        let url = line.trim();
        tempTrack.url = url;
        tracks.push(tempTrack);
        tempTrack = null;
      }
    }
    
    isTracksReady = tracks.length > 0;
    
    if (isTracksReady) {
      // For iOS devices only, pre-check MP3 availability
      if (isIOSDevice) {
        console.log(`Loaded ${tracks.length} tracks, checking iOS compatibility...`);
        
        // Check one sample OGG track to ensure MP3 alternatives exist
        const oggTracks = tracks.filter(track => track.url.toLowerCase().endsWith('.ogg'));
        if (oggTracks.length > 0) {
          // Sample check
          const sampleTrack = oggTracks[0];
          const mp3Url = sampleTrack.url.replace(/\.ogg$/i, '.mp3');
          
          try {
            const testResponse = await fetch(mp3Url, { method: 'HEAD' });
            if (testResponse.ok) {
              console.log("iOS compatibility: MP3 alternatives confirmed available");
            } else {
              console.warn("iOS compatibility warning: MP3 alternatives may not be available");
              showMessage("Warning: Some tracks may not play on iOS devices", "warning", 5000);
            }
          } catch (error) {
            console.warn("Could not verify MP3 alternatives:", error);
          }
        }
      }
      
      console.log(`Loaded ${tracks.length} tracks successfully`);
      displayTrackList();
    } else {
      console.error('No tracks found in the M3U file');
      showMessage('No tracks found. Please try a different reciter.', 'error');
    }
    
    return isTracksReady;
  } catch (error) {
    console.error('Error in loadTracks:', error);
    isTracksReady = false;
    tracks = [];
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      showMessage('Connection timeout while loading tracks. Please check your internet connection.', 'error');
    } else {
      showMessage(`Failed to load tracks: ${error.message}`, 'error');
    }
    
    return false;
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

// Display the list of tracks in the UI
function displayTrackList() {
  const trackListDiv = document.getElementById('trackList');
  if (!trackListDiv) return;
  
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
    // Add cache-busting parameter and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${url}?v=${new Date().getTime()}`, { 
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    translations = await response.json();
    console.log(`Translations loaded for language: ${lang}`);
    
    // Apply translations immediately
    translateUI(lang);
  } catch (error) {
    console.error(`Error loading translations for language '${lang}':`, error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      console.error(`Translation loading timed out for language: ${lang}`);
      showMessage(`Translation loading failed for ${lang}. Using default language.`, 'warning');
    }
    
    // Fall back to English if available and not already English
    if (lang !== 'en' && lang !== 'ar') {
      console.log('Falling back to English translations');
      loadTranslations('en');
    } else {
      translations = {};
    }
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
  if (currentTrackDiv && (currentTrackDiv.textContent.includes("تستمعون الى:") || currentTrackDiv.textContent.includes("You are listening to:"))) {
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
  if (!button) return;
  
  const loadingText = translations['جاري التجهيز...'] || 'جاري التجهيز...';
  button.textContent = loadingText;
  button.disabled = true;

  if (!isTracksReady || tracks.length === 0) {
    console.error('Tracks not ready or empty');
    showMessage('Please wait for tracks to load', 'warning');
    button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
    button.disabled = false;
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
        if (button) {
          button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
          button.disabled = false;
        }
      }, 1000);
      return;
    }
  }

  setTimeout(() => {
    playTrack(0, 0);
    if (button) {
      button.textContent = translations['تشغيل كبث قرآني'] || 'تشغيل كبث قرآني';
      button.disabled = false;
    }
  }, 1000);
}

// Play a specific track with iOS optimizations
function playTrack(index, startTime = 0, isRandom = false) {
  const audioPlayer = document.getElementById("audioPlayer");
  const currentTrackDiv = document.getElementById("currentTrack");
  
  if (!audioPlayer || !currentTrackDiv) {
    console.error("Required audio elements not found");
    return;
  }

  if (!tracks[index]) {
    console.error(`Invalid track index: ${index}`);
    return;
  }

  const track = tracks[index];
  currentTrackIndex = index;
  isPlaying = true;
  
  // Get device-optimized URL
  const originalUrl = track.url;
  const audioUrl = getAudioUrlForDevice(originalUrl);
  
  // For iOS: Add timestamp to prevent caching issues
  const finalUrl = isIOSDevice ? 
    (audioUrl + (audioUrl.includes('?') ? '&' : '?') + '_t=' + new Date().getTime()) : 
    audioUrl;
  
  console.log(`Playing track: ${track.name} from ${startTime}s, URL: ${finalUrl}`);
  
  // Set the audio source
  audioPlayer.src = finalUrl;
  
  // Update the UI with the current track name
  const nowPlayingText = isTranslated ? 
    translations['تستمعون الى:'] || 'You are listening to:' : 
    'تستمعون الى:';
  currentTrackDiv.textContent = `${nowPlayingText} ${translations[track.name] || track.name}`;
  
  // Add special status indicator
  const statusHtml = `<span class="audio-status loading"></span>`;
  if (!currentTrackDiv.innerHTML.includes('audio-status')) {
    currentTrackDiv.innerHTML = statusHtml + currentTrackDiv.textContent;
  } else {
    const statusElem = currentTrackDiv.querySelector('.audio-status');
    if (statusElem) statusElem.className = 'audio-status loading';
  }
  
  // iOS-specific loading timeout for better error detection
  let iosLoadingTimeout;
  if (isIOSDevice) {
    iosLoadingTimeout = setTimeout(() => {
      console.warn("iOS: Track loading taking too long, may indicate a problem");
      // Let it continue loading but log the warning
    }, 5000);
  }

  // Set up event handlers
  audioPlayer.onloadedmetadata = () => {
    if (isIOSDevice && iosLoadingTimeout) {
      clearTimeout(iosLoadingTimeout);
    }
    
    try {
      audioPlayer.currentTime = startTime;
      
      // Update status indicator
      const statusElem = currentTrackDiv.querySelector('.audio-status');
      if (statusElem) statusElem.className = 'audio-status playing';
      
      const playPromise = audioPlayer.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Playback error:", err);
          
          // Special handling for iOS autoplay restrictions
          if (err.name === "NotAllowedError") {
            console.log("Autoplay restricted - user must interact first");
            showMessage("Tap play to start audio", "info");
            
            // Update status indicator
            const statusElem = currentTrackDiv.querySelector('.audio-status');
            if (statusElem) statusElem.className = 'audio-status';
          } else {
            handlePlaybackError();
          }
        });
      }
    } catch (e) {
      console.error("Error setting current time:", e);
      handlePlaybackError();
    }
  };

  audioPlayer.onended = () => {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex, 0, isRandom);
  };

  audioPlayer.onerror = (e) => {
    if (isIOSDevice && iosLoadingTimeout) {
      clearTimeout(iosLoadingTimeout);
    }
    
    console.error("Audio error:", e);
    console.error("Audio error code:", audioPlayer.error ? audioPlayer.error.code : "unknown");
    
    // Update error status indicator
    const statusElem = currentTrackDiv.querySelector('.audio-status');
    if (statusElem) statusElem.className = 'audio-status error';
    
    // Track iOS-specific errors
    if (isIOSDevice) {
      iosErrorCount++;
      if (iosErrorCount >= MAX_IOS_ERRORS) {
        console.error(`iOS: Multiple playback errors (${iosErrorCount}). Suggesting refresh.`);
        showMessage("Multiple playback errors detected. Try refreshing the page.", "error", 8000);
      }
    }
    
    handlePlaybackError();
  };
  
  // iOS-specific successful loading handler
  if (isIOSDevice) {
    audioPlayer.oncanplay = () => {
      console.log("iOS: Track loaded successfully and ready to play");
      iosErrorCount = 0; // Reset error count on successful loading
    };
  }
  
  // Handle playback errors with iOS-specific recovery
  function handlePlaybackError() {
    if (isIOSDevice) {
      // On iOS, if we're using MP3 and it failed, try the next track
      if (audioPlayer.src.toLowerCase().includes('.mp3')) {
        console.error("iOS: MP3 format failed, moving to next track");
        moveToNextTrack();
      } 
      // If we're somehow still trying OGG on iOS, switch to MP3
      else if (audioPlayer.src.toLowerCase().includes('.ogg')) {
        const mp3Url = track.url.replace(/\.ogg$/i, '.mp3');
        console.log("iOS: Switching OGG to MP3:", mp3Url);
        
        audioPlayer.src = mp3Url;
        audioPlayer.load();
        audioPlayer.play().catch(err => {
          console.error("iOS: MP3 fallback also failed:", err);
          moveToNextTrack();
        });
      }
      else {
        moveToNextTrack();
      }
    } else {
      // Non-iOS error handling (try alternate format)
      if (audioPlayer.src.toLowerCase().includes('.ogg')) {
        const mp3Url = track.url.replace(/\.ogg$/i, '.mp3');
        console.log("OGG format failed, trying MP3:", mp3Url);
        
        audioPlayer.src = mp3Url;
        audioPlayer.load();
        audioPlayer.play().catch(() => moveToNextTrack());
      } 
      else if (audioPlayer.src.toLowerCase().includes('.mp3')) {
        const oggUrl = track.url.replace(/\.mp3$/i, '.ogg');
        console.log("MP3 format failed, trying OGG:", oggUrl);
        
        audioPlayer.src = oggUrl;
        audioPlayer.load();
        audioPlayer.play().catch(() => moveToNextTrack());
      }
      else {
        moveToNextTrack();
      }
    }
  }
  
  // Move to next track
  function moveToNextTrack() {
    console.log("Moving to next track");
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
  if (!select) return;
  
  currentReader = select.value;
  select.disabled = true;
  isTracksReady = false;
  tracks = [];

  const audioPlayer = document.getElementById('audioPlayer');
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.src = '';
  }

  // Update status message
  const currentTrackDiv = document.getElementById("currentTrack");
  if (currentTrackDiv) {
    const loadingText = isTranslated ? 
      translations['جاري التجهيز...'] || 'Loading...' : 
      'جاري التجهيز...';
    currentTrackDiv.textContent = loadingText;
  }

  const success = await loadTracks(m3uLinks[currentReader]);
  if (select) select.disabled = false;

  // Reset error count on successful reader change
  iosErrorCount = 0;

  if (success && isPlaying) {
    calculateTrackToPlay();
  } else if (currentTrackDiv) {
    // Reset status display if no tracks loaded
    const noMediaText = isTranslated ? 
      translations['لاتوجد وسائط قيد التشغيل'] || 'No media playing' : 
      'لاتوجد وسائط قيد التشغيل';
    currentTrackDiv.textContent = noMediaText;
  }
}

// Toggle between main content and about page
function toggleCircle(circleNumber) {
  const mainContainer = document.getElementById('mainContainer');
  const secondContainer = document.getElementById('secondContainer');
  const circles = document.querySelectorAll('.circle');

  if (!mainContainer || !secondContainer) return;

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
  if (selectedCircle) selectedCircle.classList.add('active');
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

// Universal message display function
function showMessage(message, type = 'error', duration = 4000) {
  const errorDiv = document.getElementById('errorMessage');
  if (!errorDiv) return;
  
  // Clear any existing classes
  errorDiv.className = 'error-message';
  
  // Add type-specific class
  errorDiv.classList.add(type);
  
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  
  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, duration);
}

// Network status monitoring (for offline detection)
function setupNetworkMonitoring() {
  // Create offline notification element if it doesn't exist
  let offlineNotification = document.getElementById('offlineNotification');
  if (!offlineNotification) {
    offlineNotification = document.createElement('div');
    offlineNotification.id = 'offlineNotification';
    offlineNotification.className = 'offline-notification';
    offlineNotification.textContent = 'You are offline. Some features may not work.';
    document.body.appendChild(offlineNotification);
  }
  
  // Handle online/offline events
  window.addEventListener('online', function() {
    console.log('Network connection restored');
    offlineNotification.classList.remove('show');
    
    // Reload current reader if tracks were empty due to being offline
    if (tracks.length === 0 && currentReader) {
      console.log('Reloading tracks now that we are back online');
      loadSelectedReader();
    }
  });
  
  window.addEventListener('offline', function() {
    console.log('Network connection lost');
    offlineNotification.classList.add('show');
  });
  
  // Check initial state
  if (!navigator.onLine) {
    offlineNotification.classList.add('show');
  }
}

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM fully loaded");
  console.log("iOS device detected:", isIOSDevice);
  
  // Check browser compatibility
  if (!checkBrowserCompatibility()) {
    return; // Stop initialization if browser is not compatible
  }
  
  // Set up network monitoring
  setupNetworkMonitoring();
  
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
  
  // Error handling for audio
  const audioPlayer = document.getElementById("audioPlayer");
  if (audioPlayer) {
    audioPlayer.addEventListener("error", function(e) {
      console.error("Audio player error event:", e);
      console.error("Audio error code:", this.error ? this.error.code : "unknown");
      console.error("Audio error message:", this.error ? this.error.message : "unknown");
    });
    
    // For iOS: add special double-tap to play handler
    if (isIOSDevice) {
      document.getElementById('playButton')?.addEventListener('click', function() {
        // iOS often requires user interaction to play audio
        if (audioPlayer.paused && isPlaying) {
          audioPlayer.play().catch(err => {
            console.log("iOS play attempt:", err);
          });
        }
      });
    }
  }
  
  // Special Safari-specific handlers for iOS
  if (isIOSDevice && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
    console.log("Safari browser detected on iOS - adding special handlers");
    
    // Safari can pause audio when switching tabs or minimizing
    document.addEventListener('visibilitychange', function() {
      const audioPlayer = document.getElementById("audioPlayer");
      
      if (document.visibilityState === 'visible') {
        // Resumed viewing
        if (audioPlayer && audioPlayer.paused && isPlaying) {
          console.log("iOS Safari: Page visible again, resuming playback");
          audioPlayer.play().catch(err => console.warn("iOS resume failed:", err));
        }
      }
    });
  }
});

// Initialize everything when the page loads
window.onload = async () => {
  console.log('Page loaded, initializing player...');
  
  // Log platform details
  if (isIOSDevice) {
    console.log('iOS device detected, applying optimizations');
  } else {
    console.log('Non-iOS device detected:', navigator.platform || 'Unknown platform');
  }
  
  // Check if OggOpusDecoder is available
  if (typeof OggOpusDecoder === 'undefined') {
    console.warn("OggOpusDecoder not found - OGG files might not play correctly");
  }
  
  // Create initial loading overlay if needed
  let initialLoadingOverlay = document.getElementById('initialLoadingOverlay');
  if (!initialLoadingOverlay) {
    initialLoadingOverlay = document.createElement('div');
    initialLoadingOverlay.id = 'initialLoadingOverlay';
    initialLoadingOverlay.className = 'initial-loading';
    initialLoadingOverlay.textContent = 'Loading Quran Player...';
    document.body.appendChild(initialLoadingOverlay);
  }
  
  try {
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
    
    // Make sure the About page content is properly initialized
    const aboutContainer = document.getElementById('secondContainer');
    if (aboutContainer && !aboutContainer.querySelector('.about-content')) {
      aboutContainer.innerHTML = `
      <div class="about-content">
        <h1 data-translate="البرنامج القرآني" data-ar="البرنامج القرآني">البرنامج القرآني</h1>
        <div class="about-text rtl">
          <h2 data-translate="عن التطبيق" data-ar="عن التطبيق">عن التطبيق</h2>
          <p data-translate="هذا التطبيق تم تطويره لتقديم خدمة الاستماع للقرآن الكريم بتلاوات مختلفة لمشاهير القراء" data-ar="هذا التطبيق تم تطويره لتقديم خدمة الاستماع للقرآن الكريم بتلاوات مختلفة لمشاهير القراء">
            هذا التطبيق تم تطويره لتقديم خدمة الاستماع للقرآن الكريم بتلاوات مختلفة لمشاهير القراء
          </p>
          <h2 data-translate="المميزات" data-ar="المميزات">المميزات</h2>
          <ul>
            <li data-translate="الاستماع للقرآن الكريم بصوت عدة قراء" data-ar="الاستماع للقرآن الكريم بصوت عدة قراء">
              <strong>01</strong> الاستماع للقرآن الكريم بصوت عدة قراء
            </li>
            <li data-translate="تشغيل البث المباشر" data-ar="تشغيل البث المباشر">
              <strong>02</strong> تشغيل البث المباشر
            </li>
            <li data-translate="واجهة مستخدم سهلة وبسيطة" data-ar="واجهة مستخدم سهلة وبسيطة">
              <strong>03</strong> واجهة مستخدم سهلة وبسيطة
            </li>
            <li data-translate="دعم عدة لغات عالمية" data-ar="دعم عدة لغات عالمية">
              <strong>04</strong> دعم عدة لغات عالمية
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Circle Container for Second Container -->
      <div class="circle-container">
        <div class="circle" onclick="toggleCircle(1)"></div>
        <div class="circle active" onclick="toggleCircle(2)"></div>
      </div>
      `;
    }
    
    // Load tracks for the selected reader
    await loadSelectedReader();
    
    // Run iOS-specific post-initialization checks if needed
    if (isIOSDevice) {
      // Test small silent audio to unlock audio capabilities on iOS
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      
      // Very short MP3 data URI
      silentAudio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAABAAACcgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAADIAAAAAAAAAAAAAAP/7kGQAAANUMEoFPeACNQV40KEYABEY4WAKPI4Rhwh5gR5QhBEAYE9AMCAJ3eiQKDZzQhGIYRg9EYJRsvX6I1H/lfgfiwf9CHif8EMW";
      
      // Play and immediately pause (this helps unlock audio on iOS)
      silentAudio.play().catch(() => {});
      setTimeout(() => silentAudio.pause(), 100);
    }
    
  } catch (error) {
    console.error("Error during initialization:", error);
    showMessage("Error initializing player: " + (error.message || "Unknown error"), "error");
  } finally {
    // Remove loading overlay
    if (initialLoadingOverlay) {
      initialLoadingOverlay.style.opacity = '0';
      setTimeout(() => {
        initialLoadingOverlay.remove();
      }, 500);
    }
  }
  
  // Register service worker for offline support if available
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(err => {
        console.log('Service Worker registration failed:', err);
      });
    } catch (e) {
      console.log('Service Worker registration error:', e);
    }
  }
};