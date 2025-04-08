// App.tsx
import React, { useEffect, useState } from 'react';
import './App.css';
import { DicomQueryParams, fetchImageIds } from './services/dicomService';
import {
    CornerstoneService,
    ViewerConfig,
} from './services/cornerstoneService';
import { createStackViewerConfig } from './services/viewerConfigService';

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

        const viewerConfig: ViewerConfig = createStackViewerConfig(
            'stack-viewport',
            element,
            imageIds,
            { background: [0.1, 0.1, 0.3] },
        );

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
