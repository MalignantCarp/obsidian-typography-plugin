# 2021-12-09
 - Fixed a bug wherein HTML for heading or block embeds was getting mangled as the regex that bypassed tags was not accounting for potential attributes within those tags (such as the alt-text that includes > in the case of embeds).
 - Removed debug logging.
 - Fixed the new regex as an erroneously-altered .* into \w* prevented certain tags from being matched that needed to be.
TODO: Replace regex for tags with a proper parser.
TODO: Find a better means of determining what is and is not a single opening quote.

# 2021-12-05
- Initial 0.0.1 release.