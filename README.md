# Obsidian Typography
This plugin for Obsidian (https://obsidian.md) provides automatic rendering of typographer quotes, ellipses, en- and em-dashes, based on some simple criteria, though this is not without limitation. The typography is done solely on render, so the original text remains wholly unaltered.

## Features
### Dashes and Ellipses
 - En-dashes are produced via two consecutive hyphens (--). Note that a hair space is placed on either side of an en-dash when it is between two numbers.
 - Em-dashes are produced via three consecutive hyphens (---).
 - Ellipses are produced via three consecutive periods/full stops (...).

### Typographer Quotes
Basic apostrophes are transformed into curly closing right quotes based on two simple criteria. They must either fall between a letter, number, or space on either side or precede a digit followed by 0s (and not another apostrophe afterwards). The latter rule is for stuff such as '80s and '90s.

Double quotes are styled based on simple criteria: they open and close within a single paragraph element passed by Obsidian. They can also run on, which is to say there is no closing quote.

Single quotes are a little more complicated. Because of plural possessives and contractions that can wholly omit the start and/or end of a word, it is a little more challenging to make the determination of what is or is not a block surrounding by single quotes. In most cases, the regular expression used to make that determination will be correct, but situations involving certain contractions or plural possessives can result in the block being terminated early.

Once the single quotes are figured out, the remaining straight apostrophes are turned into right single quotes/apostrophes.

You can set your own custom double quotes in the options. Currently defaults to standard North American double quotes with options for guillemets and inverted guillemets.

### Highlighting
The plugin also allows for highlighting of double and single quoted blocks, including borders, with alternating borders for when a single quote block is in a double quote block and vice versa. Due to certainly limitations surrounding single quote recognition, it is generally not recommended that single quote blocks be highlighted if they will occur within double quote blocks. It may be desirable to use the same colors for each.

## Known Issues / Limitations
 - Some single quote blocks end prematurely due to apostrophes that are placed after a word (plural possessive or contractions e.g., runnin').
 - Styling of quotation blocks is incorrect if other style information begins inside but ends outside or begins outside and ends inside that quotation block.

## Installation
Right now, this is not in Community Plugins, so you will want to use Obsidian BRAT to install, or manually download the release and install it in your vault's .obsidian folder in plugins/obsidian-typography-plugin.

## Configuration
You can select what features you want to enable in settings. If you have the Style Settings plugin, you can configure the CSS as well.

# Screenshot

![ScreenShot](/res/obsidian-typography.png)

# Current Plans
- [ ] Alternative means for handling single quotes, such as a surrogate character for single quotes (which will allow us to differentiate between single quote blocks and apostrophes).
