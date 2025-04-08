// App.tsx
import React, { useEffect, useState } from 'react';
import './App.css';
import { Enums } from '@cornerstonejs/core';
import { StackScrollTool, Enums as ToolEnums } from '@cornerstonejs/tools';
import { LengthTool } from '@cornerstonejs/tools';
import { DicomQueryParams, fetchImageIds } from './services/dicomService';
import {
    CornerstoneService,
    ToolConfiguration,
    ViewerConfig,
} from './services/cornerstoneService';

const { ViewportType } = Enums;
const { MouseBindings } = ToolEnums;

const dicomParams: DicomQueryParams = {
    StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
};

function App(): React.JSX.Element {
    const [manager, setManager] = useState<CornerstoneService | null>(null);
    const [imageIds, setImageIds] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        async function initialize() {
            const ids = await fetchImageIds(dicomParams);
            const cornerstoneService = new CornerstoneService();
            cornerstoneService.createRenderingEngine();
            setImageIds(ids);
            setManager(cornerstoneService);
            setInitialized(true);
        }
        initialize();
    }, []);

    useEffect(() => {
        if (!initialized || !manager || imageIds.length === 0) return;

        const element = document.getElementById(
            'stack-viewport',
        ) as HTMLDivElement;
        if (!element) return;

        const viewerConfig: ViewerConfig = {
            viewportId: 'stack-viewport',
            element,
            viewerType: ViewportType.STACK,
            imageIds,
            defaultOptions: { background: [0.1, 0.1, 0.3] },
            tools: [
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
            ] as ToolConfiguration[],
        };

        manager.setupViewer(viewerConfig);
    }, [initialized, manager, imageIds]);

    return (
        <>
            {initialized ? (
                <div id="stack-viewport" className="h-[800px] w-[800px]"></div>
            ) : (
                <p>Loading...</p>
            )}
        </>
    );
}

export default App;
