import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CornerstoneService } from '../../services/cornerstoneService';
import { Types } from '@cornerstonejs/core';

const mockViewport: Partial<Types.IStackViewport> = {
    id: 'test-viewport',
    setStack: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    getViewReference: vi.fn().mockReturnValue({ some: 'reference' }),
    setViewReference: vi.fn(),
    getViewPresentation: vi.fn().mockReturnValue({ some: 'presentation' }),
    setViewPresentation: vi.fn(),
};

const mockRenderingEngine = {
    id: 'mock-engine',
    getViewport: vi.fn().mockReturnValue(mockViewport),
    enableElement: vi.fn(),
    disableElement: vi.fn(),
    resize: vi.fn(),
};

describe('CornerstoneService', () => {
    let service: CornerstoneService;

    beforeEach(() => {
        service = new CornerstoneService('mock-engine');
        // @ts-expect-error: overriding private property
        service.renderingEngine = mockRenderingEngine;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('setViewportStack', () => {
        it('should throw an error if viewport is not found', async () => {
            mockRenderingEngine.getViewport.mockReturnValueOnce(null);
            await expect(
                service.setViewportStack('non-existent', ['img1', 'img2']),
            ).rejects.toThrow(/Viewport with ID non-existent not found/);
        });

        it('should call setStack and render on the viewport if found', async () => {
            await service.setViewportStack(
                'test-viewport',
                ['img1', 'img2'],
                1,
            );

            expect(mockViewport.setStack).toHaveBeenCalledWith(
                ['img1', 'img2'],
                1,
            );
            expect(mockViewport.render).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        it('should disconnect and remove the resize observer if it exists', () => {
            const mockObserver = { disconnect: vi.fn() };
            // @ts-expect-error: access private field for testing purposes
            service.resizeObservers.set('test-viewport', mockObserver);

            service.destroy('test-viewport');

            expect(mockObserver.disconnect).toHaveBeenCalled();
            // @ts-expect-error: accessing private property for test check
            expect(service.resizeObservers.has('test-viewport')).toBeFalsy();
            expect(mockRenderingEngine.disableElement).toHaveBeenCalledWith(
                'test-viewport',
            );
        });
    });
});
