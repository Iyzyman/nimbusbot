// src/App.tsx
import React from 'react';
import Chat from './components/Chat';
import cloudIcon from "./images/1280px-Cartoon_cloud.svg.png"

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header" style={{backgroundImage: `url(${cloudIcon})` ,backgroundSize: 'contain', // Cover the entire area
          backgroundPosition: 'center', // Center the background image
          backgroundRepeat: 'no-repeat'}}>
         {/* align center */}
        <h1 style={{ 
          textAlign: 'center' ,color: 'skyblue' }}>Nimbus Chatbot</h1>
      </header>
      <main>
        <Chat />
      </main>
    </div>
  );
};

export default App;
