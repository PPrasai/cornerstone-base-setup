import React, { useEffect, useState } from 'react';

import { DicomQueryParams, fetchImageIds } from '../services/dicomService';
import { createStackViewerConfig } from '../services/viewerConfigService';
import {
    CornerstoneService,
    ViewerConfig,
} from '../services/cornerstoneService';
import InfoCard from '../components/InfoCard';

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
            options: { background: [1, 1, 1] },
        });

        cornerstoneService.setupViewer(viewerConfig);
    }, [cornerstoneService, imageIds]);

    return (
        <div className="w-full">
            <InfoCard
                title="Stack Viewer"
                description="This is a stack viewer that displays a series of images in a stack format."
            />
            <div className="flex flex-col items-center justify-center mt-4">
                {cornerstoneService ? (
                    <div
                        id={STACK_VIEWPORT_ID}
                        data-testid={STACK_VIEWPORT_ID}
                        className="h-[70vh] w-[70vh] rounded-2xl bg-white shadow-lg"
                    ></div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

export default StackViewerPage;
