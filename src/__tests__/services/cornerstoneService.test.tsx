/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CornerstoneService } from '../../services/cornerstoneService';
import { Enums, Types } from '@cornerstonejs/core';
import { addTool, ToolGroupManager } from '@cornerstonejs/tools';

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

vi.mock('@cornerstonejs/tools', async () => {
    const actual = await vi.importActual<typeof import('@cornerstonejs/tools')>(
        '@cornerstonejs/tools',
    );

    return {
        ...actual,
        ToolGroupManager: {
            getToolGroup: vi.fn(),
            createToolGroup: vi.fn(),
        },
        addTool: vi.fn(),
    };
});

global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    callback,
}));

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

    it('should throw an error if viewport is not found', async () => {
        mockRenderingEngine.getViewport.mockReturnValueOnce(null);
        await expect(
            service.setViewportStack('non-existent', ['img1', 'img2']),
        ).rejects.toThrow(/Viewport with ID non-existent not found/);
    });

    it('should throw an error if rendering engine is not created yet', async () => {
        // @ts-expect-error: overriding private property
        service.renderingEngine = null;

        const mockConfig = {
            viewportIds: ['mock-viewport-id'],
            elements: [document.createElement('div')],
            viewerTypes: [Enums.ViewportType.STACK],
            imageIds: ['img1', 'img2'],
        };

        await expect(service.setupViewer(mockConfig)).rejects.toThrow(
            /Rendering engine is not initialized./,
        );
    });

    it('should initialize the viewer successfully (happy path)', async () => {
        const mockConfig = {
            viewportIds: ['test-viewport'],
            elements: [document.createElement('div')],
            viewerTypes: [Enums.ViewportType.STACK],
            imageIds: ['img1', 'img2'],
            defaultOptions: {},
            defaultImageIndex: 0,
        };

        // Use spyOn to override the private methods
        const initViewportForSingleSpy = vi
            .spyOn(service as any, '_initViewport')
            .mockResolvedValue(mockViewport);
        const setupToolGroupSpy = vi
            .spyOn(service as any, '_setupToolGroup')
            .mockImplementation(() => {});
        const observeResizeSpy = vi
            .spyOn(service as any, '_observeResize')
            .mockImplementation(() => {});
        service.setViewportStack = vi.fn();

        const viewports = await service.setupViewer(mockConfig);

        expect(initViewportForSingleSpy).toHaveBeenCalledTimes(
            mockConfig.viewportIds.length,
        );

        // Verify that each viewport initialization was called with the correct parameters.
        mockConfig.viewportIds.forEach((id, index) => {
            expect(initViewportForSingleSpy).toHaveBeenCalledWith(
                id,
                mockConfig.elements[index],
                mockConfig.viewerTypes[index],
                mockConfig.defaultOptions, // defaultOptions should be passed, which is undefined in this test
            );
        });

        // _setupToolGroup should be called once with the config and the array of viewports.
        expect(setupToolGroupSpy).toHaveBeenCalledWith(mockConfig, [
            mockViewport,
        ]);

        // _observeResize should be called for each viewport.
        mockConfig.viewportIds.forEach((id, index) => {
            expect(observeResizeSpy).toHaveBeenCalledWith(
                id,
                mockConfig.elements[index],
                mockViewport,
            );
        });

        // setViewportStack should be invoked once per viewport.
        mockConfig.viewportIds.forEach((id) => {
            expect(service.setViewportStack).toHaveBeenCalledWith(
                id,
                mockConfig.imageIds,
                mockConfig.defaultImageIndex,
            );
        });

        expect(viewports).toEqual([mockViewport]);
    });

    it('should still work without defaultImageIndex', async () => {
        const mockConfig = {
            viewportIds: ['test-viewport'],
            elements: [document.createElement('div')],
            viewerTypes: [Enums.ViewportType.STACK],
            imageIds: ['img1', 'img2'],
        };

        // Mock the private methods
        // @ts-expect-error: mocking private method
        service._initViewport = vi.fn().mockResolvedValue(mockViewport);
        // @ts-expect-error: mocking private method
        service._setupToolGroup = vi.fn();
        // @ts-expect-error: mocking private method
        service._observeResize = vi.fn();
        service.setViewportStack = vi.fn();

        await service.setupViewer(mockConfig);

        // Verify that setViewportStack was called with undefined as the default image index
        mockConfig.viewportIds.forEach((id) => {
            expect(service.setViewportStack).toHaveBeenCalledWith(
                id,
                mockConfig.imageIds,
                undefined,
            );
        });
    });

    it('should call setStack and render on the viewport if found', async () => {
        await service.setViewportStack('test-viewport', ['img1', 'img2'], 1);

        expect(mockViewport.setStack).toHaveBeenCalledWith(['img1', 'img2'], 1);
        expect(mockViewport.render).toHaveBeenCalled();
    });

    it('should disconnect and remove the resize observer if it exists', () => {
        const mockObserver = { disconnect: vi.fn() };
        // @ts-expect-error: accessing private property for testing purposes
        service.resizeObservers.set('test-viewport', mockObserver);

        service.destroy('test-viewport');

        expect(mockObserver.disconnect).toHaveBeenCalled();
        // @ts-expect-error: accessing private property for testing purposes
        expect(service.resizeObservers.has('test-viewport')).toBeFalsy();
        expect(mockRenderingEngine.disableElement).toHaveBeenCalledWith(
            'test-viewport',
        );
    });
});

describe('_setupToolGroup', () => {
    let service: CornerstoneService;
    const mockToolGroup = {
        addViewport: vi.fn(),
        addTool: vi.fn(),
        setToolActive: vi.fn(),
    };

    beforeEach(() => {
        service = new CornerstoneService('mock-engine');
        // @ts-expect-error: overriding private property
        service.renderingEngine = { id: 'mock-engine' };
        vi.clearAllMocks();
    });

    it('should use existing tool group and configure tools', () => {
        (ToolGroupManager.getToolGroup as any).mockReturnValue(mockToolGroup);

        const config = {
            viewportIds: ['testViewport'],
            tools: [
                {
                    tool: 'LengthTool',
                    toolName: 'Length',
                    active: true,
                    bindings: [{ mouseButton: 1 }],
                },
                {
                    tool: 'PanTool',
                    toolName: 'Pan',
                },
            ],
        };

        // Pass the viewports as an array.
        // @ts-expect-error: accessing private method
        service._setupToolGroup(config, [mockViewport]);

        expect(ToolGroupManager.getToolGroup).toHaveBeenCalledWith(
            'testViewport-group',
        );
        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'test-viewport',
            'mock-engine',
        );
        expect(addTool).toHaveBeenCalledWith('LengthTool');
        expect(addTool).toHaveBeenCalledWith('PanTool');
        expect(mockToolGroup.addTool).toHaveBeenCalledWith('Length');
        expect(mockToolGroup.addTool).toHaveBeenCalledWith('Pan');
        expect(mockToolGroup.setToolActive).toHaveBeenCalledWith('Length', {
            bindings: [{ mouseButton: 1 }],
        });
    });

    it('should create a tool group if it does not exist', () => {
        (ToolGroupManager.getToolGroup as any).mockReturnValue(null);
        (ToolGroupManager.createToolGroup as any).mockReturnValue(
            mockToolGroup,
        );

        const config = {
            viewportIds: ['newViewport'],
            tools: [],
        };

        // Pass viewports as an array
        // @ts-expect-error: accessing private method
        service._setupToolGroup(config, [mockViewport]);

        expect(ToolGroupManager.createToolGroup).toHaveBeenCalledWith(
            'newViewport-group',
        );
        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'test-viewport',
            'mock-engine',
        );
    });

    it('should handle no tools gracefully', () => {
        (ToolGroupManager.getToolGroup as any).mockReturnValue(mockToolGroup);

        const config = {
            viewportIds: ['emptyToolsViewport'],
        };

        // Pass viewports as an array
        // @ts-expect-error: accessing private method
        service._setupToolGroup(config, [mockViewport]);

        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'test-viewport',
            'mock-engine',
        );
        expect(mockToolGroup.addTool).not.toHaveBeenCalled();
    });
});

describe('_observeResize', () => {
    let service: CornerstoneService;
    const mockViewport = {
        id: 'mock-viewport',
        setViewReference: vi.fn(),
        setViewPresentation: vi.fn(),
        getViewReference: vi.fn().mockReturnValue('viewRef'),
        getViewPresentation: vi.fn().mockReturnValue('viewPres'),
    } as unknown as Types.IStackViewport;

    beforeEach(() => {
        service = new CornerstoneService('mock-engine');
        // @ts-expect-error: overriding private property
        service.renderingEngine = { resize: vi.fn() };

        // @ts-expect-error: overriding private property
        service.resizeObservers = new Map();
        vi.clearAllMocks();
    });

    it('should create a ResizeObserver and observe the element', () => {
        const element = document.createElement('div');
        const viewportId = 'test-viewport';

        // @ts-expect-error: accessing private method
        service._observeResize(viewportId, element, mockViewport);

        // @ts-expect-error: accessing private property for test check
        const observer = service.resizeObservers.get(viewportId);
        expect(observer).toBeDefined();
        expect(ResizeObserver).toHaveBeenCalled();
        expect(observer?.observe).toHaveBeenCalledWith(element);
    });

    it('should add observer to resizeObservers map', () => {
        const element = document.createElement('div');
        const viewportId = 'test-viewport';

        // @ts-expect-error: accessing private method
        service._observeResize(viewportId, element, mockViewport);

        // @ts-expect-error: accessing private property for test check
        const observer = service.resizeObservers.get(viewportId);
        expect(observer).toBeDefined();
    });
});
