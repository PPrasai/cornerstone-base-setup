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
    const [cornerstoneService, setCornerstoneService] =
        useState<CornerstoneService | null>(null);
    const [imageIds, setImageIds] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        async function initialize() {
            const ids = await fetchImageIds(dicomParams);
            const service = new CornerstoneService();
            setImageIds(ids);
            setCornerstoneService(service);
            setInitialized(true);
        }
        initialize();

        return () => {
            cornerstoneService?.destroy();
        };
    }, []);

    useEffect(() => {
        if (!initialized || !cornerstoneService || imageIds.length === 0)
            return;

        const element = document.getElementById(
            'stack-viewport',
        ) as HTMLDivElement;
        if (!element) return;

        const viewerConfig: ViewerConfig = createStackViewerConfig({
            viewportId: 'stack-viewport',
            element,
            imageIds,
            defaultImageIndex: 10,
            options: { background: [0.1, 0.1, 0.3] },
        });

        cornerstoneService.setupViewer(viewerConfig);
    }, [initialized, cornerstoneService, imageIds]);

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
