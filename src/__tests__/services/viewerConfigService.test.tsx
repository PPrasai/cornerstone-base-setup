import { describe, it, expect } from 'vitest';
import { Enums } from '@cornerstonejs/core';
import { createStackViewerConfig } from '../../services/viewerConfigService';

describe('createStackViewerConfig', () => {
    it('should create a viewer config with the correct default background', () => {
        const fakeDiv = document.createElement('div');
        const config = createStackViewerConfig({
            viewportId: 'test-viewport',
            element: fakeDiv,
            imageIds: ['img1', 'img2'],
            defaultImageIndex: 0,
        });

        expect(config.viewportId).toBe('test-viewport');
        expect(config.imageIds).toEqual(['img1', 'img2']);
        expect(config.defaultOptions).toEqual({ background: [0.2, 0, 0.2] });
        expect(config.viewerType).toBe(Enums.ViewportType.STACK);
        expect(config.tools).toBeInstanceOf(Array);
        expect(config.tools!.length).toBeGreaterThanOrEqual(1);
    });

    it('should override the background if provided', () => {
        const fakeDiv = document.createElement('div');
        const config = createStackViewerConfig({
            viewportId: 'test-viewport',
            element: fakeDiv,
            imageIds: ['img1', 'img2'],
            options: { background: [0.1, 0.1, 0.3] },
        });

        expect(config.defaultOptions).toEqual({ background: [0.1, 0.1, 0.3] });
    });
});
