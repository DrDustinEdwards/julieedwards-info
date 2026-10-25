// /.well-known/security.txt (RFC 9116), from site-runtime: where to report a vulnerability.
import { securityTxtResponse } from "@dustinedwards/site-runtime/security-txt";
import { SECURITY_CONTACT, SECURITY_TXT_EXPIRES, SITE_URL } from "~/lib/site";

export function loader() {
  return securityTxtResponse({ origin: SITE_URL, contact: SECURITY_CONTACT, expires: SECURITY_TXT_EXPIRES });
}
