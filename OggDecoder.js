// OggDecoder.js - A lightweight class for decoding OGG files
// Place this in the same directory as decoder.js

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
          console.error("OggOpusDecoder not found - make sure you've loaded the required libraries");
          return Promise.reject(new Error("OggOpusDecoder not found"));
        }
  
        this.initialized = true;
        return Promise.resolve();
      } catch (error) {
        console.error("Failed to initialize OggDecoder:", error);
        return Promise.reject(error);
      }
    }
  
    // Decode an OGG file from ArrayBuffer
    async decode(arrayBuffer) {
      await this.initialize();
  
      try {
        // Use OggOpusDecoder if available
        if (typeof OggOpusDecoder !== 'undefined') {
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
        
        // Fallback for when OggOpusDecoder is not available
        throw new Error("No OGG decoder implementation available");
      } catch (error) {
        console.error("OGG decoding failed:", error);
        throw error;
      }
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