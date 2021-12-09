# 2021-12-09
 - Fixed a bug wherein HTML for heading or block embeds was getting mangled as the regex that bypassed tags was not accounting for potential attributes within those tags (such as the alt-text that includes > in the case of embeds).
TODO: Replace regex for tags with a proper parser.
 - Removed debug logging.

# 2021-12-05
- Initial 0.0.1 release.