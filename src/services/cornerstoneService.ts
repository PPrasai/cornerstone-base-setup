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
        this.registerVolumeLoaders();
        toolsInit();
        this.renderingEngine = new RenderingEngine(engineId);
    }

    public async setupViewer(
        config: ViewerConfig,
    ): Promise<Array<Types.IStackViewport | Types.IVolumeViewport>> {
        return config.viewerType === ViewerTypes.STACK
            ? this.setupStackViewer(config)
            : this.setupMPRViewer(config);
    }

    private async setupStackViewer(
        config: ViewerConfig,
    ): Promise<Types.IStackViewport[]> {
        const viewport = (await this.initViewport(
            config.viewportIds[0],
            config.elements[0],
            config.viewerTypes[0],
            config.defaultOptions?.[config.viewportIds[0]],
        )) as Types.IStackViewport;

        await viewport.setStack(config.imageIds, config.defaultImageIndex ?? 0);
        viewport.render();

        this.applyTools(config.viewportIds, [viewport], config.tools);
        this.observeResize(config.viewportIds[0], config.elements[0], viewport);

        return [viewport];
    }

    private async setupMPRViewer(
        config: ViewerConfig,
    ): Promise<Types.IVolumeViewport[]> {
        const viewports = (await Promise.all(
            config.viewportIds.map(
                (id, idx) =>
                    this.initViewport(
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

        this.applyTools(config.viewportIds, viewports, config.tools);
        config.viewportIds.forEach((id, idx) => {
            this.observeResize(id, config.elements[idx], viewports[idx]);
        });

        return viewports;
    }

    private async initViewport(
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

    private registerVolumeLoaders() {
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

    private applyTools(
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

    private observeResize(
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
}
