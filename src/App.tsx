import React from 'react';
import './App.css';
import Canvas from './Canvas';

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <Canvas width={1000} height={800}/>
      </header>
    </div>
  );
}

export default App;
