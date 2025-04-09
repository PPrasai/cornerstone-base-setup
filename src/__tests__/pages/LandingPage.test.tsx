import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LandingPage from '../../pages/LandingPage';

// helper to test if navigation worked
const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
};

describe('LandingPage', () => {
    it('renders Stack Viewer and MPR Viewer buttons', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <LandingPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Stack Viewer')).toBeInTheDocument();
        expect(screen.getByText('MPR Viewer')).toBeInTheDocument();
    });

    it('navigates to /stack-viewer when Stack Viewer is clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>,
        );

        await userEvent.click(screen.getByText('Stack Viewer'));

        expect(screen.getByTestId('location')).toHaveTextContent(
            '/stack-viewer',
        );
    });

    it('navigates to /mpr-viewer when MPR Viewer is clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>,
        );

        await userEvent.click(screen.getByText('MPR Viewer'));

        expect(screen.getByTestId('location')).toHaveTextContent('/mpr-viewer');
    });
});
