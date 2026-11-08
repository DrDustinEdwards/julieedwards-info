// Tags and alt text a model suggests for a library picture: site-api's mediaSuggester (Claude Haiku 5.5, straight at
// Anthropic with ANTHROPIC_API_KEY). Nothing here writes: a suggestion reaches the file only when a person
// accepts it in Carrel, as an alt or a tags write. Only a picture an editor uploaded is sent, and only when an editor
// asks; never a visitor's data.
import { mediaSuggester } from "@dustinedwards/site-api";

/** What the model suggests for one stored picture. Throws when the site has no ANTHROPIC_API_KEY. */
export const suggestFor = mediaSuggester({
  app: "julieedwards",
  describe: "on a school board candidate's campaign website",
});
