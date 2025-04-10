import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import StackViewerPage from '../../pages/StackViewerPage';
import { CornerstoneService } from '../../services/cornerstoneService';

vi.mock('../services/dicomService', () => ({
    fetchImageIds: vi.fn().mockResolvedValue(['image-id-1', 'image-id-2']),
}));

vi.mock('../services/cornerstoneService', () => ({
    CornerstoneService: vi.fn().mockImplementation(() => ({
        setupViewer: vi.fn(),
        destroy: vi.fn(),
    })),
    createStackViewerConfig: vi.fn().mockReturnValue({}),
}));

describe('StackViewerPage', () => {
    it('renders InfoCard with correct title and description', () => {
        render(
            <MemoryRouter>
                <StackViewerPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Stack Viewer')).toBeInTheDocument();
        expect(
            screen.getByText(
                'This is a stack viewer that displays a series of images in a stack format.',
            ),
        ).toBeInTheDocument();
    });

    it('displays loading text when cornerstoneService is not available', () => {
        render(
            <MemoryRouter>
                <StackViewerPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the stack viewport after cornerstoneService is initialized', async () => {
        const mockElement = document.createElement('div');
        mockElement.setAttribute('id', 'stack-viewport');
        document.body.appendChild(mockElement);
        const setupViewerSpy = vi.spyOn(
            CornerstoneService.prototype,
            'setupViewer',
        );

        render(
            <MemoryRouter>
                <StackViewerPage />
            </MemoryRouter>,
        );

        await waitFor(() =>
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument(),
        );

        const stackViewport = screen.getByTestId('stack-viewport');
        expect(stackViewport).toBeInTheDocument();
        expect(setupViewerSpy).toHaveBeenCalled();
    });
});
