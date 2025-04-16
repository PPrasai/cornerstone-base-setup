import { Enums } from '@cornerstonejs/core';
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

const { ViewportType } = Enums;
const { MouseBindings } = ToolEnums;

export function createStackViewerConfig(
    config: StackViewerConfig,
): ViewerConfig {
    const background = config.options?.background || [0.2, 0, 0.2];

    const tools: ToolConfiguration[] = [
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

    return {
        viewerType: ViewerTypes.STACK,
        viewportIds: [config.viewportId],
        elements: [config.element],
        defaultImageIndex: config.defaultImageIndex,
        viewerTypes: [ViewportType.STACK],
        imageIds: config.imageIds,
        defaultOptions: { [config.viewportId]: { background } },
        tools,
    };
}

export function createMPRViewerConfig(config: MPRViewerConfig): ViewerConfig {
    const background = config.options?.background || [0.2, 0, 0.2];

    const tools: ToolConfiguration[] = [
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

    return {
        viewerType: ViewerTypes.MPR,
        viewportIds: config.viewportIds,
        elements: config.elements,
        defaultImageIndex: 0,
        viewerTypes: [
            ViewportType.ORTHOGRAPHIC,
            ViewportType.ORTHOGRAPHIC,
            ViewportType.ORTHOGRAPHIC,
        ],
        imageIds: config.imageIds,
        defaultOptions: {
            [config.viewportIds[0]]: {
                background,
                orientation: Enums.OrientationAxis.AXIAL,
            },
            [config.viewportIds[1]]: {
                background,
                orientation: Enums.OrientationAxis.CORONAL,
            },
            [config.viewportIds[2]]: {
                background,
                orientation: Enums.OrientationAxis.SAGITTAL,
            },
        },
        tools,
    };
}
