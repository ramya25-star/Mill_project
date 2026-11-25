import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

// A dropdown with a search box, used instead of <select> for lists that can
// grow (suppliers, addresses, departments, units). The list opens inline below
// the field, so it is never cut off inside dialogs or scrolling screens.
//
// options:       [{ value, label, keywords?, disabled?, hint? }]
// footerOptions: options always shown under the list, even while searching
//                (e.g. "+ Add Supplier Manually"). onChange gets the typed
//                search text as its second argument.
export default function SearchSelect({
  value,
  onChange,
  options = [],
  footerOptions = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'Nothing matches your search.',
  disabled = false,
  invalid = false,
  id,
  ariaLabel
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const autoId = useId();
  const listId = `${id || autoId}-list`;

  // An empty value shows the placeholder (an "empty" option can still be picked to clear).
  // A saved value that is no longer in the list (e.g. an old address name) is
  // shown as it is, rather than pretending another option is chosen.
  const selected = (value === '' || value == null)
    ? null
    : options.find(o => o.value === value) || footerOptions.find(o => o.value === value) || { value, label: String(value) };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const words = q.split(/\s+/);
    return options.filter(o => {
      const hay = `${o.label} ${o.keywords || ''}`.toLowerCase();
      return words.every(w => hay.includes(w));
    });
  }, [options, query]);
  const items = useMemo(() => [...filtered, ...footerOptions], [filtered, footerOptions]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = Math.max(0, options.findIndex(o => o.value === value));
    setActive(idx);
    // Focus the search box so typing starts straight away, and keep the list
    // on screen (not under the bottom bar or the keyboard).
    setTimeout(() => {
      searchRef.current?.focus({ preventScroll: true });
      const panel = rootRef.current?.querySelector('.ss-panel');
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (opt) => {
    if (!opt || opt.disabled) return;
    onChange(opt.value, query.trim());
    setOpen(false);
  };

  const move = (delta) => {
    if (!items.length) return;
    let next = active;
    for (let i = 0; i < items.length; i += 1) {
      next = (next + delta + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    setActive(next);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const renderItem = (opt, index, isFooter) => (
    <li
      key={`${isFooter ? 'f' : 'o'}-${opt.value}`}
      id={`${listId}-${index}`}
      data-index={index}
      role="option"
      aria-selected={opt.value === value}
      aria-disabled={opt.disabled || undefined}
      className={[
        'ss-option',
        index === active ? 'is-active' : '',
        opt.value === value ? 'is-selected' : '',
        opt.disabled ? 'is-disabled' : '',
        isFooter ? 'is-footer' : ''
      ].join(' ')}
      onMouseEnter={() => !opt.disabled && setActive(index)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => choose(opt)}
    >
      <span>{opt.label}</span>
      {opt.hint && <small>{opt.hint}</small>}
    </li>
  );

  return (
    <div className={`ss-root${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`form-control ss-trigger${invalid ? ' is-invalid' : ''}${selected ? '' : ' is-placeholder'}`}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true); } }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        <span className="ss-value">{selected ? selected.label : placeholder}</span>
      </button>
      {open && (
        <div className="ss-panel">
          <input
            ref={searchRef}
            type="search"
            className="ss-search"
            value={query}
            placeholder={searchPlaceholder}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
            aria-label={searchPlaceholder}
            autoComplete="off"
          />
          <ul className="ss-list" id={listId} role="listbox" ref={listRef}>
            {filtered.map((opt, i) => renderItem(opt, i, false))}
            {!filtered.length && <li className="ss-empty" role="presentation">{emptyText}</li>}
            {footerOptions.map((opt, i) => renderItem(opt, filtered.length + i, true))}
          </ul>
        </div>
      )}
    </div>
  );
}
