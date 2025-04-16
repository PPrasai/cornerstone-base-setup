import React from 'react';
import { Route, Routes } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import StackViewerPage from './pages/StackViewerPage';
import MPRViewerPage from './pages/MPRViewerPage';
import PageNotFound from './pages/PageNotFound';

import './App.css';

function App(): React.JSX.Element {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stack-viewer" element={<StackViewerPage />} />
            <Route path="/mpr-viewer" element={<MPRViewerPage />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}

export default App;
