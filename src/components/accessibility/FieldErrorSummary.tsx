import React from "react";

export interface FieldError {
  field: string;
  message: string;
}

export interface FieldErrorSummaryProps {
  errors: FieldError[];
  title?: string;
}

export function FieldErrorSummary({ errors, title }: FieldErrorSummaryProps) {
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true">
      {errors.length > 0 && (
        <>
          {title && <p>{title}</p>}
          <ul>
            {errors.map((error) => (
              <li key={error.field}>{error.message}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
