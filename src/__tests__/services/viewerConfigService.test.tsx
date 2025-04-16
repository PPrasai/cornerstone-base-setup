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

        expect(config.viewportIds.length).toBe(1);
        expect(config.viewportIds[0]).toBe('test-viewport');
        expect(config.imageIds).toEqual(['img1', 'img2']);
        expect(config.defaultOptions![config.viewportIds[0]]).toEqual({
            background: [0.2, 0, 0.2],
        });
        expect(config.viewerTypes.length).toBe(1);
        expect(config.viewerTypes[0]).toBe(Enums.ViewportType.STACK);
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

        expect(config.defaultOptions![config.viewportIds[0]]).toEqual({
            background: [0.1, 0.1, 0.3],
        });
    });
});
