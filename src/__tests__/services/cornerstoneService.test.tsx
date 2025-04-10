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
            viewportId: 'mock-viewport-id',
            element: document.createElement('div'),
            viewerType: Enums.ViewportType.STACK,
            imageIds: ['img1', 'img2'],
        };

        await expect(service.setupViewer(mockConfig)).rejects.toThrow(
            /Rendering engine is not initialized./,
        );
    });

    it('should initialize the viewer successfully (happy path)', async () => {
        const mockConfig = {
            viewportId: 'test-viewport',
            element: document.createElement('div'),
            viewerType: Enums.ViewportType.STACK,
            imageIds: ['img1', 'img2'],
            defaultImageIndex: 0,
        };

        // @ts-expect-error: mocking private method
        service._initViewport = vi.fn().mockResolvedValue(mockViewport);

        // @ts-expect-error: mocking private method
        service._setupToolGroup = vi.fn();

        // @ts-expect-error: mocking private method
        service._observeResize = vi.fn();
        service.setViewportStack = vi.fn();

        const viewport = await service.setupViewer(mockConfig);

        // @ts-expect-error: access private method
        expect(service._initViewport).toHaveBeenCalledWith(mockConfig);

        // @ts-expect-error: access private method
        expect(service._setupToolGroup).toHaveBeenCalledWith(
            mockConfig,
            mockViewport,
        );

        // @ts-expect-error: access private method
        expect(service._observeResize).toHaveBeenCalledWith(
            mockConfig.viewportId,
            mockConfig.element,
            mockViewport,
        );

        expect(service.setViewportStack).toHaveBeenCalledWith(
            mockConfig.viewportId,
            mockConfig.imageIds,
            mockConfig.defaultImageIndex,
        );
        expect(viewport).toBe(mockViewport);
    });

    it('should still work without defaultImageIndex', async () => {
        const mockConfig = {
            viewportId: 'test-viewport',
            element: document.createElement('div'),
            viewerType: Enums.ViewportType.STACK,
            imageIds: ['img1', 'img2'],
        };

        // @ts-expect-error: mocking private method
        service._initViewport = vi.fn().mockResolvedValue(mockViewport);

        // @ts-expect-error: mocking private method
        service._setupToolGroup = vi.fn();

        // @ts-expect-error: mocking private method
        service._observeResize = vi.fn();
        service.setViewportStack = vi.fn();

        await service.setupViewer(mockConfig);

        expect(service.setViewportStack).toHaveBeenCalledWith(
            mockConfig.viewportId,
            mockConfig.imageIds,
            undefined,
        );
    });

    it('should call setStack and render on the viewport if found', async () => {
        await service.setViewportStack('test-viewport', ['img1', 'img2'], 1);

        expect(mockViewport.setStack).toHaveBeenCalledWith(['img1', 'img2'], 1);
        expect(mockViewport.render).toHaveBeenCalled();
    });

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

describe('_setupToolGroup', () => {
    let service: CornerstoneService;
    const mockViewport = { id: 'mock-viewport' } as any;
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
            viewportId: 'testViewport',
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

        // @ts-expect-error: access private method
        service._setupToolGroup(config, mockViewport);

        expect(ToolGroupManager.getToolGroup).toHaveBeenCalledWith(
            'testViewport-group',
        );
        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'mock-viewport',
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
            viewportId: 'newViewport',
            tools: [],
        };

        // @ts-expect-error: access private method
        service._setupToolGroup(config, mockViewport);

        expect(ToolGroupManager.createToolGroup).toHaveBeenCalledWith(
            'newViewport-group',
        );
        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'mock-viewport',
            'mock-engine',
        );
    });

    it('should handle no tools gracefully', () => {
        (ToolGroupManager.getToolGroup as any).mockReturnValue(mockToolGroup);

        const config = {
            viewportId: 'emptyToolsViewport',
        };

        // @ts-expect-error: access private method
        service._setupToolGroup(config, mockViewport);

        expect(mockToolGroup.addViewport).toHaveBeenCalledWith(
            'mock-viewport',
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

        // @ts-expect-error: access private method
        service._observeResize(viewportId, element, mockViewport);

        // @ts-expect-error: accessing private property
        const observer = service.resizeObservers.get(viewportId);
        expect(observer).toBeDefined();
        expect(ResizeObserver).toHaveBeenCalled();
        expect(observer?.observe).toHaveBeenCalledWith(element);
    });

    it('should add observer to resizeObservers map', () => {
        const element = document.createElement('div');
        const viewportId = 'test-viewport';

        // @ts-expect-error: access private method
        service._observeResize(viewportId, element, mockViewport);

        // @ts-expect-error: access private method
        const observer = service.resizeObservers.get(viewportId);
        expect(observer).toBeDefined();
    });
});
