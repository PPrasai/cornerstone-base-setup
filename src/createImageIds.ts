/* eslint-disable @typescript-eslint/no-explicit-any */
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { WADORSMetaData } from '@cornerstonejs/dicom-image-loader/types';
import { api } from 'dicomweb-client';

type ArgSignature = {
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    SOPInstanceUID?: string | null;
    wadoRsRoot: string;
};

async function createImageIds({
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID = null,
    wadoRsRoot,
}: ArgSignature) {
    const SOP_INSTANCE_UID = '00080018';
    const SERIES_INSTANCE_UID = '0020000E';

    const studySearchOptions = {
        studyInstanceUID: StudyInstanceUID,
        seriesInstanceUID: SeriesInstanceUID,
    };

    const client = new api.DICOMwebClient({
        url: wadoRsRoot,
        singlepart: false,
    });
    const instances = await client.retrieveSeriesMetadata(studySearchOptions);

    const imageIds = instances.map((instanceMetaData: any) => {
        const SeriesInstanceUID = instanceMetaData[SERIES_INSTANCE_UID]!
            .Value![0] as string;
        const SOPInstanceUIDToUse =
            SOPInstanceUID ||
            (instanceMetaData[SOP_INSTANCE_UID]!.Value![0] as string);

        const prefix = 'wadors:';

        let imageId = prefix + wadoRsRoot;
        imageId += '/studies/' + StudyInstanceUID.trim();
        imageId += '/series/' + SeriesInstanceUID.trim();
        imageId += '/instances/' + SOPInstanceUIDToUse.trim();
        imageId += '/frames/1';

        cornerstoneDICOMImageLoader.wadors.metaDataManager.add(
            imageId,
            instanceMetaData as WADORSMetaData,
        );
        return imageId;
    });

    return imageIds;
}

export default createImageIds;
