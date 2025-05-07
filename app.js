// app.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const stopVoiceBtn = document.getElementById('stop-voice-btn');
    const voiceFeedback = document.getElementById('voice-feedback');
    const chatMessages = document.getElementById('chat-messages');
    const newChatBtn = document.getElementById('new-chat-btn');
    const themeSwitch = document.getElementById('theme-switch');
    const businessName = document.getElementById('business-name');
    const businessCategory = document.getElementById('business-category');
    const businessHours = document.getElementById('business-hours');
    const businessServices = document.getElementById('business-services');
    const businessAvatar = document.getElementById('business-avatar');
    const qrCodeId = document.getElementById('qr-code-id');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    // QR scanner elements
    const qrScannerModal = document.getElementById('qr-scanner-modal');
    const manualEntryModal = document.getElementById('manual-entry-modal');
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    const submitManualEntryBtn = document.getElementById('submit-manual-entry');
    const manualBusinessId = document.getElementById('manual-business-id');
    const manualQrCode = document.getElementById('manual-qr-code');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Config and state
    const apiBaseUrl = https://yourlocalspotlight.app.n8n.cloud/webhook/voice-assistant; // Replace with your actual webhook URL
    let recognition;
    let isListening = false;
    let conversationId = null;
    let businessId = null;
    let currentQrCode = null;
    let qrScanner = null;
    let typingTimeout = null;
    let pendingMessages = {};
    
    // Check if theme preference is stored
    if (localStorage.getItem('darkTheme') === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }
    
    // Check if speech recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
    } else {
        voiceBtn.style.display = 'none';
    }
    
    // Check if user has a stored session
    const storedSession = localStorage.getItem('voiceAssistantSession');
    if (storedSession) {
        try {
            const session = JSON.parse(storedSession);
            businessId = session.businessId;
            conversationId = session.conversationId;
            currentQrCode = session.qrCode;
            
            if (businessId) {
                fetchBusinessInfo(businessId);
                if (currentQrCode) {
                    qrCodeId.textContent = currentQrCode;
                }
            }
        } catch (e) {
            console.error('Error parsing stored session:', e);
            localStorage.removeItem('voiceAssistantSession');
        }
    } else {
        // Show QR scanner on first visit
        setTimeout(() => {
            showQrScannerModal();
        }, 1000);
    }
    
    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    voiceBtn.addEventListener('click', startListening);
    stopVoiceBtn.addEventListener('click', stopListening);
    
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkTheme', 'true');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('darkTheme', 'false');
        }
    });
    
    newChatBtn.addEventListener('click', () => {
        if (confirm('Start a new conversation? Your current chat history will be cleared.')) {
            clearChatHistory();
            conversationId = null;
            saveSession();
            addAssistantMessage('How can I help you today?');
        }
    });
    
    manualEntryBtn.addEventListener('click', () => {
        qrScannerModal.classList.remove('active');
        manualEntryModal.classList.add('active');
    });
    
    submitManualEntryBtn.addEventListener('click', () => {
        const enteredBusinessId = manualBusinessId.value.trim();
        const enteredQrCode = manualQrCode.value.trim();
        
        if (enteredBusinessId) {
            businessId = enteredBusinessId;
            currentQrCode = enteredQrCode || 'manual-entry';
            qrCodeId.textContent = currentQrCode;
            
            fetchBusinessInfo(businessId);
            manualEntryModal.classList.remove('active');
            saveSession();
            
            addAssistantMessage(`Thanks for connecting! How can I help you with information about this business?`);
        } else {
            alert('Please enter a business ID');
        }
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            qrScannerModal.classList.remove('active');
            manualEntryModal.classList.remove('active');
            
            if (qrScanner) {
                qrScanner.stop();
            }
        });
    });
    
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            if (query) {
                chatInput.value = query;
                sendMessage();
            }
        });
    });
    
    // Speech Recognition Event Handlers
    if (recognition) {
        recognition.onstart = function() {
            isListening = true;
            voiceFeedback.classList.remove('hidden');
        };
        
        recognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
                
            chatInput.value = transcript;
        };
        
        recognition.onend = function() {
            if (isListening) {
                // Auto-send message when stopped listening
                if (chatInput.value.trim() !== '') {
                    sendMessage();
                }
                stopListening();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            stopListening();
            
            if (event.error === 'not-allowed') {
                addAssistantMessage("I don't have permission to access your microphone. Please check your browser settings.");
            }
        };
    }
    
    // Functions
    function startListening() {
        if (recognition && !isListening) {
            chatInput.value = '';
            try {
                recognition.start();
            } catch (e) {
                console.error('Error starting speech recognition:', e);
            }
        }
    }
    
    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
            voiceFeedback.classList.add('hidden');
        }
    }
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;
        
        if (isListening) {
            stopListening();
        }
        
        // Add user message to chat
        addUserMessage(message);
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Create unique message ID for this request
        const messageId = Date.now().toString();
        
        // Add to pending messages
        pendingMessages[messageId] = message;
        
        // Send to API
        fetch(apiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcript: message,
                business_id: businessId,
                conversation_id: conversationId,
                qr_code_id: currentQrCode,
                user_id: generateUserId()
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            if (data.success) {
                // Store conversation ID if received
                if (data.conversation_id) {
                    conversationId = data.conversation_id;
                    saveSession();
                }
                
                // Add assistant response
                addAssistantMessage(data.response);
                
                // Check for suggested actions
                if (data.action) {
                    handleAction(data.action);
                }
            } else {
                addAssistantMessage("I'm sorry, I encountered an error processing your request. Please try again.");
            }
            
            // Remove from pending messages
            delete pendingMessages[messageId];
        })
        .catch(error => {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            addAssistantMessage("I'm having trouble connecting to the server. Please check your internet connection and try again.");
            
            // Remove from pending messages
            delete pendingMessages[messageId];
        });
    }
    
    function addUserMessage(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageHTML = `
            <div class="message user">
                <div class="message-avatar">
                    <img src="user-avatar.svg" alt="User">
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <p>${escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
    }
    
    function addAssistantMessage(text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageHTML = `
            <div class="message assistant">
                <div class="message-avatar">
                    <img src="assistant-avatar.svg" alt="Assistant">
                </div>
                <div class="message-content">
                    <div class="message-text">
                        <p>${formatMessageText(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom();
    }
    
    function showTypingIndicator() {
        const typingHTML = `
            <div class="message assistant typing-message">
                <div class="message-avatar">
                    <img src="assistant-avatar.svg" alt="Assistant">
                </div>
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', typingHTML);
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function formatMessageText(text) {
        // Replace URLs with clickable links
        let formatted = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Replace line breaks with <br> tags
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    function fetchBusinessInfo(id) {
        // Show loading state
        businessName.textContent = 'Loading...';
        businessCategory.textContent = 'Retrieving business information';
        businessHours.innerHTML = '<li>Loading hours...</li>';
        businessServices.innerHTML = '<li>Loading services...</li>';
        
        // In a real implementation, fetch business info from your API
        // For demo purposes, we'll use a timeout to simulate an API call
        setTimeout(() => {
            // This would be replaced with actual API call in production
            const mockBusinessData = {
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
                avatarUrl: 'https://via.placeholder.com/80'
            };
            
            updateBusinessUI(mockBusinessData);
        }, 1500);
    }
    
    function updateBusinessUI(data) {
        businessName.textContent = data.name;
        businessCategory.textContent = data.category;
        
        // Update hours
        let hoursHTML = '';
        if (data.hours) {
            const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            daysOfWeek.forEach(day => {
                if (data.hours[day]) {
                    const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
                    hoursHTML += `<li>${capitalizedDay}: ${data.hours[day]}</li>`;
                }
            });
        }
        
        businessHours.innerHTML = hoursHTML || '<li>Hours not available</li>';
        
        // Update services
        let servicesHTML = '';
        if (data.services && data.services.length > 0) {
            data.services.forEach(service => {
                servicesHTML += `<li>${service}</li>`;
            });
        }
        
        businessServices.innerHTML = servicesHTML || '<li>Services not available</li>';
        
        // Update avatar
        if (data.avatarUrl) {
            businessAvatar.src = data.avatarUrl;
        }
    }
    
    function handleAction(action) {
        // Handle different types of actions returned by the API
        if (action.type === 'booking' && action.url) {
            // Show booking confirmation or redirect
            const confirmBooking = confirm(`${action.message || 'Would you like to book an appointment?'}`);
            if (confirmBooking) {
                window.open(action.url, '_blank');
            }
        } else if (action.type === 'contact') {
            // Show contact options
            const contact = confirm(`${action.message || 'Would you like to contact this business?'}`);
            if (contact) {
                if (action.phone) {
                    window.location.href = `tel:${action.phone}`;
                } else if (action.email) {
                    window.location.href = `mailto:${action.email}`;
                }
            }
        }
    }
    
    function showQrScannerModal() {
        qrScannerModal.classList.add('active');
        
        // Initialize QR scanner if HTML5 QR Code is available
        if (Html5QrCode && document.getElementById('qr-scanner')) {
            qrScanner = new Html5QrCode("qr-scanner");
            
            qrScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                onQrCodeSuccess,
                onQrCodeError
            ).catch((err) => {
                console.error("Error starting QR scanner:", err);
                
                // Show manual entry option if camera fails
                alert("Could not access the camera. Please enter business details manually.");
                qrScannerModal.classList.remove('active');
                manualEntryModal.classList.add('active');
            });
        } else {
            // Fallback for browsers without QR scanning capabilities
            const scannerPlaceholder = document.getElementById('qr-scanner');
            if (scannerPlaceholder) {
                scannerPlaceholder.innerHTML = '<p>QR scanning not available on your browser. Please enter details manually.</p>';
            }
        }
    }
    
    function onQrCodeSuccess(decodedText) {
        // Stop the scanner once we get a result
        if (qrScanner) {
            qrScanner.stop();
        }
        
        // Parse the QR code data
        try {
            const qrData = JSON.parse(decodedText);
            
            if (qrData.business_id) {
                businessId = qrData.business_id;
                currentQrCode = qrData.qr_code_id || 'scanned';
                qrCodeId.textContent = currentQrCode;
                
                fetchBusinessInfo(businessId);
                qrScannerModal.classList.remove('active');
                saveSession();
                
                addAssistantMessage(`Thanks for scanning! I'm here to help you with information about ${qrData.business_name || 'this business'}. What would you like to know?`);
            } else {
                alert('Invalid QR code. Please try another one or enter details manually.');
            }
            
        } catch (e) {
            console.error('Error parsing QR code:', e);
            alert('Could not read QR code. Please try again or enter details manually.');
            
            // Restart scanner
            if (qrScanner) {
                qrScanner.resume();
            }
        }
    }
    
    function onQrCodeError(err) {
        // Just log errors, don't show to user unless scanning stops
        console.log('QR Code scanning error:', err);
    }
    
    function generateUserId() {
        // Generate a persistent user ID or get from localStorage
        let userId = localStorage.getItem('voiceAssistantUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('voiceAssistantUserId', userId);
        }
        return userId;
    }
    
    function saveSession() {
        // Save current session to localStorage
        const sessionData = {
            businessId: businessId,
            conversationId: conversationId,
            qrCode: currentQrCode
        };
        
        localStorage.setItem('voiceAssistantSession', JSON.stringify(sessionData));
    }
    
    function clearChatHistory() {
        // Clear chat messages except for the initial greeting
        const children = Array.from(chatMessages.children);
        for (let i = 0; i < children.length; i++) {
            if (i > 0) { // Keep the first message
                children[i].remove();
            }
        }
    }
    
    // Placeholder SVGs for development
    createPlaceholderSVGs();
});

function createPlaceholderSVGs() {
    // Create placeholder SVGs for development
    const logoPlaceholder = `
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#4F46E5"/>
            <path d="M11 18C11 14.134 14.134 11 18 11V25C14.134 25 11 21.866 11 18Z" fill="white"/>
            <path d="M25 18C25 21.866 21.866 25 18 25V11C21.866 11 25 14.134 25 18Z" fill="#E0E7FF"/>
        </svg>
    `;
    
    const businessPlaceholder = `
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="40" fill="#E2E8F0"/>
            <path d="M40 20L47.3205 34.1421L62.7128 36.3803L51.3564 47.358L54.1229 62.6197L40 55.5L25.8771 62.6197L28.6436 47.358L17.2872 36.3803L32.6795 34.1421L40 20Z" fill="#94A3B8"/>
        </svg>
    `;
    
    const assistantAvatar = `
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="18" fill="#4F46E5"/>
            <path d="M18 10.5L20.8387 16.2738L27.1436 17.0574L22.5718 21.4762L23.6775 27.7426L18 24.78L12.3225 27.7426L13.4282 21.4762L8.85635 17.0574L15.1613 16.2738L18 10.5Z" fill="white"/>
        </svg>
    `;
    
    const userAvatar = `
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="18" fill="#F0F9FF"/>
            <circle cx="18" cy="15" r="6" fill="#0EA5E9"/>
            <path d="M30 36C30 29.3726 24.6274 24 18 24C11.3726 24 6 29.3726 6 36" fill="#0EA5E9"/>
        </svg>
    `;
    
    // Create placeholder files if they don't exist
    createDataURLFile('logo-placeholder.svg', logoPlaceholder);
    createDataURLFile('business-placeholder.svg', businessPlaceholder);
    createDataURLFile('assistant-avatar.svg', assistantAvatar);
    createDataURLFile('user-avatar.svg', userAvatar);
}

function createDataURLFile(filename, svgContent) {
    // Create a blob URL for the SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Find all image elements with this src and update them
    const images = document.querySelectorAll(`img[src="${filename}"]`);
    images.forEach(img => {
        img.src = url;
    });
}