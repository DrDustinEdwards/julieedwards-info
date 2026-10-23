// Capsomer's pre-paint theme script (theme-switch.md), with the key the site has always used ("theme",
// the theme button's data-cap-pref), so a visitor's choice survives. With no choice, data-theme stays off
// and the system's setting applies. The policy trusts this exact text by hash (workers/security-headers.ts).
export const THEME_KEY = "theme";
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
