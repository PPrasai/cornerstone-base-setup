import { Enums, Types } from '@cornerstonejs/core';
import {
    StackScrollTool,
    LengthTool,
    Enums as ToolEnums,
    PanTool,
    ZoomTool,
} from '@cornerstonejs/tools';

import {
    MPRViewerConfig,
    StackViewerConfig,
    ToolConfiguration,
    ViewerConfig,
    ViewerTypes,
} from '../domain/viewer/interfaces.d';

const { ViewportType, OrientationAxis } = Enums;
const { MouseBindings } = ToolEnums;

class ViewerConfigFactory {
    private background: Types.Point3;

    constructor(options?: { background?: [number, number, number] }) {
        this.background = options?.background || [0.2, 0, 0.2];
    }

    private createDefaultTools(): ToolConfiguration[] {
        return [
            {
                tool: StackScrollTool,
                toolName: StackScrollTool.toolName,
                active: true,
                bindings: [{ mouseButton: MouseBindings.Wheel }],
            },
            {
                tool: LengthTool,
                toolName: LengthTool.toolName,
                active: true,
                bindings: [{ mouseButton: MouseBindings.Primary }],
            },
            {
                tool: PanTool,
                toolName: PanTool.toolName,
                active: true,
                bindings: [{ mouseButton: MouseBindings.Secondary }],
            },
            {
                tool: ZoomTool,
                toolName: ZoomTool.toolName,
                active: true,
                bindings: [{ mouseButton: MouseBindings.Auxiliary }],
            },
        ];
    }

    createStackViewerConfig(config: StackViewerConfig): ViewerConfig {
        return {
            viewerType: ViewerTypes.STACK,
            viewportIds: [config.viewportId],
            elements: [config.element],
            defaultImageIndex: config.defaultImageIndex,
            viewerTypes: [Enums.ViewportType.STACK],
            imageIds: config.imageIds,
            defaultOptions: {
                [config.viewportId]: { background: this.background },
            },
            tools: this.createDefaultTools(),
        };
    }

    createMPRViewerConfig(config: MPRViewerConfig): ViewerConfig {
        const orientations = [
            OrientationAxis.AXIAL,
            OrientationAxis.CORONAL,
            OrientationAxis.SAGITTAL,
        ];

        const defaultOptions = config.viewportIds.reduce(
            (opts, viewportId, index) => {
                opts[viewportId] = {
                    background: this.background,
                    orientation: orientations[index],
                };
                return opts;
            },
            {} as Record<string, Types.ViewportInputOptions>,
        );

        return {
            viewerType: ViewerTypes.MPR,
            viewportIds: config.viewportIds,
            elements: config.elements,
            defaultImageIndex: 0,
            viewerTypes: new Array(config.viewportIds.length).fill(
                ViewportType.ORTHOGRAPHIC,
            ),
            imageIds: config.imageIds,
            defaultOptions,
            tools: this.createDefaultTools(),
        };
    }
}

export default ViewerConfigFactory;
