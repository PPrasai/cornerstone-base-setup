import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { WADORSMetaData } from '@cornerstonejs/dicom-image-loader/types';
import { api } from 'dicomweb-client';
import { InstanceMetadata } from 'dicomweb-client/types/api';

export type DicomQueryParams = {
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    SOPInstanceUID?: string | null;
    wadoRsRoot: string;
};

const SOP_INSTANCE_UID = '00080018';
const SERIES_INSTANCE_UID = '0020000E';

export async function fetchImageIds({
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID = null,
    wadoRsRoot,
}: DicomQueryParams): Promise<string[]> {
    const studySearchOptions = {
        studyInstanceUID: StudyInstanceUID,
        seriesInstanceUID: SeriesInstanceUID,
    };

    const client = new api.DICOMwebClient({
        url: wadoRsRoot,
        singlepart: false,
    });

    const instances = await client.retrieveSeriesMetadata(studySearchOptions);

    const prefix = 'wadors:';
    const imageIds = instances.map((instanceMetaData: InstanceMetadata) => {
        const seriesUID = instanceMetaData[SERIES_INSTANCE_UID]!
            .Value![0] as string;
        const sopUIDToUse =
            SOPInstanceUID ||
            (instanceMetaData[SOP_INSTANCE_UID]!.Value![0] as string);

        let imageId = `${prefix}${wadoRsRoot}`;
        imageId += `/studies/${StudyInstanceUID.trim()}`;
        imageId += `/series/${seriesUID.trim()}`;
        imageId += `/instances/${sopUIDToUse.trim()}`;
        imageId += '/frames/1';

        cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
            imageId,
            instanceMetaData as WADORSMetaData,
        );

        return imageId;
    });

    return imageIds;
}
