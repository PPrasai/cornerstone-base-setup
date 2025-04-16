import React, { useEffect, useState } from 'react';

import { DicomQueryParams, fetchImageIds } from '../services/dicomService';
import { createMPRViewerConfig } from '../services/viewerConfigService';
import { CornerstoneService } from '../services/cornerstoneService';
import InfoCard from '../components/InfoCard';
import { ViewerConfig } from '../domain/viewer/interfaces';

const dicomParams: DicomQueryParams = {
    StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
};

const AXIAL_VIEWPORT_ID = 'axial-viewport';
const CORONAL_VIEWPORT_ID = 'coronal-viewport';
const SAGITTAL_VIEWPORT_ID = 'sagittal-viewport';

function MPRViewerPage(): React.JSX.Element {
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
            cornerstoneService?.destroy(AXIAL_VIEWPORT_ID);
            cornerstoneService?.destroy(CORONAL_VIEWPORT_ID);
            cornerstoneService?.destroy(SAGITTAL_VIEWPORT_ID);
        };
    }, []);

    useEffect(() => {
        if (!cornerstoneService || imageIds.length === 0) return;

        const axialElement = document.getElementById(
            AXIAL_VIEWPORT_ID,
        ) as HTMLDivElement;

        const coronalElement = document.getElementById(
            CORONAL_VIEWPORT_ID,
        ) as HTMLDivElement;

        const sagittalElement = document.getElementById(
            SAGITTAL_VIEWPORT_ID,
        ) as HTMLDivElement;

        if (!axialElement || !coronalElement || !sagittalElement) return;

        const viewerConfig: ViewerConfig = createMPRViewerConfig({
            viewportIds: [
                AXIAL_VIEWPORT_ID,
                CORONAL_VIEWPORT_ID,
                SAGITTAL_VIEWPORT_ID,
            ],
            elements: [axialElement, coronalElement, sagittalElement],
            imageIds,
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
            <div className="flex items-center justify-center mt-4">
                {cornerstoneService ? (
                    <div className="flex items-center justify-center px-4">
                        <div
                            id={AXIAL_VIEWPORT_ID}
                            data-testid={AXIAL_VIEWPORT_ID}
                            className="h-[70vh] w-[32vw] rounded-2xl bg-white shadow-lg"
                        ></div>
                        <div
                            id={CORONAL_VIEWPORT_ID}
                            data-testid={CORONAL_VIEWPORT_ID}
                            className="h-[70vh] w-[32vw] rounded-2xl bg-white shadow-lg"
                        ></div>
                        <div
                            id={SAGITTAL_VIEWPORT_ID}
                            data-testid={SAGITTAL_VIEWPORT_ID}
                            className="h-[70vh] w-[32vw] rounded-2xl bg-white shadow-lg"
                        ></div>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

export default MPRViewerPage;
