import { describe, it, expect, vi } from 'vitest';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { DicomQueryParams, fetchImageIds } from '../../services/dicomService';

const mockStudyUid = 'study-uid';
const mockSeriesUid = 'series-uid';
const mockInstanceUid = 'instance-uid';

const mockInstanceMetadata = {
    '0020000E': { Value: [mockSeriesUid] },
    '00080018': { Value: [mockInstanceUid] },
};

vi.mock('dicomweb-client', () => {
    return {
        api: {
            DICOMwebClient: vi.fn().mockImplementation(() => ({
                retrieveSeriesMetadata: vi
                    .fn()
                    .mockResolvedValue([mockInstanceMetadata]),
            })),
        },
    };
});

const metaDataAddSpy = vi
    .spyOn(cornerstoneDICOMImageLoader.wadors.metaDataManager, 'add')
    .mockImplementation(() => {});

describe('fetchImageIds', () => {
    const dicomParams: DicomQueryParams = {
        StudyInstanceUID: mockStudyUid,
        SeriesInstanceUID: mockSeriesUid,
        wadoRsRoot: 'http://example.com/wado',
    };

    it('should return image ids in the correct format', async () => {
        const imageIds = await fetchImageIds(dicomParams);
        expect(imageIds).toHaveLength(1);

        const expectedPrefix = 'wadors:http://example.com/wado';
        expect(imageIds[0]).toContain(expectedPrefix);
        expect(imageIds[0]).toContain(
            `/studies/${dicomParams.StudyInstanceUID}`,
        );
        expect(imageIds[0]).toContain(`/series/${mockSeriesUid}`);
        expect(imageIds[0]).toContain(`/instances/${mockInstanceUid}/frames/1`);

        expect(metaDataAddSpy).toHaveBeenCalledWith(
            imageIds[0],
            mockInstanceMetadata,
        );
    });

    it('should use provided SOPInstanceUID if available', async () => {
        const customParams = {
            ...dicomParams,
            SOPInstanceUID: mockInstanceUid,
        };
        const imageIds = await fetchImageIds(customParams);

        expect(imageIds[0]).toContain(`/instances/${mockInstanceUid}/frames/1`);
    });
});
