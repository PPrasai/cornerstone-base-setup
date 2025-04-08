import { Enums, Types } from '@cornerstonejs/core';
import {
    StackScrollTool,
    LengthTool,
    Enums as ToolEnums,
} from '@cornerstonejs/tools';
import { ToolConfiguration, ViewerConfig } from './cornerstoneService';

const { ViewportType } = Enums;
const { MouseBindings } = ToolEnums;

export function createStackViewerConfig(
    viewportId: string,
    element: HTMLDivElement,
    imageIds: string[],
    options?: {
        background?: Types.Point3;
    },
): ViewerConfig {
    const background = options?.background || [0.2, 0, 0.2];

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
    ];

    return {
        viewportId,
        element,
        viewerType: ViewportType.STACK,
        imageIds,
        defaultOptions: { background },
        tools,
    };
}
