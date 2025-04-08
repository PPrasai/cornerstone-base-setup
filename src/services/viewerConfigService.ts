import { Enums, Types } from '@cornerstonejs/core';
import {
    StackScrollTool,
    LengthTool,
    Enums as ToolEnums,
    PanTool,
    ZoomTool,
} from '@cornerstonejs/tools';
import { ToolConfiguration, ViewerConfig } from './cornerstoneService';

const { ViewportType } = Enums;
const { MouseBindings } = ToolEnums;

interface StackViewerConfig {
    viewportId: string;
    element: HTMLDivElement;
    imageIds: string[];
    defaultImageIndex?: number;
    options?: {
        background?: Types.Point3;
    };
}

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
        viewportId: config.viewportId,
        element: config.element,
        defaultImageIndex: config.defaultImageIndex,
        viewerType: ViewportType.STACK,
        imageIds: config.imageIds,
        defaultOptions: { background },
        tools,
    };
}
