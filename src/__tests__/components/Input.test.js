/**
 * Input Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Input from '../../components/common/Input';

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  test('renders input with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('shows error message', () => {
    render(<Input error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('shows helper text', () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  test('shows required indicator', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('renders with icon', () => {
    const icon = <span>🔍</span>;
    render(<Input icon={icon} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });
});





