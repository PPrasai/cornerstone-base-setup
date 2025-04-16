import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StackViewerPage from '../../pages/StackViewerPage';

const setupViewerMock = vi.fn().mockResolvedValue({});
const destroyMock = vi.fn();

vi.mock('../../services/cornerstoneService', () => ({
    CornerstoneService: vi.fn().mockImplementation(() => ({
        setupViewer: setupViewerMock,
        destroy: destroyMock,
    })),
    createStackViewerConfig: vi.fn().mockReturnValue({}),
}));

describe('StackViewerPage', () => {
    beforeEach(() => {
        render(
            <MemoryRouter>
                <StackViewerPage />
            </MemoryRouter>,
        );
    });

    it('renders InfoCard with correct title and description', () => {
        expect(screen.getByText('Stack Viewer')).toBeInTheDocument();
        expect(
            screen.getByText(
                'This is a stack viewer that displays a series of images in a stack format.',
            ),
        ).toBeInTheDocument();
    });

    it('displays loading text when cornerstoneService is not available', () => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders the stack viewport after cornerstoneService is initialized', async () => {
        const mockElement = document.createElement('div');
        mockElement.setAttribute('id', 'stack-viewport');
        document.body.appendChild(mockElement);

        await waitFor(() =>
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument(),
        );

        const stackViewport = screen.getByTestId('stack-viewport');
        expect(stackViewport).toBeInTheDocument();

        expect(setupViewerMock).toHaveBeenCalled();
    });
});
