import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalInput } from '../TerminalInput';

describe('TerminalInput', () => {
  it('renders with label', () => {
    render(<TerminalInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders without label', () => {
    const { container } = render(<TerminalInput placeholder="test" />);
    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<TerminalInput error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error present', () => {
    const { container } = render(<TerminalInput error="Error" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-terminal-error');
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<TerminalInput onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<TerminalInput ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});