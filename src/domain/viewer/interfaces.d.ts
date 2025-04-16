import { Types as CoreTypes, Enums } from '@cornerstonejs/core';
import { Types as ToolTypes } from '@cornerstonejs/tools';

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
    defaultOptions?: CoreTypes.ViewportInputOptions;
    tools?: ToolConfiguration[];
}

export interface StackViewerConfig {
    viewportId: string;
    element: HTMLDivElement;
    imageIds: string[];
    defaultImageIndex?: number;
    options?: {
        background?: CoreTypes.Point3;
    };
}
