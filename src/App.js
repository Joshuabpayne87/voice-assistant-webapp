// App.js - Main Application Component

import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';
import SpeechSynthesis from './components/SpeechSynthesis';

function App() {
  // Business data as a state variable so it can be updated
  const [businessData, setBusinessData] = useState({
    name: "Local Business Assist",
    isCustomBusiness: false, // Flag to track if we're showing custom business data
    hours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 8:00 PM",
      saturday: "10:00 AM - 5:00 PM",
      sunday: "Closed"
    },
    services: [
      { name: "Haircut", price: "$30", description: "Professional haircut by our expert stylists" },
      { name: "Color", price: "$75", description: "Full color treatment with premium products" },
      { name: "Styling", price: "$45", description: "Special occasion styling and blowout" },
      { name: "Treatment", price: "$55", description: "Hair treatments for damaged hair" }
    ],
    promotions: [
      "20% off first-time customers",
      "Free deep conditioning with any color service this month",
      "Refer a friend and get $15 off your next visit"
    ],
    contact: {
      phone: "(555) 123-4567",
      email: "contact@acmesalon.com",
      address: "123 Main Street, Oklahoma City, OK"
    }
  });

  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [botResponse, setBotResponse] = useState(`Welcome to ${businessData.name}! How can I assist you?`);
  const [conversations, setConversations] = useState([
    { type: 'bot', text: `Welcome to ${businessData.name}! How can I assist you?` }
  ]);
  const [googleResults, setGoogleResults] = useState([]);
  const [showGoogleResults, setShowGoogleResults] = useState(false);
  const [userLocation, setUserLocation] = useState("Oklahoma City, OK");

  // Get user's location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Function to get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For simplicity, we'll just store coordinates
          // In a real app, you might want to reverse geocode to get city, state
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  // Function to call n8n VAPI agent workflow
  const callVAPIAgent = async (userMessage) => {
    try {
      // Check if this is a category search (like "pizza near me")
      const isCategorySearch = /\b(near|nearby|close to|around)\b/i.test(userMessage) || 
                              /\b(find|show|where|looking for)\b/i.test(userMessage);
      
      // Enhanced search detection for business categories
      const businessCategories = [
        "restaurant", "food", "pizza", "burger", "sushi", "italian", "mexican", 
        "coffee", "cafe", "bakery", "salon", "barber", "spa", "gym", "fitness",
        "store", "shop", "retail", "market", "grocery", "pharmacy", "doctor",
        "dentist", "auto", "car", "repair", "mechanic", "gas", "hotel", "motel",
        "bar", "pub", "club", "theater", "cinema", "movie", "entertainment"
      ];
      
      const containsCategory = businessCategories.some(category => 
        userMessage.toLowerCase().includes(category)
      );
      
      // Replace with your actual n8n webhook URL
      const response = await fetch('https://yourlocalspotlight.app.n8n.cloud/webhook-test/voice-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          isLocationQuery: isCategorySearch || containsCategory,
          userLocation: userLocation
        }),
      });
      
      const data = await response.json();
      
      // If multiple results returned, store them
      if (data.multipleResults) {
        setGoogleResults(data.googleResults || []);
        setShowGoogleResults(true);
      } else {
        setShowGoogleResults(false);
      }
      
      // If no business found in our database but is a category search
      if (!data.businessData && (isCategorySearch || containsCategory) && data.googleResults) {
        // Handle fallback to Google search results
        return handleGoogleFallback(data.googleResults);
      }
      
      // If business data is returned, update the business information
      if (data.businessData) {
        setBusinessData(prevData => ({
          ...prevData,
          ...data.businessData,
          isCustomBusiness: true
        }));
      }
      
      return data.response || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error('Error calling VAPI agent:', error);
      return "Sorry, I'm having trouble connecting to my backend. Please try again later.";
    }
  };

  // Function to handle Google fallback search
  const handleGoogleFallback = (results) => {
    if (!results || results.length === 0) {
      return "I couldn't find any matching businesses. Could you try a different search?";
    }
    
    // Format the first few results for voice response
    const topResults = results.slice(0, 3);
    const resultText = topResults.map(business => 
      `${business.name} (${business.rating} stars)`
    ).join(", ");
    
    return `I couldn't find that specific business in my database, but I found some options from Google: ${resultText}. Would you like details about any of these?`;
  };

  // Function to handle selecting a business from Google results
  const selectBusiness = (business) => {
    // Format the business data from Google result
    const formattedBusiness = {
      name: business.name,
      isCustomBusiness: true,
      hours: business.hours || businessData.hours, // Fallback to default hours if not provided
      services: [
        { 
          name: business.primaryCategory || "Services", 
          price: "Varies", 
          description: "Contact business for service details" 
        }
      ],
      promotions: ["Ask about current promotions when you visit"],
      contact: {
        phone: business.phone || "Not available",
        email: business.email || "Not available",
        address: business.address || "Not available",
        website: business.website || "Not available"
      }
    };
    
    // Update business data
    setBusinessData(formattedBusiness);
    setShowGoogleResults(false);
    
    // Add message to conversation
    const message = `I've selected ${business.name} for you. Here's the information I could find.`;
    setConversations(prev => [...prev, { type: 'bot', text: message }]);
    setBotResponse(message);
    speak(message);
  };

  // Commands to recognize
  const commands = [
    {
      command: ['hello', 'hi', 'hey'],
      callback: () => 'Hello! How can I help you today?',
      matchInterim: true
    },
    {
      command: ['what are your hours', 'business hours', 'when are you open', 'hours'],
      callback: () => {
        if (businessData.isCustomBusiness) {
          return `${businessData.name} is open: Monday through Wednesday ${businessData.hours.monday}, Thursday and Friday ${businessData.hours.thursday}, Saturday ${businessData.hours.saturday}, and closed on Sunday.`;
        } else {
          return `Please ask about a specific business to see their hours.`;
        }
      },
      matchInterim: false
    },
    {
      command: ['what services do you offer', 'services', 'what do you do'],
      callback: () => {
        if (businessData.isCustomBusiness) {
          const servicesText = businessData.services.map(s => `${s.name} for ${s.price}`).join(', ');
          return `${businessData.name} offers ${servicesText}. Would you like more details about any specific service?`;
        } else {
          return `Please ask about a specific business to see their services.`;
        }
      },
      matchInterim: false
    },
    {
      command: ['tell me about (the) * service', 'tell me about *'],
      callback: (service) => {
        if (service.toLowerCase().includes('business') || 
            service.toLowerCase().includes('salon') || 
            service.toLowerCase().includes('shop') || 
            service.toLowerCase().includes('store')) {
          // This is likely asking about a business, forward to VAPI
          return null; // Return null to indicate this should be handled by VAPI
        }
        
        if (businessData.isCustomBusiness) {
          const serviceData = businessData.services.find(
            s => s.name.toLowerCase() === service.toLowerCase()
          );
          
          if (serviceData) {
            return `${businessData.name}'s ${serviceData.name} service costs ${serviceData.price}. ${serviceData.description}.`;
          } else {
            return `I'm sorry, I couldn't find information about ${service} at ${businessData.name}. Would you like to know about their other services?`;
          }
        } else {
          return `Please ask about a specific business first.`;
        }
      },
      matchInterim: false
    },
    {
      command: ['any promotions', 'deals', 'special offers', 'promotions'],
      callback: () => {
        if (businessData.isCustomBusiness) {
          return `${businessData.name} currently has these promotions: ${businessData.promotions.join('. ')}`;
        } else {
          return `Please ask about a specific business to see their promotions.`;
        }
      },
      matchInterim: false
    },
    {
      command: ['how can I contact you', 'contact', 'contact information', 'phone number', 'email'],
      callback: () => {
        if (businessData.isCustomBusiness) {
          return `You can reach ${businessData.name} at ${businessData.contact.phone}, by email at ${businessData.contact.email}, or visit at ${businessData.contact.address}`;
        } else {
          return `Please ask about a specific business to see their contact information.`;
        }
      },
      matchInterim: false
    },
    {
      command: ['thank you', 'thanks'],
      callback: () => 'You\'re welcome! Is there anything else I can help you with?',
      matchInterim: true
    },
    {
      command: ['goodbye', 'bye', 'that\'s all'],
      callback: () => 'Thank you for using Local Business Assist. Have a great day!',
      matchInterim: true
    }
  ];

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition({ commands });

  // Function to handle clicks on featured businesses
  const handleFeaturedBusinessClick = (businessName) => {
    // This simulates asking the voice assistant about this business
    const message = `Tell me about ${businessName}`;
    setConversations(prev => [...prev, { type: 'user', text: message }]);
    processMessage(message);
  };

  // Function to handle category search
  const handleCategorySearch = (category) => {
    // Similar to handleFeaturedBusinessClick but for categories
    setConversations(prev => [...prev, { type: 'user', text: category }]);
    processMessage(category);
  };

  // Function to process text messages (not voice)
  const processMessage = async (message) => {
    // Similar to processTranscript but for text input
    setConversations(prev => [...prev, { 
      type: 'bot', 
      text: "Processing your request..." 
    }]);
    
    // Call the VAPI agent
    const vapiResponse = await callVAPIAgent(message);
    
    // Update with the response
    setBotResponse(vapiResponse);
    setConversations(prev => {
      // Remove the "processing" message
      const newConversations = [...prev];
      newConversations.pop();
      // Add the actual response
      return [...newConversations, { type: 'bot', text: vapiResponse }];
    });
    speak(vapiResponse);
  };

  // Function to speak text using Speech Synthesis
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // Handle starting listening
  const handleListen = () => {
    if (!isListening) {
      setIsListening(true);
      SpeechRecognition.startListening({ continuous: true });
    } else {
      setIsListening(false);
      SpeechRecognition.stopListening();
      if (transcript) {
        processTranscript();
      }
    }
  };

  // Process the transcript
  const processTranscript = async () => {
    setMessage(transcript);
    
    // Add user message to conversation
    if (transcript.trim() !== '') {
      setConversations(prev => [...prev, { type: 'user', text: transcript }]);
    }
    
    // Check if any command was triggered (if not, provide a default response)
    let commandFound = false;
    
    for (const cmd of commands) {
      if (typeof cmd.command === 'string') {
        if (transcript.toLowerCase().includes(cmd.command.toLowerCase())) {
          const response = cmd.callback();
          if (response === null) {
            // This command should be handled by VAPI
            commandFound = false;
            break;
          }
          setBotResponse(response);
          setConversations(prev => [...prev, { type: 'bot', text: response }]);
          speak(response);
          commandFound = true;
          break;
        }
      } else if (Array.isArray(cmd.command)) {
        for (const phrase of cmd.command) {
          if (transcript.toLowerCase().includes(phrase.toLowerCase())) {
            const response = cmd.callback();
            if (response === null) {
              // This command should be handled by VAPI
              commandFound = false;
              break;
            }
            setBotResponse(response);
            setConversations(prev => [...prev, { type: 'bot', text: response }]);
            speak(response);
            commandFound = true;
            break;
          }
        }
        if (commandFound) break;
      }
    }
    
    // If no command matched, try the VAPI agent
    if (!commandFound && transcript.trim() !== '') {
      setConversations(prev => [...prev, { 
        type: 'bot', 
        text: "Processing your request..." 
      }]);
      
      // Call the VAPI agent
      const vapiResponse = await callVAPIAgent(transcript);
      
      // Update with the response
      setBotResponse(vapiResponse);
      setConversations(prev => {
        // Remove the "processing" message
        const newConversations = [...prev];
        newConversations.pop();
        // Add the actual response
        return [...newConversations, { type: 'bot', text: vapiResponse }];
      });
      speak(vapiResponse);
    }
    
    resetTranscript();
  };

  // Effect for handling browser support
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setBotResponse("Your browser doesn't support speech recognition. Please try Chrome or Edge for the best experience.");
      setConversations(prev => [...prev, { 
        type: 'bot', 
        text: "Your browser doesn't support speech recognition. Please try Chrome or Edge for the best experience." 
      }]);
    }
  }, [browserSupportsSpeechRecognition]);

  return (
    <div className="app-container">
      <header className="app-header">
        <img 
          src="/logo.png" 
          alt="Local Business Assist Logo" 
          className="logo"
        />
        <h1>{businessData.name}</h1>
      </header>
      
      <main className="app-main">
        <div className="assistant-container">
          <div className="conversation-container">
            {conversations.map((item, index) => (
              <div 
                key={index} 
                className={`message ${item.type === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-bubble">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="voice-controls">
            <div className="transcript">
              {isListening ? <p>Listening: {transcript}</p> : <p>Click the microphone and start speaking</p>}
            </div>
            
            <button 
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={handleListen}
            >
              {isListening ? '🔴 Stop' : '🎤 Start'}
            </button>
          </div>

          <SpeechSynthesis 
            text={botResponse} 
            speak={isListening === false} 
            onEnd={() => console.log('Speech finished')}
          />
        </div>
        
        <div className="info-panel">
          {showGoogleResults ? (
            // Show Google search results
            <div className="search-results">
              <h2>Search Results</h2>
              <p>I found these businesses that might match your search:</p>
              <div className="result-list">
                {googleResults.map((business, index) => (
                  <div 
                    key={index} 
                    className="result-card" 
                    onClick={() => selectBusiness(business)}
                  >
                    <h3>{business.name}</h3>
                    <div className="rating">
                      {business.rating} ⭐
                    </div>
                    <p>{business.address}</p>
                    {business.phone && <p>{business.phone}</p>}
                    <button className="select-btn">Select This Business</button>
                  </div>
                ))}
              </div>
            </div>
          ) : !businessData.isCustomBusiness ? (
            // Initial state - show welcome message and instructions
            <div className="welcome-container">
              <h2>Welcome to Local Business Assist! How can I assist you?</h2>
              
              <div className="info-section">
                <h3>How to Use This Assistant</h3>
                <ul>
                  <li>Click the microphone button to start speaking</li>
                  <li>Ask about any local business by name or category</li>
                  <li>Example: "Tell me about Main Street Bakery" or "Find pizza places nearby"</li>
                  <li>Ask for specific information like hours, services, or contact details</li>
                </ul>
              </div>
              
              <div className="info-section">
                <h3>Try These Popular Searches</h3>
                <div className="category-buttons">
                  <button className="category-button" onClick={() => handleCategorySearch("pizza places near me")}>
                    🍕 Pizza Places
                  </button>
                  <button className="category-button" onClick={() => handleCategorySearch("coffee shops near me")}>
                    ☕ Coffee Shops
                  </button>
                  <button className="category-button" onClick={() => handleCategorySearch("auto repair near me")}>
                    🔧 Auto Repair
                  </button>
                  <button className="category-button" onClick={() => handleCategorySearch("hair salons near me")}>
                    💇 Hair Salons
                  </button>
                </div>
              </div>
              
              <div className="info-section">
                <h3>What You Can Ask</h3>
                <ul>
                  <li>Business hours and operation times</li>
                  <li>Available services and prices</li>
                  <li>Contact information</li>
                  <li>Promotions and special offers</li>
                  <li>Directions and location details</li>
                </ul>
              </div>
              
              <div className="featured-section">
                <h3>Featured Businesses</h3>
                <div className="featured-businesses">
                  <div className="featured-business" onClick={() => handleFeaturedBusinessClick("Downtown Diner")}>
                    <div className="business-name">Downtown Diner</div>
                    <div className="business-category">Restaurant</div>
                  </div>
                  <div className="featured-business" onClick={() => handleFeaturedBusinessClick("Quick Auto Repair")}>
                    <div className="business-name">Quick Auto Repair</div>
                    <div className="business-category">Automotive</div>
                  </div>
                  <div className="featured-business" onClick={() => handleFeaturedBusinessClick("Serenity Spa")}>
                    <div className="business-name">Serenity Spa</div>
                    <div className="business-category">Health & Beauty</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show business information once a business is looked up
            <>
              <div className="info-section">
                <h2>Business Hours</h2>
                <ul>
                  {Object.entries(businessData.hours).map(([day, hours]) => (
                    <li key={day}><strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong> {hours}</li>
                  ))}
                </ul>
              </div>
              
              <div className="info-section">
                <h2>Our Services</h2>
                <ul>
                  {businessData.services.map((service, index) => (
                    <li key={index}>
                      <strong>{service.name} - {service.price}</strong>
                      <p>{service.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="info-section">
                <h2>Current Promotions</h2>
                <ul>
                  {businessData.promotions.map((promo, index) => (
                    <li key={index}>{promo}</li>
                  ))}
                </ul>
              </div>
              
              <div className="info-section">
                <h2>Contact Us</h2>
                <p><strong>Phone:</strong> {businessData.contact.phone}</p>
                <p><strong>Email:</strong> {businessData.contact.email}</p>
                <p><strong>Address:</strong> {businessData.contact.address}</p>
                {businessData.contact.website && (
                  <p><strong>Website:</strong> {businessData.contact.website}</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Try asking about a business by name or category, like "Pizza places near me"</p>
      </footer>
    </div>
  );
}

export default App;