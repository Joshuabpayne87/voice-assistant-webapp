// SpeechSynthesis.js - Component for text-to-speech functionality

import React, { useState, useEffect } from 'react';

const SpeechSynthesis = ({ text, speak, onEnd }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Initialize speech synthesis and get available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Function to get and set available voices
      const getVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Set default voice (prefer a female English voice if available)
        if (availableVoices.length > 0) {
          const englishVoice = availableVoices.find(
            voice => voice.lang.includes('en-') && voice.name.includes('Female')
          ) || availableVoices.find(
            voice => voice.lang.includes('en-')
          ) || availableVoices[0];
          
          setSelectedVoice(englishVoice);
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
      
      getVoices();
      
      // Cleanup
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Effect to speak text when it changes
  useEffect(() => {
    if (text && speak && selectedVoice) {
      speakText(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, selectedVoice, speak]);

  // Function to speak the text
  const speakText = (textToSpeak) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Set selected voice
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Configure speech properties
        utterance.rate = 1.0;  // Speed - between 0.1 (slow) and 10 (fast)
        utterance.pitch = 1.0; // Pitch - between 0 (low) and 2 (high)
        utterance.volume = 1.0; // Volume - between 0 (silent) and 1 (loud)
        
        // Set callbacks
        utterance.onstart = () => {
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };
        
        utterance.onerror = (event) => {
          console.error('SpeechSynthesis error:', event);
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };
        
        // Speak!
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Handle voice change
  const handleVoiceChange = (e) => {
    const voice = voices.find(v => v.name === e.target.value);
    setSelectedVoice(voice);
  };

  // Toggle pause/resume
  const togglePause = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (isPaused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="speech-controls">
      {voices.length > 0 && (
        <div className="voice-selector">
          <label htmlFor="voice-select">Assistant Voice:</label>
          <select 
            id="voice-select" 
            value={selectedVoice ? selectedVoice.name : ''} 
            onChange={handleVoiceChange}
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {isSpeaking && (
        <div className="speech-buttons">
          <button 
            onClick={togglePause} 
            className="speech-button"
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button 
            onClick={stopSpeaking} 
            className="speech-button stop"
          >
            ⏹️ Stop
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeechSynthesis;