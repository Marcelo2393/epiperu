/**
 * Buscador de departamentos con autocompletado.
 */
import React, { useState, useEffect, useRef } from 'react';
import { getDepartments } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { Department } from '../../types';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filtered, setFiltered] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedUbigeo } = useAppStore();

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const results = departments.filter(d =>
      d.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    );
    setFiltered(results.slice(0, 8));
    setOpen(results.length > 0);
  }, [query, departments]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (dept: Department) => {
    setQuery(dept.nombre);
    setOpen(false);
    setSelectedUbigeo(dept.ubigeo);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="search-dept" className="sr-only">Buscar departamento</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true">🔍</span>
        <input
          id="search-dept"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar departamento..."
          className="pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none w-44"
          aria-label="Buscar departamento del Perú"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-results"
          autoComplete="off"
        />
      </div>

      {open && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[1000] max-h-60 overflow-y-auto"
        >
          {filtered.map(dept => (
            <li
              key={dept.ubigeo}
              role="option"
              aria-selected={false}
              className="px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer flex items-center gap-2"
              onClick={() => handleSelect(dept)}
              onKeyDown={e => e.key === 'Enter' && handleSelect(dept)}
              tabIndex={0}
            >
              <span className="text-xs text-slate-400">{dept.region === 'Selva' ? '🌿' : dept.region === 'Sierra' ? '🏔️' : '🌊'}</span>
              {dept.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
