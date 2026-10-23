// Every path the site does not have: a 404, drawn by the root ErrorBoundary in the site's chrome.
export function loader(): never {
  throw new Response("Not Found", { status: 404 });
}

export default function NotFound() {
  return null;
}
