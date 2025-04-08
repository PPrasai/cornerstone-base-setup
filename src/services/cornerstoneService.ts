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
    defaultOptions?: Types.ViewportInputOptions;
    tools?: ToolConfiguration[];
}

export class CornerstoneService {
    renderingEngine: RenderingEngine | null = null;

    constructor() {
        init();
        cornerstoneDICOMImageLoader.init();
        toolsInit();
    }

    public createRenderingEngine(engineId = 'demo-engine'): RenderingEngine {
        this.renderingEngine = new RenderingEngine(engineId);
        return this.renderingEngine;
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

        this.renderingEngine.enableElement(viewportInput);

        const viewport = this.renderingEngine.getViewport(
            config.viewportId,
        ) as Types.IStackViewport;

        const toolGroup = ToolGroupManager.createToolGroup(
            `${config.viewportId}-group`,
        );
        toolGroup?.addViewport(viewport.id, this.renderingEngine.id);

        if (config.tools && config.tools.length > 0) {
            config.tools.forEach((toolConfig) => {
                addTool(toolConfig.tool);
                toolGroup?.addTool(toolConfig.toolName);
                if (toolConfig.active && toolConfig.bindings) {
                    toolGroup?.setToolActive(toolConfig.toolName, {
                        bindings: toolConfig.bindings,
                    });
                }
            });
        }

        await viewport.setStack(config.imageIds, 10);
        viewport.render();

        return viewport;
    }
}
