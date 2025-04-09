import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import StackViewerPage from './pages/StackViewerPage';

import './App.css';

function App(): React.JSX.Element {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/stack-viewer" element={<StackViewerPage />} />
                {/* <Route path="/mpr-viewer" element={<MPRViewerPage />} />
                <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
