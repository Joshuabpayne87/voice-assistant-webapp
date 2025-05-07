# Voice Assistant Web Application

A modern, interactive voice assistant web application built with React. This application features speech recognition, text-to-speech capabilities, and a responsive design that works on all devices.

## Features

- **Speech Recognition**: Interact with the assistant using voice commands
- **Text-to-Speech**: Listen to the assistant's responses
- **Chat Interface**: View conversation history in a chat-like interface
- **Business Information Panel**: Display hours, services, promotions, and contact information
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between dark and light modes
- **Voice Selection**: Choose from available system voices

## Demo

![Voice Assistant Demo](https://via.placeholder.com/800x450.png?text=Voice+Assistant+Demo)

## Setup Instructions

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/voice-assistant-webapp.git
   cd voice-assistant-webapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

To create a production build:

```
npm run build
```

The build files will be created in the `build` directory.

## Project Structure

```
voice-assistant-webapp/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── App.js              # Main React component
│   ├── App.css             # Styles for the application
│   ├── SpeechSynthesis.js  # Text-to-speech component
│   ├── index.js            # Entry point
│   └── ...
├── package.json
└── README.md
```

## Required Dependencies

The project uses the following main dependencies:

- **React**: UI library
- **react-speech-recognition**: For speech recognition functionality
- **Web Speech API**: For text-to-speech (built into modern browsers)

All dependencies are listed in the `package.json` file and will be installed with `npm install`.

## Customization Options

### Business Information

You can customize the business information by modifying the `businessInfo` state in `App.js`:

```javascript
const [businessInfo, setBusinessInfo] = useState({
  name: 'Your Business Name',
  category: 'Your Business Category',
  description: 'Your business description.',
  hours: {
    monday: '9:00 AM - 5:00 PM',
    // ... other days
  },
  services: [
    'Service 1',
    'Service 2',
    // ... other services
  ],
  avatarUrl: 'path/to/your/logo.png'
});
```

### Voice Commands

You can customize the voice commands by modifying the `processMessage` function in `App.js`. Add new conditions to handle different types of queries:

```javascript
if (lowerMessage.includes('your-keyword')) {
  response = "Your custom response here";
} 
```

### Styling

You can customize the appearance by modifying the CSS variables in `App.css`:

```css
:root {
  --accent-color: #4f46e5; /* Change to your brand color */
  /* ... other variables */
}
```

## Browser Compatibility

This application works best in modern browsers that support the Web Speech API:

- Chrome (desktop and Android)
- Edge
- Safari (desktop and iOS)
- Firefox

Note: Speech recognition functionality may vary across browsers. Chrome provides the best support for the Web Speech API.

## Troubleshooting

### Speech Recognition Not Working

- Ensure you've granted microphone permissions to the website
- Check if your browser supports the Web Speech API
- Try using Chrome for the best compatibility

### Text-to-Speech Not Working

- Ensure your device's volume is turned up
- Check if your browser supports the SpeechSynthesis API
- Try refreshing the page

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for icons
- Google Fonts for the Inter font family