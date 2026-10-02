'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Home, X, ArrowRight, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  type: 'STUDENT' | 'ROOM';
  link: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ students: SearchResult[]; rooms: SearchResult[] }>({
    students: [],
    rooms: [],
  });
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ students: [], rooms: [] });
      return;
    }

    if (query.trim().length < 2) {
      setResults({ students: [], rooms: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelect = (link: string) => {
    onClose();
    router.push(link);
  };

  const hasResults = results.students.length > 0 || results.rooms.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-10">
        <div className="flex items-center px-4 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search students, rooms, beds, phone numbers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-base bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-400 text-slate-800"
            autoFocus
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          )}
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {query.trim().length >= 2 && !loading && !hasResults && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No matching students or rooms found for &quot;{query}&quot;
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-6 text-center text-slate-400 text-xs">
              Type at least 2 characters to search across residents, room numbers, and contact details.
            </div>
          )}

          {results.students.length > 0 && (
            <div className="mb-3">
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Residents
              </div>
              <div className="space-y-1">
                {results.students.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.rooms.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hostel Rooms
              </div>
              <div className="space-y-1">
                {results.rooms.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
