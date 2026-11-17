import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  tag?: 'h1' | 'h2' | 'p' | 'span';
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Ketik di sini...',
  tag = 'span',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    } else {
      setText(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1.5 z-20">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className={`bg-white text-slate-900 border-2 border-amber-500 rounded-lg px-2 py-0.5 shadow-md focus:outline-none font-semibold text-inherit ${inputClassName}`}
        />
        <button
          onClick={handleSave}
          title="Simpan"
          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setText(value);
            setIsEditing(false);
          }}
          title="Batal"
          className="p-1 bg-slate-300 text-slate-700 rounded-md hover:bg-slate-400 transition-colors shadow-xs"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  const TagName = tag;

  return (
    <span
      onClick={() => setIsEditing(true)}
      title="Klik untuk Edit Langsung di Tempat (Live Pitch)"
      className={`group cursor-pointer inline-flex items-center gap-1.5 hover:bg-amber-500/15 px-1.5 py-0.5 rounded-lg transition-colors border border-transparent hover:border-amber-400/40 ${className}`}
    >
      <TagName className="inline-block">{value}</TagName>
      <Edit2 className="w-3.5 h-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all shrink-0" />
    </span>
  );
};
