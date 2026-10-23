// Sets data-theme before paint so there is no theme flash. A stored preference wins; otherwise the OS.
// The policy trusts this exact text by hash (workers/security-headers.ts), so the two cannot drift.
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
