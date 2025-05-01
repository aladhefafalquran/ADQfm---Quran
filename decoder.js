// decoder.js - OGG Opus Decoder Implementation
// This file provides the OGG decoding functionality for the Quran player

class OggOpusDecoder {
    constructor() {
      // Set up the decoder
      this.context = null;
      
      try {
        // Try to create AudioContext
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext initialized successfully");
      } catch (error) {
        console.error("Failed to create AudioContext:", error);
      }
      
      // Promise that resolves when the decoder is ready
      this.ready = Promise.resolve();
    }
  
    // Basic decoder implementation using Web Audio API
    async decode(arrayBuffer) {
      try {
        // If we don't have AudioContext, create one now
        if (!this.context) {
          try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
          } catch (error) {
            throw new Error("Cannot create AudioContext for decoding: " + error.message);
          }
        }
        
        // Try to decode the audio data
        console.log("Starting audio decoding process...");
        
        // Use promise-based decodeAudioData
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        
        console.log("Audio decoding successful", {
          channels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
          duration: audioBuffer.duration + " seconds"
        });
        
        return {
          numberOfChannels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
          length: audioBuffer.length,
          duration: audioBuffer.duration,
          getChannelData: function(channel) {
            return audioBuffer.getChannelData(channel);
          }
        };
      } catch (error) {
        console.error("Failed to decode audio data:", error);
        
        // Format-specific error handling for better user feedback
        if (error.message.includes("media format")) {
          console.error("This browser might not support this audio format. Try using a different format.");
        }
        
        throw error;
      }
    }
    
    // Check if this browser likely supports OGG decoding
    static isFormatSupported(format = 'ogg') {
      // Create a temporary audio element to check format support
      const audio = document.createElement('audio');
      
      // Check various formats
      switch(format.toLowerCase()) {
        case 'ogg':
          return audio.canPlayType('audio/ogg; codecs="vorbis"') !== '';
        case 'mp3':
          return audio.canPlayType('audio/mpeg') !== '';
        case 'wav':
          return audio.canPlayType('audio/wav; codecs="1"') !== '';
        case 'aac':
          return audio.canPlayType('audio/aac') !== '';
        default:
          return false;
      }
    }
    
    // Clean up resources
    destroy() {
      if (this.context && this.context.state !== 'closed') {
        this.context.close().catch(err => console.error("Error closing AudioContext:", err));
      }
      this.context = null;
    }
  }
  
  // Make available globally
  window.OggOpusDecoder = OggOpusDecoder;
  
  // Log format support on load
  console.log("Audio format support detection:");
  console.log("- OGG support:", OggOpusDecoder.isFormatSupported('ogg') ? "Yes" : "No");
  console.log("- MP3 support:", OggOpusDecoder.isFormatSupported('mp3') ? "Yes" : "No");
  console.log("- WAV support:", OggOpusDecoder.isFormatSupported('wav') ? "Yes" : "No");
  console.log("- AAC support:", OggOpusDecoder.isFormatSupported('aac') ? "Yes" : "No");
  
  // Create helper function to convert OGG URLs to MP3 for iOS
  window.convertOggToMp3IfNeeded = function(url) {
    // Check if we're on an iOS device and the URL is an OGG file
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS && url.toLowerCase().endsWith('.ogg')) {
      console.log("iOS device detected, converting OGG to MP3:", url);
      return url.replace(/\.ogg$/i, '.mp3');
    }
    
    // If we're not on iOS or the file isn't OGG, return the original URL
    return url;
  };