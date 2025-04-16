import { Types as CoreTypes, Enums } from '@cornerstonejs/core';
import { Types as ToolTypes } from '@cornerstonejs/tools';

export interface ToolConfiguration {
    tool: unknown;
    toolName: string;
    active?: boolean;
    bindings?: ToolTypes.IToolBinding[];
}

export interface ViewerConfig {
    viewportIds: string[];
    elements: HTMLDivElement[];
    viewerTypes: Enums.ViewportType[];
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

export interface MPRViewerConfig {
    viewportIds: string[];
    elements: HTMLDivElement[];
    imageIds: string[];
    options?: {
        background?: CoreTypes.Point3;
    };
}
