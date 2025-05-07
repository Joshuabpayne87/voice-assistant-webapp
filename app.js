import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import SpeechSynthesis from './SpeechSynthesis';
import './App.css';

// Import SVG assets
import assistantAvatar from './assistant-avatar.svg';
import userAvatar from './user-avatar.svg';
import logoPlaceholder from './logo-placeholder.svg';
import businessPlaceholder from './business-placeholder.svg';

const App = () => {
  // State for chat messages
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI voice assistant. How can I help you today?",
      sender: 'assistant',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  // State for input value
  const [inputValue, setInputValue] = useState('');
  
  // State for typing indicator
  const [isTyping, setIsTyping] = useState(false);
  
  // State for dark mode
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkTheme') === 'true');
  
  // State for business info
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Sample Business Name',
    category: 'Professional Services',
    description: 'A professional service company specializing in voice assistance technology.',
    hours: {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 4:00 PM',
      saturday: 'Closed',
      sunday: 'Closed'
    },
    services: [
      'Voice Assistant Development',
      'AI Integration Services',
      'Technical Consulting',
      'Custom Software Solutions'
    ],
    avatarUrl: businessPlaceholder
  });
  
  // State for conversation ID
  const [conversationId, setConversationId] = useState(null);
  
  // State for QR code ID
  const [qrCodeId, setQrCodeId] = useState('Not scanned');
  
  // State for business ID
  const [businessId, setBusinessId] = useState(null);
  
  // Ref for chat messages container
  const chatMessagesRef = useRef(null);
  
  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  // Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Effect to update input value when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);
  
  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Effect to apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkTheme', darkMode);
  }, [darkMode]);
  
  // Effect to load session from localStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('voiceAssistantSession');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        setBusinessId(session.businessId);
        setConversationId(session.conversationId);
        setQrCodeId(session.qrCode || 'Not scanned');
      } catch (e) {
        console.error('Error parsing stored session:', e);
        localStorage.removeItem('voiceAssistantSession');
      }
    }
  }, []);
  
  // Function to save session to localStorage
  const saveSession = () => {
    const sessionData = {
      businessId,
      conversationId,
      qrCode: qrCodeId
    };
    localStorage.setItem('voiceAssistantSession', JSON.stringify(sessionData));
  };
  
  // Function to start listening
  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };
  
  // Function to stop listening
  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (inputValue.trim() !== '') {
      handleSendMessage();
    }
  };
  
  // Function to handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Function to handle send message
  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const userMessage = {
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    resetTranscript();
    
    // Show typing indicator
    setIsTyping(true);
    
    // Process the message and get a response
    processMessage(userMessage.text);
  };
  
  // Function to process message and get response
  const processMessage = (message) => {
    // In a real application, this would call an API
    // For this demo, we'll simulate a response
    
    setTimeout(() => {
      // Process the message based on content
      let response;
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        response = "Hello! How can I assist you today?";
      } else if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
        response = generateHoursResponse();
      } else if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
        response = generateServicesResponse();
      } else if (lowerMessage.includes('contact') || lowerMessage.includes('reach') || lowerMessage.includes('phone')) {
        response = "You can contact us at (555) 123-4567 or email us at contact@samplebusiness.com.";
      } else if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
        response = "We're located at 123 Business Street, Suite 456, Business City, BC 78901.";
      } else if (lowerMessage.includes('promotion') || lowerMessage.includes('discount') || lowerMessage.includes('deal')) {
        response = "We currently have a special promotion: 15% off on all services for new customers. Just mention 'VOICE15' when booking.";
      } else if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
        response = "You can book an appointment by calling us at (555) 123-4567 or using our online booking system at www.samplebusiness.com/book.";
      } else if (lowerMessage.includes('thank')) {
        response = "You're welcome! Is there anything else I can help you with?";
      } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
        response = "Thank you for chatting with me. Have a great day!";
      } else {
        response = "I'm not sure I understand. Could you please rephrase your question? You can ask me about our business hours, services, promotions, or contact information.";
      }
      
      // Add assistant message
      const assistantMessage = {
        text: response,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsTyping(false);
      
      // Speak the response
      speakResponse(response);
      
      // Update conversation ID (in a real app, this would come from the API)
      if (!conversationId) {
        const newConversationId = 'conv_' + Date.now();
        setConversationId(newConversationId);
        saveSession();
      }
    }, 1500); // Simulate API delay
  };
  
  // Function to speak response
  const speakResponse = (text) => {
    setIsSpeaking(true);
  };
  
  // Function to generate hours response
  const generateHoursResponse = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let response = "Our business hours are:\n";
    
    days.forEach(day => {
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      response += `${capitalizedDay}: ${businessInfo.hours[day]}\n`;
    });
    
    return response;
  };
  
  // Function to generate services response
  const generateServicesResponse = () => {
    let response = "We offer the following services:\n";
    
    businessInfo.services.forEach(service => {
      response += `- ${service}\n`;
    });
    
    return response;
  };
  
  // Function to handle suggestion chip click
  const handleSuggestionClick = (query) => {
    setInputValue(query);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };
  
  // Function to start a new chat
  const handleNewChat = () => {
    if (window.confirm('Start a new conversation? Your current chat history will be cleared.')) {
      setMessages([
        {
          text: "Hello! I'm your AI voice assistant. How can I help you today?",
          sender: 'assistant',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setConversationId(null);
      saveSession();
    }
  };
  
  // Function to format message text
  const formatMessageText = (text) => {
    // Replace URLs with clickable links
    let formatted = text.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Replace line breaks with <br> tags
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };
  
  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img src={logoPlaceholder} alt="Logo" />
          <h1>VoiceAssist</h1>
        </div>
        
        <div className="business-info">
          <div className="business-avatar">
            <img src={businessInfo.avatarUrl} alt="Business" />
          </div>
          <h2>{businessInfo.name}</h2>
          <p>{businessInfo.category}</p>
        </div>
        
        <div className="sidebar-nav">
          <a href="#" className="active"><i className="fas fa-comment-dots"></i> Chat</a>
          <a href="#"><i className="fas fa-info-circle"></i> About</a>
          <a href="#"><i className="fas fa-map-marker-alt"></i> Location</a>
          <a href="#"><i className="fas fa-calendar-alt"></i> Book</a>
          <a href="#"><i className="fas fa-phone"></i> Contact</a>
        </div>
        
        <div className="qr-info">
          <p><i className="fas fa-qrcode"></i> QR Code: <span>{qrCodeId}</span></p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="chat-container">
          <div className="chat-header">
            <h2>Voice Assistant</h2>
            <div className="chat-actions">
              <button id="new-chat-btn" onClick={handleNewChat}>
                <i className="fas fa-plus"></i> New Chat
              </button>
              <div className="theme-toggle">
                <i className="fas fa-sun"></i>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={darkMode} 
                    onChange={() => setDarkMode(!darkMode)} 
                  />
                  <span className="slider round"></span>
                </label>
                <i className="fas fa-moon"></i>
              </div>
            </div>
          </div>
          
          <div className="chat-messages" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-avatar">
                  <img 
                    src={message.sender === 'assistant' ? assistantAvatar : userAvatar} 
                    alt={message.sender === 'assistant' ? 'Assistant' : 'User'} 
                  />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    <p dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}></p>
                  </div>
                  <div className="message-time">{message.time}</div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message assistant typing-message">
                <div className="message-avatar">
                  <img src={assistantAvatar} alt="Assistant" />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <input 
                type="text" 
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..." 
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <div className="input-buttons">
                <button 
                  className="voice-btn" 
                  onClick={listening ? stopListening : startListening}
                >
                  <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'}`}></i>
                </button>
                <button className="send-btn" onClick={handleSendMessage}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
            <div className="input-feedback">
              <div className={`voice-feedback ${!listening ? 'hidden' : ''}`}>
                <div className="voice-waves">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <p>Listening...</p>
                <button onClick={stopListening}><i className="fas fa-stop"></i></button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="info-panel">
          <div className="panel-section hours-section">
            <h3><i className="fas fa-clock"></i> Business Hours</h3>
            <ul>
              {Object.entries(businessInfo.hours).map(([day, hours]) => (
                <li key={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}: {hours}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="panel-section services-section">
            <h3><i className="fas fa-concierge-bell"></i> Services</h3>
            <ul>
              {businessInfo.services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          </div>
          
          <div className="panel-section suggestions-section">
            <h3><i className="fas fa-lightbulb"></i> Try asking about</h3>
            <div className="suggestion-chips">
              <span 
                className="suggestion-chip" 
                onClick={() => handleSuggestionClick("What services do you offer?")}
              >
                Services
              </span>
              <span 
                className="suggestion-chip" 
                onClick={() => handleSuggestionClick("What are your business hours?")}
              >
                Hours
              </span>
              <span 
                className="suggestion-chip" 
                onClick={() => handleSuggestionClick("How can I book an appointment?")}
              >
                Booking
              </span>
              <span 
                className="suggestion-chip" 
                onClick={() => handleSuggestionClick("Do you have any promotions?")}
              >
                Promotions
              </span>
              <span 
                className="suggestion-chip" 
                onClick={() => handleSuggestionClick("How can I contact you?")}
              >
                Contact
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Speech Synthesis Component */}
      <SpeechSynthesis 
        text={messages.length > 0 && messages[messages.length - 1].sender === 'assistant' 
          ? messages[messages.length - 1].text 
          : ''}
        isSpeaking={isSpeaking}
        setIsSpeaking={setIsSpeaking}
      />
    </div>
  );
};

export default App;