import React from 'react';

const PageNotFound: React.FC = (): React.JSX.Element => (
    <div
        data-testid="page-not-found"
        className="flex flex-col items-center justify-center h-screen"
    >
        <h1 className="text-4xl font-bold text-red-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
    </div>
);

export default PageNotFound;
