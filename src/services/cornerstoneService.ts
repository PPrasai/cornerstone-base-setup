import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { init, RenderingEngine, Enums, Types } from '@cornerstonejs/core';
import {
    init as toolsInit,
    addTool,
    ToolGroupManager,
    Types as ToolTypes,
} from '@cornerstonejs/tools';

export interface ToolConfiguration {
    tool: unknown;
    toolName: string;
    active?: boolean;
    bindings?: ToolTypes.IToolBinding[];
}

export interface ViewerConfig {
    viewportId: string;
    element: HTMLDivElement;
    viewerType: Enums.ViewportType;
    imageIds: string[];
    defaultImageIndex?: number;
    defaultOptions?: Types.ViewportInputOptions;
    tools?: ToolConfiguration[];
}

export class CornerstoneService {
    renderingEngine: RenderingEngine | null = null;
    private resizeObservers: Map<string, ResizeObserver> = new Map();

    constructor(renderingEngineId = 'unnamed-engine') {
        init();
        cornerstoneDICOMImageLoader.init();
        toolsInit();

        this.renderingEngine = new RenderingEngine(renderingEngineId);
    }

    public async setupViewer(
        config: ViewerConfig,
    ): Promise<Types.IStackViewport> {
        if (!this.renderingEngine) {
            throw new Error('Rendering engine is not initialized.');
        }

        const viewportInput = {
            viewportId: config.viewportId,
            element: config.element,
            type: config.viewerType,
            defaultOptions: config.defaultOptions || {
                background: [0.2, 0, 0.2] as Types.Point3,
            },
        };

        config.element.oncontextmenu = (e) => e.preventDefault();

        if (!this.renderingEngine.getViewport(viewportInput.viewportId)) {
            this.renderingEngine.enableElement(viewportInput);
        }

        const viewport = this.renderingEngine.getViewport(
            config.viewportId,
        ) as Types.IStackViewport;

        const toolGroupId = `${config.viewportId}-group`;
        let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
            toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        }

        toolGroup!.addViewport(viewport.id, this.renderingEngine.id);

        if (config.tools && config.tools.length > 0) {
            config.tools.forEach((toolConfig) => {
                addTool(toolConfig.tool);
                toolGroup!.addTool(toolConfig.toolName);
                if (toolConfig.active && toolConfig.bindings) {
                    toolGroup!.setToolActive(toolConfig.toolName, {
                        bindings: toolConfig.bindings,
                    });
                }
            });
        }

        let resizeTimeout: NodeJS.Timeout | null = null;

        const resizeObserver = new ResizeObserver(() => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            resizeTimeout = setTimeout(() => {
                if (!this.renderingEngine || !viewport) return;

                this.renderingEngine.resize(true, true);
                viewport.setViewReference(viewport.getViewReference());
                viewport.setViewPresentation(viewport.getViewPresentation());

                resizeTimeout = null;
            }, 50);
        });

        resizeObserver.observe(config.element);
        this.resizeObservers.set(config.viewportId, resizeObserver);

        await viewport.setStack(config.imageIds, config.defaultImageIndex || 0);
        viewport.render();

        return viewport;
    }

    public destroy(viewportId: string): void {
        if (!this.renderingEngine) return;

        const observer = this.resizeObservers.get(viewportId);
        if (observer) {
            observer.disconnect();
            this.resizeObservers.delete(viewportId);
        }

        this.renderingEngine.disableElement(viewportId);
    }
}
