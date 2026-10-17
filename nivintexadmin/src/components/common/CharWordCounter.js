import React from 'react';
import { countChars, countWords } from '../../utils/textValidation';

/**
 * Live character & word counter badge for inputs and textareas.
 * Provides instant visual feedback when limits are reached or exceeded.
 */
export default function CharWordCounter({
  value = '',
  maxChars,
  maxWords,
  minChars,
  minWords,
  showChars = true,
  showWords = true,
  hint = '',
  className = '',
}) {
  const text = (value ?? '').toString();
  const charCount = countChars(text);
  const wordCount = countWords(text);

  const charOver = maxChars && charCount > maxChars;
  const wordOver = maxWords && wordCount > maxWords;
  const charNear = maxChars && !charOver && charCount >= maxChars * 0.85;
  const wordNear = maxWords && !wordOver && wordCount >= maxWords * 0.85;

  const isError = charOver || wordOver;
  const isWarning = !isError && (charNear || wordNear);

  let errorMsg = null;
  if (charOver && wordOver) {
    errorMsg = `Exceeds char (+${charCount - maxChars}) & word (+${wordCount - maxWords}) limits`;
  } else if (charOver) {
    errorMsg = `Exceeds max chars by ${charCount - maxChars}`;
  } else if (wordOver) {
    errorMsg = `Exceeds max words by ${wordCount - maxWords}`;
  } else if (minChars && text.trim() && charCount < minChars) {
    errorMsg = `Minimum ${minChars} chars required`;
  } else if (minWords && text.trim() && wordCount < minWords) {
    errorMsg = `Minimum ${minWords} words required`;
  }

  const badgeColor = isError ? '#DC2626' : isWarning ? '#D97706' : '#6B7280';

  return (
    <div
      className={`km-cwc-row ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        lineHeight: '1.4',
        marginTop: '3px',
        minHeight: '16px',
        gap: '8px',
      }}
    >
      <div style={{ flex: 1, color: isError ? '#DC2626' : '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {errorMsg ? (
          <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>⚠️</span> {errorMsg}
          </span>
        ) : hint ? (
          <span>{hint}</span>
        ) : null}
      </div>

      <div
        style={{
          color: badgeColor,
          fontWeight: isError || isWarning ? 600 : 500,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.01em',
        }}
      >
        {showChars && (
          <span>
            {charCount}
            {maxChars ? `/${maxChars}` : ''} chars
          </span>
        )}
        {showChars && showWords && <span style={{ margin: '0 5px', opacity: 0.5 }}>•</span>}
        {showWords && (
          <span>
            {wordCount}
            {maxWords ? `/${maxWords}` : ''} words
          </span>
        )}
      </div>
    </div>
  );
}
