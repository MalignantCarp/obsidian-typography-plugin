# 2022-05-06 v0.0.9
 - (Corrected dates in changelog)
 - Fixed #12 - Typography ignored in Callout Titles

# 2022-01-03 v0.0.8
 - Fixed an uncaught exception in Typography.ts line 95. `token.closer.location` accessed when `token.closer` is `null`; confirm it is `!null` first.

# 2022-01-02 v0.0.7
 - Fixed issues #10 and #11 (though not likely the last time we'll see a style-related issue).
 - Further refined single quote regex to better determine single quote blocks. A quick rule of thumb for this is that as soon as you bring in any punctuation beyond dashes and the occasional apostrophe, there is an expectation that the single quote block follows proper grammar and will end with a piece of punctuation such as a period or comma.
 - Fixed the way `<code>` and `<pre>` blocks are handled so they no longer cause trouble.
 - Fixed the way certain typography elements are handled so that disabling them doesn't cause trouble with other elements (most notably when disabling apostrophes but not single quotes and vice versa).

# 2022-01-01 v0.0.6
 - New HTML Parser that navigates the DOM to handle replacement and styling (where desired).
 - The above fixes for #7 and #8 and achieves #3.
 - New Regex for determining single quotes (though the replacement system still seems to fail in certain cases where single quotes are disabled but apostrophes are enabled). Still not satisfied enough to mark #2 complete.
 - New DOM navigation for styling does have certain deficiencies with regard to when a style changes within a highlighted block when those style changes start before and end within or start within and end outside. Neither of those two cases should occur in standard usage, so this is not a great concern at this time.
 - Ability to specify custom double quotes. Unfortunately, due to the limitations with respect to single quotes, it is not practicable to provide a similar mechanism for single quotes, as these will often end prematurely.
LIMITATION: Some single quote blocks end prematurely due to apostrophes that are placed after a word (plural possessive or contractions e.g., runnin').
LIMITATION: Styling or quotation blocks is incorrect if other style information begins inside but ends outside or begins outside and ends inside that quotation block.

# 2021-12-17
 - Potential fix for #5, style settings not appearing. There was a second comment block directly succeeding the comment block for the style settings. Not sure why that would make a difference, but moved the comment block below :root nonetheless.
 - Made style setting headings collapsed by default.
 - Fix for #6, content of \<code> blocks being formatted, but they shouldn't be. (Update to 0.0.5)

# 2021-12-09
 - Fixed a bug wherein HTML for heading or block embeds was getting mangled as the regex that bypassed tags was not accounting for potential attributes within those tags (such as the alt-text that includes > in the case of embeds).
 - Removed debug logging.
 - Fixed the new regex as an erroneously-altered .* into \w* prevented certain tags from being matched that needed to be.
~TODO: Replace regex for tags with a proper parser.~
~TODO: Find a better means of determining what is and is not a single opening quote.~

# 2021-12-05
- Initial 0.0.1 release.