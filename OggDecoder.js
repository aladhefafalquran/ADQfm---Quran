// OggDecoder.js - A lightweight class for decoding OGG files
// This file works with decoder.js to provide OGG support

class OggDecoder {
  constructor() {
    this.initialized = false;
    this.worker = null;
    this.callbacks = {};
    this.messageId = 0;

    // Initialize the decoder
    this.initialize();
  }

  // Initialize the decoder with Web Worker if available
  async initialize() {
    if (this.initialized) return Promise.resolve();

    try {
      // Check if all required libraries are loaded
      if (typeof OggOpusDecoder === 'undefined') {
        console.warn("OggOpusDecoder not found - will attempt to use browser's native audio decoding");
        // Still mark as initialized, we'll use fallback methods
        this.initialized = true;
        return Promise.resolve();
      }

      this.initialized = true;
      console.log("OggDecoder initialized successfully");
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to initialize OggDecoder:", error);
      // Still mark as initialized, we'll use fallback methods
      this.initialized = true;
      return Promise.resolve();
    }
  }

  // Decode an OGG file from ArrayBuffer
  async decode(arrayBuffer) {
    await this.initialize();

    try {
      // Use OggOpusDecoder if available
      if (typeof OggOpusDecoder !== 'undefined') {
        console.log("Using OggOpusDecoder for decoding");
        const decoder = new OggOpusDecoder();
        await decoder.ready;
        const decodedData = await decoder.decode(arrayBuffer);
        
        // Return in standard format
        return {
          numberOfChannels: decodedData.numberOfChannels || 2,
          sampleRate: decodedData.sampleRate || 48000,
          length: decodedData.length || 0,
          getChannelData: function(channel) {
            // Return the channel data if available
            if (decodedData.getChannelData) {
              return decodedData.getChannelData(channel);
            }
            // Otherwise return empty array
            return new Float32Array(this.length / this.numberOfChannels);
          }
        };
      }
      
      // Fallback to browser's AudioContext decoding
      console.log("Using browser's native audio decoding as fallback");
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      return {
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        length: audioBuffer.length,
        getChannelData: function(channel) {
          return audioBuffer.getChannelData(channel);
        }
      };
    } catch (error) {
      console.error("OGG decoding failed:", error);
      
      // Display friendly error to console
      console.error("This browser might not support OGG format. Try using MP3 format instead.");
      
      // Rethrow to let caller handle error
      throw new Error("Audio decoding failed. Browser might not support this format.");
    }
  }

  // Check if OGG format is supported by the browser
  static isOggSupported() {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
  }
  
  // Check if MP3 format is supported by the browser
  static isMp3Supported() {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/mpeg') !== '';
  }
  
  // Get recommended format based on browser support
  static getRecommendedFormat() {
    const isOgg = OggDecoder.isOggSupported();
    const isMp3 = OggDecoder.isMp3Supported();
    
    console.log("Format support - OGG:", isOgg ? "Yes" : "No", "MP3:", isMp3 ? "Yes" : "No");
    
    if (isOgg) return 'ogg';
    if (isMp3) return 'mp3';
    
    // If nothing is supported, default to MP3 as it's more widely supported
    return 'mp3';
  }

  // Clean up resources
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.callbacks = {};
  }
}

// Make available globally
window.OggDecoder = OggDecoder;

// Run format detection on load to log browser capabilities
document.addEventListener('DOMContentLoaded', function() {
  const recommendedFormat = OggDecoder.getRecommendedFormat();
  console.log(`Browser audio format detection complete. Recommended format: ${recommendedFormat}`);
  
  // Store in window for easy access from other scripts
  window.recommendedAudioFormat = recommendedFormat;
  
  // Check if we're on an iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    console.log("iOS device detected - using MP3 format is recommended");
    window.recommendedAudioFormat = 'mp3';
  }
});