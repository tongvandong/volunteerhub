import React from 'react';

export default function RegistrationFilters({ filters, selectedFilter, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onSelect(filter.key)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedFilter === filter.key ? 'bg-primary-600 text-white' : 'bg-white border border-warmborder text-warmink-2 hover:border-primary-300'
          }`}
        >
          {filter.label}
          <span className="ml-1.5 text-xs opacity-70">{filter.count}</span>
        </button>
      ))}
    </div>
  );
}
