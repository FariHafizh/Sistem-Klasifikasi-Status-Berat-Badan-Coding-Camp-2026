/**
 * PasswordInput — input password dengan toggle show/hide reusable
 */
import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function PasswordInput({
  label = 'Password',
  id = 'password',
  placeholder = '••••••••',
  value,
  onChange,
  required = false,
  error = '',
  className = '',
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div
        className={`
        flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border bg-white
        transition-all duration-150 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary
        ${error ? 'border-red-400' : 'border-gray-200'}
      `}
      >
        <Lock size={16} className="text-gray-400 shrink-0" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
