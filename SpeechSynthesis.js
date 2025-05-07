import React, { useState, useEffect, useRef } from 'react';

const SpeechSynthesis = ({ text, isSpeaking, setIsSpeaking }) => {
  // State for available voices
  const [voices, setVoices] = useState([]);
  
  // State for selected voice
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  // State for speech controls visibility
  const [showControls, setShowControls] = useState(false);
  
  // State for speech status
  const [status, setStatus] = useState('idle'); // idle, speaking, paused
  
  // Ref for speech utterance
  const utteranceRef = useRef(null);
  
  // Ref for speech synthesis
  const synthRef = useRef(window.speechSynthesis);
  
  // Effect to load available voices
  useEffect(() => {
    const loadVoices = () => {
      // Get available voices
      const availableVoices = synthRef.current.getVoices();
      
      // Filter for English voices
      const englishVoices = availableVoices.filter(voice => 
        voice.lang.includes('en')
      );
      
      // Set available voices
      setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
      
      // Set default voice (prefer female voice if available)
      if (englishVoices.length > 0) {
        const femaleVoice = englishVoices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('moira')
        );
        
        setSelectedVoice(femaleVoice || englishVoices[0]);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
      }
    };
    
    // Load voices
    loadVoices();
    
    // Chrome loads voices asynchronously, so we need to listen for the voiceschanged event
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    // Cleanup
    return () => {
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = null;
      }
    };
  }, []);
  
  // Effect to speak text when isSpeaking changes
  useEffect(() => {
    if (isSpeaking && text) {
      speak(text);
    }
  }, [isSpeaking, text]);
  
  // Function to speak text
  const speak = (textToSpeak) => {
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Set event handlers
    utterance.onstart = () => {
      setStatus('speaking');
      setShowControls(true);
    };
    
    utterance.onend = () => {
      setStatus('idle');
      setIsSpeaking(false);
      
      // Hide controls after a delay
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setStatus('idle');
      setIsSpeaking(false);
      setShowControls(false);
    };
    
    // Store utterance in ref
    utteranceRef.current = utterance;
    
    // Speak
    synthRef.current.speak(utterance);
  };
  
  // Function to pause speech
  const pauseSpeech = () => {
    if (status === 'speaking') {
      synthRef.current.pause();
      setStatus('paused');
    }
  };
  
  // Function to resume speech
  const resumeSpeech = () => {
    if (status === 'paused') {
      synthRef.current.resume();
      setStatus('speaking');
    }
  };
  
  // Function to stop speech
  const stopSpeech = () => {
    synthRef.current.cancel();
    setStatus('idle');
    setIsSpeaking(false);
    
    // Hide controls after a delay
    setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };
  
  // Function to handle voice change
  const handleVoiceChange = (e) => {
    const voiceName = e.target.value;
    const voice = voices.find(v => v.name === voiceName);
    
    if (voice) {
      setSelectedVoice(voice);
      
      // If currently speaking, restart with new voice
      if (status === 'speaking' && utteranceRef.current) {
        const currentText = utteranceRef.current.text;
        stopSpeech();
        setTimeout(() => {
          speak(currentText);
        }, 100);
      }
    }
  };
  
  // Function to toggle controls visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  return (
    <div className={`speech-controls ${!showControls ? 'hidden' : ''}`}>
      <div className="speech-controls-header">
        <h4>Text-to-Speech</h4>
        <button onClick={toggleControls}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="speech-controls-buttons">
        {status === 'speaking' ? (
          <button onClick={pauseSpeech}>
            <i className="fas fa-pause"></i> Pause
          </button>
        ) : status === 'paused' ? (
          <button onClick={resumeSpeech}>
            <i className="fas fa-play"></i> Resume
          </button>
        ) : (
          <button onClick={() => speak(text)} disabled={!text}>
            <i className="fas fa-play"></i> Play
          </button>
        )}
        
        <button onClick={stopSpeech} disabled={status === 'idle'}>
          <i className="fas fa-stop"></i> Stop
        </button>
      </div>
      
      <div className="voice-selector">
        <select 
          value={selectedVoice ? selectedVoice.name : ''} 
          onChange={handleVoiceChange}
          disabled={voices.length === 0}
        >
          {voices.length === 0 ? (
            <option value="">Loading voices...</option>
          ) : (
            voices.map(voice => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default SpeechSynthesis;