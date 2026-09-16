import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalButton } from '../TerminalButton';

describe('TerminalButton', () => {
  it('renders children correctly', () => {
    render(<TerminalButton>Click me</TerminalButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<TerminalButton onClick={handleClick}>Click</TerminalButton>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<TerminalButton disabled>Disabled</TerminalButton>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('applies primary variant by default', () => {
    render(<TerminalButton>Primary</TerminalButton>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('border-terminal-accent');
  });

  it('applies danger variant correctly', () => {
    render(<TerminalButton variant="danger">Delete</TerminalButton>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('border-terminal-error');
  });
});