import React from 'react';
import './App.css';
import DagonCanvas from './DagonCanvas';

function App() {

  return (
    <div className="App">
      
      <header className="App-header">
        <div>
          <DagonCanvas width={1000} height={800}/>
        </div>
      </header>
    </div>
  );
}

export default App;
