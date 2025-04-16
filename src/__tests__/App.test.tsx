/* eslint-disable react/react-in-jsx-scope */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('App Routing', () => {
    it('renders LandingPage on route "/"', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        );

        expect(
            screen.getByText(/Select one of the viewers/i),
        ).toBeInTheDocument();
    });

    it('renders StackViewerPage on route "/stack-viewer"', () => {
        render(
            <MemoryRouter initialEntries={['/stack-viewer']}>
                <App />
            </MemoryRouter>,
        );

        expect(screen.getByText(/This is a stack viewer/i)).toBeInTheDocument();
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('renders NotFoundPage on unknown route', () => {
        render(
            <MemoryRouter initialEntries={['/some-random-page']}>
                <App />
            </MemoryRouter>,
        );

        expect(screen.getByText(/404/i)).toBeInTheDocument();
        expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    });
});
