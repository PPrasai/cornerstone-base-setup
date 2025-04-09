import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = (): React.JSX.Element => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-4 items-center justify-center h-screen">
            <h3 className="text-2xl font-bold">Select one of the viewers</h3>
            <div className="flex gap-4 justify-center">
                <div
                    className="flex flex-col gap-4 items-center justify-center rounded-2xl bg-white shadow-xl p-4 m-4 cursor-pointer"
                    onClick={() => navigate('/stack-viewer')}
                >
                    <h1 className="text-4xl p-4 font-bold">Stack Viewer</h1>
                </div>
                <div
                    className="flex flex-col gap-4 items-center justify-center rounded-2xl bg-white shadow-xl p-4 m-4 cursor-pointer"
                    onClick={() => navigate('/mpr-viewer')}
                >
                    <h1 className="text-4xl p-4 font-bold">MPR Viewer</h1>
                </div>
            </div>
        </div>
    );
};
export default LandingPage;
