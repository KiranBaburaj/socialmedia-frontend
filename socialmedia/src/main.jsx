import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import ReactDOM from 'react-dom/client';

// Create a root using createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render your app within the root
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
