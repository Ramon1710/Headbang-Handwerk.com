'use client';

import type { ButtonHTMLAttributes, FormEvent } from 'react';

interface ConfirmSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  confirmMessage: string;
}

export function ConfirmSubmitButton({ confirmMessage, onClick, ...props }: ConfirmSubmitButtonProps) {
  function handleClick(event: FormEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }

    onClick?.(event as never);
  }

  return <button {...props} onClick={handleClick as never} />;
}