import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import {
    cornerstoneStreamingDynamicImageVolumeLoader,
    cornerstoneStreamingImageVolumeLoader,
    Enums,
    init as coreInit,
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
    private renderingEngine: RenderingEngine;
    private resizeObservers = new Map<string, ResizeObserver>();

    constructor(engineId = 'cornerstone-engine') {
        coreInit();
        cornerstoneDICOMImageLoader.init();
        this._registerVolumeLoaders();
        toolsInit();
        this.renderingEngine = new RenderingEngine(engineId);
    }

    public async setupViewer(
        config: ViewerConfig,
    ): Promise<Array<Types.IStackViewport | Types.IVolumeViewport>> {
        return config.viewerType === ViewerTypes.STACK
            ? this._setupStackViewer(config)
            : this._setupMPRViewer(config);
    }

    private async _setupStackViewer(
        config: ViewerConfig,
    ): Promise<Types.IStackViewport[]> {
        const viewport = (await this._initViewport(
            config.viewportIds[0],
            config.elements[0],
            config.viewerTypes[0],
            config.defaultOptions?.[config.viewportIds[0]],
        )) as Types.IStackViewport;

        await viewport.setStack(config.imageIds, config.defaultImageIndex ?? 0);
        viewport.render();

        this._applyTools(config.viewportIds, [viewport], config.tools);
        this._observeResize(
            config.viewportIds[0],
            config.elements[0],
            viewport,
        );

        return [viewport];
    }

    private async _setupMPRViewer(
        config: ViewerConfig,
    ): Promise<Types.IVolumeViewport[]> {
        const viewports = (await Promise.all(
            config.viewportIds.map(
                (id, idx) =>
                    this._initViewport(
                        id,
                        config.elements[idx],
                        config.viewerTypes[idx],
                        config.defaultOptions?.[id],
                    ) as Promise<Types.IVolumeViewport>,
            ),
        )) as Types.IVolumeViewport[];

        const volumeName = 'CT_VOLUME_ID';
        const loaderScheme = 'cornerstoneStreamingImageVolume';
        const volumeId = `${loaderScheme}:${volumeName}`;
        const volume = await volumeLoader.createAndCacheVolume(volumeId, {
            imageIds: config.imageIds,
            progressiveRendering: false,
        });

        this.renderingEngine.setViewports(
            viewports.map((vp) => ({
                viewportId: vp.id,
                element: vp.element,
                type: vp.type,
                defaultOptions: {},
            })),
        );
        volume.load();
        await setVolumesForViewports(
            this.renderingEngine,
            [{ volumeId }],
            config.viewportIds,
        );
        this.renderingEngine.renderViewports(config.viewportIds);

        await Promise.all(
            viewports.map((vp, idx) => {
                const orientation = [
                    Enums.OrientationAxis.AXIAL,
                    Enums.OrientationAxis.SAGITTAL,
                    Enums.OrientationAxis.CORONAL,
                ][idx];
                vp.setOrientation(orientation);
                vp.render();
            }),
        );

        this._applyTools(config.viewportIds, viewports, config.tools);
        config.viewportIds.forEach((id, idx) => {
            this._observeResize(id, config.elements[idx], viewports[idx]);
        });

        return viewports;
    }

    private async _initViewport(
        viewportId: string,
        element: HTMLDivElement,
        type: Enums.ViewportType,
        defaultOptions?: Types.ViewportInputOptions,
    ): Promise<Types.IViewport> {
        const input: Types.PublicViewportInput = {
            viewportId,
            element,
            type,
            defaultOptions: defaultOptions ?? { background: [0.2, 0, 0.2] },
        };
        element.oncontextmenu = (e) => e.preventDefault();
        if (!this.renderingEngine.getViewport(viewportId)) {
            this.renderingEngine.enableElement(input);
        }
        return this.renderingEngine.getViewport(viewportId)!;
    }

    private _registerVolumeLoaders() {
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

    private _applyTools(
        viewportIds: string[],
        viewports: Array<Types.IViewport>,
        toolsConfig?: ViewerConfig['tools'],
    ): void {
        const groupId = viewportIds.join('-') + '-tools';
        const toolGroup =
            ToolGroupManager.getToolGroup(groupId) ??
            ToolGroupManager.createToolGroup(groupId);
        viewports.forEach((vp) =>
            toolGroup!.addViewport(vp.id, this.renderingEngine.id),
        );
        toolsConfig?.forEach((cfg) => {
            addTool(cfg.tool);
            toolGroup!.addTool(cfg.toolName);
            if (cfg.active && cfg.bindings) {
                toolGroup!.setToolActive(cfg.toolName, {
                    bindings: cfg.bindings,
                });
            }
        });
    }

    private _observeResize(
        viewportId: string,
        element: HTMLDivElement,
        viewport: Types.IViewport,
    ) {
        let timeout: number | null = null;
        const observer = new ResizeObserver(() => {
            if (timeout) window.clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                this.renderingEngine.resize(true, true);
                viewport.setViewReference(viewport.getViewReference());
                viewport.setViewPresentation(viewport.getViewPresentation());
            }, 50);
        });
        observer.observe(element);
        this.resizeObservers.set(viewportId, observer);
    }

    public cleanup(viewportIds: string[]): void {
        viewportIds.forEach((id) => {
            const observer = this.resizeObservers.get(id);
            if (observer) {
                observer.disconnect();
                this.resizeObservers.delete(id);
            }
            this.renderingEngine.disableElement(id);
        });
        const toolGroupId = viewportIds.join('-') + '-tools';
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) {
            ToolGroupManager.destroyToolGroup(toolGroupId);
        }
        this.renderingEngine.destroy();
    }
}
