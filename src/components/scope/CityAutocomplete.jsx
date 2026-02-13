"use client";
import { useState, useRef, useEffect } from "react";
import { US_CITIES } from "@/data/us-cities";

function HighlightedText({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-blue-400 font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  );
}

function filterCities(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const matches = US_CITIES.filter(c => {
    const full = `${c.city}, ${c.state}`.toLowerCase();
    const cityLower = c.city.toLowerCase();
    return cityLower.startsWith(q) || full.startsWith(q);
  });
  return matches
    .sort((a, b) => {
      const aExact = a.city.toLowerCase().startsWith(q);
      const bExact = b.city.toLowerCase().startsWith(q);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.city.localeCompare(b.city);
    })
    .slice(0, 8);
}

export default function CityAutocomplete({ value, onChange, onCitySelect, disabled, label, placeholder }) {
  const [inputValue, setInputValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { setInputValue(value || ""); }, [value]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    const filtered = filterCities(val);
    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setHighlightedIndex(-1);
  };

  const selectCity = (city) => {
    const formatted = `${city.city}, ${city.state}`;
    setInputValue(formatted);
    onChange(formatted);
    onCitySelect(city);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectCity(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (inputValue && inputValue.length >= 2) {
      const filtered = filterCities(inputValue);
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setIsOpen(true);
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const cls = "w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition disabled:opacity-50";

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cls}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg shadow-black/50"
        >
          {suggestions.map((city, index) => (
            <li
              key={`${city.city}-${city.state}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(e) => { e.preventDefault(); selectCity(city); }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2 text-sm cursor-pointer transition ${
                index === highlightedIndex
                  ? "bg-blue-500/20 text-blue-300"
                  : "text-[var(--text)] hover:bg-[var(--bg-card)]"
              }`}
            >
              <HighlightedText text={`${city.city}, ${city.state}`} query={inputValue} />
              <span className="ml-2 text-[10px] text-[var(--text-muted)]">{city.timezone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
