import React from 'react';
import './App.css';
import Canvas from './Canvas';

function App() {

  return (
    <div className="App">
      
      <header className="App-header">
        <div style={{border: '3px solid green'}}>
          <Canvas width={1000} height={800}/>
        </div>
      </header>
    </div>
  );
}

export default App;
