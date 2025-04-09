import React from 'react';

interface IProps {
    title: string;
    description: string;
}

const InfoCard: React.FC<IProps> = ({
    description,
    title,
}): React.JSX.Element => (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-lg p-4">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <h2 className="text-xl font-bold mb-4">{description}</h2>
    </div>
);

export default InfoCard;
