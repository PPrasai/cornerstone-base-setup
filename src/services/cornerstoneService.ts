import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { Enums, init, RenderingEngine, Types } from '@cornerstonejs/core';
import {
    init as toolsInit,
    addTool,
    ToolGroupManager,
} from '@cornerstonejs/tools';

import { ViewerConfig } from '../domain/viewer/interfaces';

export class CornerstoneService {
    private renderingEngine: RenderingEngine | null = null;
    private resizeObservers: Map<string, ResizeObserver> = new Map();

    constructor(renderingEngineId = 'unnamed-engine') {
        init();
        cornerstoneDICOMImageLoader.init();
        toolsInit();
        this.renderingEngine = new RenderingEngine(renderingEngineId);
    }

    public async setupViewer(
        config: ViewerConfig,
    ): Promise<Types.IStackViewport[]> {
        if (!this.renderingEngine) {
            throw new Error('Rendering engine is not initialized.');
        }

        const viewports: Types.IStackViewport[] = await Promise.all(
            config.viewportIds.map((viewportId, index) => {
                const element = config.elements[index];
                const viewerType = config.viewerTypes[index];
                return this._initViewport(
                    viewportId,
                    element,
                    viewerType,
                    config.defaultOptions,
                );
            }),
        );

        this._setupToolGroup(config, viewports);

        config.viewportIds.forEach((viewportId, index) => {
            this._observeResize(
                viewportId,
                config.elements[index],
                viewports[index],
            );
        });

        await Promise.all(
            config.viewportIds.map((viewportId) =>
                this.setViewportStack(
                    viewportId,
                    config.imageIds,
                    config.defaultImageIndex,
                ),
            ),
        );

        return viewports;
    }

    public async setViewportStack(
        viewportId: string,
        imageIds: string[],
        defaultImageIndex = 0,
    ): Promise<void> {
        const viewport = this.renderingEngine?.getViewport(
            viewportId,
        ) as Types.IStackViewport;

        if (!viewport) {
            throw new Error(`Viewport with ID ${viewportId} not found.`);
        }

        await viewport.setStack(imageIds, defaultImageIndex);
        viewport.render();
    }

    public destroy(viewportId: string): void {
        const observer = this.resizeObservers.get(viewportId);
        if (observer) {
            observer.disconnect();
            this.resizeObservers.delete(viewportId);
        }

        this.renderingEngine?.disableElement(viewportId);
    }

    private async _initViewport(
        viewportId: string,
        element: HTMLDivElement,
        viewerType: Enums.ViewportType,
        defaultOptions?: Types.ViewportInputOptions,
    ): Promise<Types.IStackViewport> {
        const viewportInput: Types.PublicViewportInput = {
            viewportId,
            element,
            type: viewerType,
            defaultOptions: defaultOptions || { background: [0.2, 0, 0.2] },
        };

        element.oncontextmenu = (e) => e.preventDefault();

        if (!this.renderingEngine!.getViewport(viewportId)) {
            this.renderingEngine!.enableElement(viewportInput);
        }

        return this.renderingEngine!.getViewport(
            viewportId,
        ) as Types.IStackViewport;
    }

    private _setupToolGroup(
        config: ViewerConfig,
        viewports: Types.IStackViewport[],
    ) {
        const toolGroupId = `${config.viewportIds.join('-')}-group`;
        let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

        if (!toolGroup) {
            toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
        }

        viewports.forEach((vp) => {
            toolGroup!.addViewport(vp.id, this.renderingEngine!.id);
        });

        config.tools?.forEach((toolConfig) => {
            addTool(toolConfig.tool);
            toolGroup!.addTool(toolConfig.toolName);
            if (toolConfig.active && toolConfig.bindings) {
                toolGroup!.setToolActive(toolConfig.toolName, {
                    bindings: toolConfig.bindings,
                });
            }
        });
    }

    private _observeResize(
        viewportId: string,
        element: HTMLDivElement,
        viewport: Types.IStackViewport,
    ) {
        let resizeTimeout: NodeJS.Timeout | null = null;

        const observer = new ResizeObserver(() => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            resizeTimeout = setTimeout(() => {
                this.renderingEngine?.resize(true, true);
                viewport.setViewReference(viewport.getViewReference());
                viewport.setViewPresentation(viewport.getViewPresentation());
                resizeTimeout = null;
            }, 50);
        });

        observer.observe(element);
        this.resizeObservers.set(viewportId, observer);
    }
}
