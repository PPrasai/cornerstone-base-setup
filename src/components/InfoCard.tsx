import React from 'react';
import { useNavigate } from 'react-router-dom';

interface IProps {
    title: string;
    description: string;
}

const InfoCard: React.FC<IProps> = ({
    description,
    title,
}): React.JSX.Element => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white shadow-lg p-4 relative">
            <img
                className="h-[30px] w-[30px] absolute top-0 left-0 m-4 cursor-pointer"
                src="/back-icon.svg"
                onClick={() => navigate(-1)}
            />
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <h2 className="text-xl font-bold mb-4">{description}</h2>
        </div>
    );
};

export default InfoCard;
