import React from 'react';
import './App.css';
import DagonCanvas from './DagonCanvas';

function App() {

  return (
    <div className="App">
      
      <header className="App-header">
        <div>
          <DagonCanvas width={window.innerWidth} height={window.innerHeight} />
        </div>
      </header>
    </div>
  );
}

export default App;
