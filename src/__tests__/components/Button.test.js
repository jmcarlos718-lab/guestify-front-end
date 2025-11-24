/**
 * Button Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/common/Button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByText('Disabled Button').closest('button');
    expect(button).toBeDisabled();
  });

  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    // Button should be disabled when loading
    expect(screen.getByText('Loading').closest('button')).toBeDisabled();
  });

  test('applies variant classes', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.querySelector('.btn-primary')).toBeInTheDocument();
  });

  test('applies size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.querySelector('.btn-lg')).toBeInTheDocument();
  });

  test('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    expect(container.querySelector('.btn-full-width')).toBeInTheDocument();
  });
});

