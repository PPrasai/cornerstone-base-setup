import React, { useEffect, useState } from 'react';
import './App.css';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { init, RenderingEngine, Enums, Types } from '@cornerstonejs/core';
import createImageIds from './createImageIds';
import {
    Enums as ToolEnums,
    addTool,
    StackScrollTool,
    ToolGroupManager,
    LengthTool,
    init as toolsInit,
} from '@cornerstonejs/tools';

const { ViewportType } = Enums;
const { MouseBindings } = ToolEnums;

function App(): React.JSX.Element {
    const [renderingEngine, setRenderingEngine] = useState<RenderingEngine>();
    const [cornerstoneInitialized, setCornerstoneInitialized] = useState(false);
    const [imageIds, setImageIds] = useState<string[]>([]);

    const render = async (
        imageIds: string[],
        viewport: Types.IStackViewport,
    ) => {
        await viewport.setStack(imageIds, 10);
        viewport.render();
    };

    useEffect(() => {
        if (cornerstoneInitialized) return;

        cornerstoneDICOMImageLoader.init();
        init();
        toolsInit();

        createImageIds({
            StudyInstanceUID:
                '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
            SeriesInstanceUID:
                '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
            wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
        }).then((ids) => {
            setImageIds(ids);
            setCornerstoneInitialized(true);
            setRenderingEngine(new RenderingEngine('demo-engine'));
        });
    }, []);

    useEffect(() => {
        if (!cornerstoneInitialized || imageIds.length <= 0 || !renderingEngine)
            return;

        const element = document.getElementById(
            'stack-viewport',
        ) as HTMLDivElement;

        const viewportInput = {
            viewportId: 'demo-stack-viewport',
            element,
            type: ViewportType.STACK,
            defaultOptions: {
                background: [0.2, 0, 0.2] as Types.Point3,
            },
        };

        renderingEngine.enableElement(viewportInput);

        const viewport = renderingEngine.getViewport(
            viewportInput.viewportId,
        ) as Types.IStackViewport;

        addTool(StackScrollTool);
        addTool(LengthTool);

        const toolGroup = ToolGroupManager.createToolGroup('stack-tool-group');
        toolGroup?.addViewport(viewport.id, renderingEngine.id);
        toolGroup?.addTool(StackScrollTool.toolName);
        toolGroup?.setToolActive(StackScrollTool.toolName, {
            bindings: [
                {
                    mouseButton: MouseBindings.Wheel,
                },
            ],
        });

        toolGroup?.addTool(LengthTool.toolName);
        toolGroup?.setToolActive(LengthTool.toolName, {
            bindings: [
                {
                    mouseButton: MouseBindings.Primary,
                },
            ],
        });

        render(imageIds, viewport);
    }, [cornerstoneInitialized, imageIds, renderingEngine]);

    return (
        <>
            {cornerstoneInitialized ? (
                <div id="stack-viewport" className="h-[800px] w-[800px]"></div>
            ) : (
                <p>Loading...</p>
            )}
        </>
    );
}

export default App;
