import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartWrapper from './ChartWrapper';

test('renders ChartWrapper component', () => {
    render(<ChartWrapper />);
    const linkElement = screen.getByText(/chart/i);
    expect(linkElement).toBeInTheDocument();
});