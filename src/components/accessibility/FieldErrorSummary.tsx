import React from "react";

export interface FieldError {
  field: string;
  message: string;
}

export interface FieldErrorSummaryProps {
  errors: FieldError[];
  title?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function FieldErrorSummary({ errors, title, headingLevel = 2 }: FieldErrorSummaryProps) {
  const Heading = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  return (
    <div role="alert" aria-live="assertive" aria-atomic="true">
      {errors.length > 0 && (
        <>
          {title && <Heading>{title}</Heading>}
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
