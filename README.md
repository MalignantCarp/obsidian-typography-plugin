## Obsidian Typography

This plug is for Obsidian (https://obsidian.md), and provides a way to automatically produce typographer quotes, ellipses, en- and em-dashes, based on some simple criteria, though this is not without limitation. The typography is done solely on render, so the original text remains wholly unaltered.

### Dashes and Ellipses
En-dashes are produced via two consecutive hyphens (--).

Em-dashes are producted via three consecutive hyphens (---).

Ellipses are produce via three consecutive periods/full stops (...).

### Typographer Quotes
Basic apostrophes are transformed into curly closing right quotes based on two simple criteria. They must either fall between a letter, number, or space on either side or precede a digit followed by 0s (and not another apostrophe afterwards). The latter rule is for stuff such as '80s and '90s.

Double quotes are styled based on simple criteria: they open and close within a single paragraph element passed by Obsidian. They can also run on, which is to say there is no closing quote.

Single quotes are a little more complicated.

### Highlighting
The plugin also allows for highlighting of double and single quoted blocks, including borders, with alternating borders for when a single quote block is in a double quote block and vice versa. Due to certainly limitations surrounding single quote recognition, it is generally not recommended that single quote blocks be highlighted if they will occur within double quote blocks. It may be desirable to use the same colors for each.

## Installation
Right now, this is not in Community Plugins, so you will want to use Obsidian BRAT to install, or manually download the release and install it in your .obsidian/plugins folder.

## Future Plans
-[ ] Add