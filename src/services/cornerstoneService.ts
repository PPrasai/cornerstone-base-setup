import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import {
    cornerstoneStreamingDynamicImageVolumeLoader,
    cornerstoneStreamingImageVolumeLoader,
    Enums,
    init,
    RenderingEngine,
    setVolumesForViewports,
    Types,
    volumeLoader,
} from '@cornerstonejs/core';
import {
    init as toolsInit,
    addTool,
    ToolGroupManager,
} from '@cornerstonejs/tools';

import { ViewerConfig, ViewerTypes } from '../domain/viewer/interfaces.d';

export class CornerstoneService {
    private renderingEngine: RenderingEngine | null = null;
    private resizeObservers: Map<string, ResizeObserver> = new Map();

    constructor(renderingEngineId = 'unnamed-engine') {
        this._initVolumeLoader();
        init();
        cornerstoneDICOMImageLoader.init();
        toolsInit();
        this.renderingEngine = new RenderingEngine(renderingEngineId);
    }

    public async setupViewer(
        config: ViewerConfig,
    ): Promise<Array<Types.IStackViewport | Types.IVolumeViewport>> {
        if (!this.renderingEngine) {
            throw new Error('Rendering engine is not initialized.');
        }

        const viewports: Array<Types.IStackViewport | Types.IVolumeViewport> =
            await Promise.all(
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

        if (config.viewerType === ViewerTypes.STACK)
            await Promise.all(
                config.viewportIds.map((viewportId) =>
                    this.setViewportStack(
                        viewportId,
                        config.imageIds,
                        config.defaultImageIndex,
                    ),
                ),
            );

        if (config.viewerType === ViewerTypes.MPR)
            await Promise.all(
                config.viewportIds.map(() => this.setMPRViewports(config)),
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
        // eslint-disable-next-line no-debugger
        debugger;
        await viewport.setStack(imageIds, defaultImageIndex);
        viewport.render();
    }

    public async setMPRViewports(config: ViewerConfig) {
        if (!this.renderingEngine)
            throw new Error('Rendering engine is not initialized.');

        const volumeName = 'CT_VOLUME_ID';
        const volumeLoaderScheme = 'cornerstoneStreamingImageVolume';
        const volumeId = `${volumeLoaderScheme}:${volumeName}`;

        const volume = await volumeLoader.createAndCacheVolume(volumeId, {
            imageIds: config.imageIds,
            progressiveRendering: false,
        });

        const viewportInputs = [
            {
                viewportId: config.viewportIds[0],
                type: config.viewerTypes[0],
                element: config.elements[0],
                defaultOptions: config.defaultOptions
                    ? config.defaultOptions[config.viewportIds[0]]
                    : {},
            },
            {
                viewportId: config.viewportIds[1],
                type: config.viewerTypes[1],
                element: config.elements[1],
                defaultOptions: config.defaultOptions
                    ? config.defaultOptions[config.viewportIds[1]]
                    : {},
            },
            {
                viewportId: config.viewportIds[2],
                type: config.viewerTypes[2],
                element: config.elements[2],
                defaultOptions: config.defaultOptions
                    ? config.defaultOptions[config.viewportIds[2]]
                    : {},
            },
        ];

        this.renderingEngine.setViewports(viewportInputs);
        volume.load();

        const windowWidth = 400;
        const windowCenter = 40;

        const lower = windowCenter - windowWidth / 2.0;
        const upper = windowCenter + windowWidth / 2.0;

        function setCtTransferFunctionForVolumeActor({
            volumeActor,
        }: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volumeActor: any;
        }) {
            volumeActor
                .getProperty()
                .getRGBTransferFunction(0)
                .setMappingRange(lower, upper);
        }

        await setVolumesForViewports(
            this.renderingEngine,
            [
                {
                    volumeId,
                    callback: setCtTransferFunctionForVolumeActor,
                },
            ],
            config.viewportIds,
        );

        this.renderingEngine.renderViewports(config.viewportIds);
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
        viewports: Array<Types.IStackViewport | Types.IVolumeViewport>,
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
        viewport: Types.IStackViewport | Types.IVolumeViewport,
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

    private _initVolumeLoader() {
        volumeLoader.registerUnknownVolumeLoader(
            cornerstoneStreamingImageVolumeLoader as unknown as Types.VolumeLoaderFn,
        );
        volumeLoader.registerVolumeLoader(
            'cornerstoneStreamingImageVolume',
            cornerstoneStreamingImageVolumeLoader as unknown as Types.VolumeLoaderFn,
        );
        volumeLoader.registerVolumeLoader(
            'cornerstoneStreamingDynamicImageVolume',
            cornerstoneStreamingDynamicImageVolumeLoader as unknown as Types.VolumeLoaderFn,
        );
    }
}
