import React, { useEffect, useState } from 'react';

import { DicomQueryParams, fetchImageIds } from '../services/dicomService';
import { createStackViewerConfig } from '../services/viewerConfigService';
import {
    CornerstoneService,
    ViewerConfig,
} from '../services/cornerstoneService';

const dicomParams: DicomQueryParams = {
    StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
};

const STACK_VIEWPORT_ID = 'stack-viewport';

function StackViewerPage(): React.JSX.Element {
    const [cornerstoneService, setCornerstoneService] =
        useState<CornerstoneService | null>(null);
    const [imageIds, setImageIds] = useState<string[]>([]);

    useEffect(() => {
        async function initialize() {
            const ids = await fetchImageIds(dicomParams);
            const service = new CornerstoneService();
            setImageIds(ids);
            setCornerstoneService(service);
        }
        initialize();

        return () => {
            cornerstoneService?.destroy(STACK_VIEWPORT_ID);
        };
    }, []);

    useEffect(() => {
        if (!cornerstoneService || imageIds.length === 0) return;

        const element = document.getElementById(
            STACK_VIEWPORT_ID,
        ) as HTMLDivElement;
        if (!element) return;

        const viewerConfig: ViewerConfig = createStackViewerConfig({
            viewportId: STACK_VIEWPORT_ID,
            element,
            imageIds,
            defaultImageIndex: 10,
            options: { background: [0.1, 0.1, 0.3] },
        });

        cornerstoneService.setupViewer(viewerConfig);
    }, [cornerstoneService, imageIds]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            {cornerstoneService ? (
                <div id={STACK_VIEWPORT_ID} className="h-[80vh] w-[80vw]"></div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default StackViewerPage;
