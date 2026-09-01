'use client';

import type { ButtonHTMLAttributes, MouseEvent } from 'react';

interface FormValueSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hiddenFieldName: string;
  hiddenFieldValue: string;
}

export function FormValueSubmitButton({ hiddenFieldName, hiddenFieldValue, onClick, ...props }: FormValueSubmitButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;

    if (form) {
      const field = form.elements.namedItem(hiddenFieldName);

      if (field instanceof HTMLInputElement) {
        field.value = hiddenFieldValue;
      }
    }

    onClick?.(event);
  }

  return <button {...props} onClick={handleClick} />;
}