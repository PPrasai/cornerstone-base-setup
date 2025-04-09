/* eslint-disable react/react-in-jsx-scope */
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoCard from '../../components/InfoCard';

describe('InfoCard component', () => {
    it('renders the title and description', () => {
        const testTitle = 'Welcome to the App';
        const testDescription = 'This is a test description.';

        render(<InfoCard title={testTitle} description={testDescription} />);

        expect(screen.getByText(testTitle)).toBeInTheDocument();
        expect(screen.getByText(testDescription)).toBeInTheDocument();
    });

    it('applies correct class names', () => {
        render(<InfoCard title="Title" description="Description" />);

        const container = screen.getByText('Title').parentElement;

        expect(container).toHaveClass(
            'flex',
            'flex-col',
            'items-center',
            'justify-center',
            'rounded-2xl',
            'bg-white',
            'shadow-lg',
            'p-4',
        );
    });
});
