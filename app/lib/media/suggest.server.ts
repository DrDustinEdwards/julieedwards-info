// Tags and alt text a model suggests for a library picture: site-api's mediaSuggester (Workers AI, through Cloudflare
// AI Gateway when AI_GATEWAY_BASE_URL names one). Nothing here writes: a suggestion reaches the file only when a person
// accepts it in Carrel, as an alt or a tags write. Only a picture an editor uploaded is sent, and only when an editor
// asks; never a visitor's data.
import { mediaSuggester } from "@dustinedwards/site-api";

/** What the model suggests for one stored picture. Throws when the site has no AI binding. */
export const suggestFor = mediaSuggester({ app: "julieedwards", describe: "on a school board candidate's campaign website" });
