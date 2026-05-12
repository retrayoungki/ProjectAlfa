import React, { useState, useRef, useEffect } from 'react';

const DateInput = ({ name, value, onChange, className, style }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const displayValue = value ? value.split('-').reverse().join('/') : '';

  const handleClick = (e) => {
    // Attempt to open the native date picker popup
    if (inputRef.current && inputRef.current.showPicker) {
      try {
        inputRef.current.showPicker();
      } catch (err) {
        // Fallback for browsers that don't support showPicker
        inputRef.current.focus();
      }
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      className="relative w-full h-full cursor-pointer" 
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        // We make the native input tiny and hidden, but still technically in the DOM so it can be focused/opened
        className="absolute top-1/2 left-1/2 w-0 h-0 opacity-0 pointer-events-none -z-10"
      />
      
      <div 
        className={`${className} flex items-center justify-between ${isFocused ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        style={style}
      >
        <span className={value ? 'text-inherit' : 'text-inherit opacity-50'}>
          {value ? displayValue : 'DD/MM/YYYY'}
        </span>
        <span className="material-symbols-outlined text-[16px] pointer-events-none opacity-50">
          calendar_today
        </span>
      </div>
    </div>
  );
};

export default DateInput;
