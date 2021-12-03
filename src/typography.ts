import { TypographySettings } from "./types";

/*
apostrophe = right single quote = &rsquo; = \u2019
left single quote = &lsquo; = \u2018
right single quote = &rsquo; = \u2019
left double quote = &rdquo; = \u201C
right double quote = &ldquo; = \u201D
horizontal ellipsis = &hellip; = \u2026
en-dash = &ndash; = \u2013
em-dash = &mdash; = \u2014
hair space = &hairsp; = \u200A
*/

const UNI_SINGLE_OPEN = "\u2018";
const UNI_SINGLE_CLOSE = "\u2019";

const UNI_DOUBLE_OPEN = "\u201C";
const UNI_DOUBLE_CLOSE = "\u201D";

const UNI_HORIZ_ELLIPSIS = "\u2026";

const UNI_EN_DASH = "\u2013";
const UNI_EM_DASH = "\u2014";

const UNI_HAIRSPACE = "\u200A";

const HTML_SINGLE_OPEN = "&lsquo;";
const HTML_SINGLE_CLOSE = "&rsquo;";

const HTML_DOUBLE_OPEN = "&ldquo;";
const HTML_DOUBLE_CLOSE = "&rdquo;";

const HTML_HORIZ_ELLIPSIS = "&hellip;";

const HTML_EN_DASH = "&ndash;";
const HTML_EM_DASH = "&mdash;";

const HTML_HAIRSPACE = "&hairsp;";

const OPEN_DOUBLE_SPAN = '<span class="doubleQuote">';
const OPEN_SINGLE_SPAN = '<span class="singleQuote">';
const OPEN_DOUBLE_SPAN_RUNON = '<span class="doubleQuoteRunon">';
const CLOSE_SPAN = "</span>";


/*

FOR APOSTROPHES, WE ARE USING THE UNICODE CHARACTER INSTEAD OF THE HTML ELEMENT.
IF WE CHOOSE TO HIGHLIGHT SINGLE QUOTED TEXT, THIS WILL ALLOW US TO DO SO.
HOWEVER, IT WILL MOST LIKELY JUST SHOW US WHERE THE SEARCHES GET THINGS WRONG.

*/

/* Simple apostrophe: \b'\b

Replaces any instance of letter characters separated by a single tick.

*/

const SimpleApo = (text: string = ''): string => {
    let results = text.replace(/\b'\b/ug, UNI_SINGLE_CLOSE);
    //console.log('Transform(', text, ')=>', results)
    return results;
};

/* Era apostrophe, matches things like '80s and '90s wherever they occur:
Only matches when a non-letter precedes the single tick to avoid possible issues with odd sci-fi names doob'00s.

/\B'(\d0s)/
*/

const EraApo = (text: string = ''): string => {
    let results = text.replace(/\B'(\d0s)/ug, UNI_SINGLE_CLOSE + '$1');
    //console.log('Transform(', text, ')=>', results)
    return results;
};

// Full enclosing double quotes are easy: /"(.*?)"/ug

const FindSimpleApostrophes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /((?<!\p{L}|\p{P})'(?=\d0s)|(?<=\p{L}|\d)'(?=\p{L}|\d))/gmu;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const TransformSimpleApostrophes = (text: string): string => {
    // console.log ("Transforming simple apostrophes...");
    return text.replace(/((?<!\p{L}|\p{P})'(?=\d0s)|(?<=\p{L}|\d)'(?=\p{L}|\d))/gmu, UNI_DOUBLE_CLOSE);
};

const FindDoubleQuotes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /"/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const FindSingleQuotes = (text: string): number[] => {
    /* This is slightly more complicated because we can't just search for the single quote and
    then see what precedes and what succeeds it; we require more context, so we can't use
    lookahead/lookbehind and will instead have to grab the indexes and iterate manually
    through text.

    The logic for using open or closing will still be able to follow identically the open
    and closing for double quotes, so we will be able to apply the <span>s appropriately,
    but there won't be any run-ons because we are going to be finding pairs only.

    Before we start, we need to make sure we aren't matching other apostrophes that should
    have been transformed already, so we convert them to unicode close single quote before we
    run our new search.
    */
    text = TransformSimpleApostrophes(text);
    let locations: number[] = [];
    let finder = /('(\P{P}*)'|'(.*?\p{P})')/ug;
    // console.log("Matching...")
    let match;
    while ((match = finder.exec(text)) !== null) {
        // console.log ("Match found, [%s] @ %d%s%d", text.slice(match.index, finder.lastIndex), match.index, UNI_EN_DASH, finder.lastIndex);
        locations.push(match.index, finder.lastIndex - 1);
    }
    return locations;
};

const FindRemainingApostrophes = (text: string, ignore: number[]): number[] => {
    // ignore = the results from FindSingleQuotes
    let apos: number[] = [];

    text = TransformSimpleApostrophes(text);
    let finder = /'/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        apos.push(match.index);
    }
    // we only return the matches that are not already included in the find single quotes matches
    let locations = apos.filter(x => !ignore.includes(x));
    return locations;
};

const FindEllipses = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /\.\.\./ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;

};

const FindEnDashes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /(?<!&gt;|&lt;|<|>|-)--(?!&gt;|&lt;|<|>|-)/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;

};

const FindEmDashes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /(?<!&gt;|&lt;|<|>|-)---(?!&gt;|&lt;|<|>|-)/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;

};

const DoubleQuotes = (text: string): string => {
    let results = text.replace(/"(.*?)"/ug, HTML_DOUBLE_OPEN + "$1" + HTML_DOUBLE_CLOSE);
    return results;
};

// Once all other double quotes are done, we're left with the opening ones that don't end.
// We use the unicode character here so we can search for it and replace it with the
// HTML version once we've opened and closed our <span>

const DoubleQuotesUnclosed = (text: string): string => {
    let results = text.replace('"', UNI_DOUBLE_OPEN);
    return results;
};

// There are a few expressions where we are likely to get correct single quotes.
// /'(\w+)'/ug - single word encapsulation
// /^'(.*?)'$/ - whole paragraph encapsulation, no other ticks
// /\B'\b(.*?)\b'/ug - this should match most legitimate cases, but can return false positives
// /('(.*?\p{P})'|'(\P{P}*)')/ug - better match for most proper-formed, but can return truncated entries

const SingleQuotes = (text: string): string => {
    text = text.replace(/'(\w+)'/ug, HTML_SINGLE_OPEN + '$1' + HTML_SINGLE_CLOSE);
    let results = text.replace(/('(.*?\p{P})'|'(\P{P}*)')/ug, HTML_SINGLE_OPEN + '$2$3' + HTML_SINGLE_CLOSE);
    return results;
};


const Typography = (el: HTMLElement, settings: TypographySettings) => {
    let innards = el.innerHTML;
    let tagFinder = /(<!--.*-->|<.*?>)/gums;
    let hasTags = tagFinder.test(innards);
    let boundaries: number[] = [];
    let tags = innards.match(tagFinder);
    if (hasTags) {
        let cursor = innards.search(tagFinder);
        for (var i = 0; i < tags.length; i++) {
            // console.log(boundaries);
            // console.log("Tag found at index %d", cursor, ":", tags[i]);
            // console.log("Adding cursor bounds %d to %d", cursor, cursor + tags[i].length);
            boundaries.push(cursor, cursor + tags[i].length);
            cursor = cursor + tags[i].length;
            let trail = innards.slice(cursor);
            if (i + 1 < tags.length) {
                let foundIndex = trail.search(tagFinder);
                // console.log("Next match found. Advancing cursor to %d", cursor + foundIndex);
                cursor += foundIndex;
            }
        }
        // console.log(boundaries)
    }

    // from the tag boundaries, we determine the ranges of innerHTML that contain raw text.

    let slices: number[] = [];
    let textStart = 0;
    let textEnd = innards.length;
    // console.log(textStart, textEnd);
    // console.log("Boundaries:", boundaries)
    if (boundaries.length == 0) {
        slices.push(textStart, textEnd);
    } else {
        for (var i = 0; i < boundaries.length; i += 2) {
            let skipStart = boundaries[i];
            let skipEnd = boundaries[i + 1];
            // console.log("text (%d-%d), skip(%d-%d) [%d/%d]", textStart, textEnd, skipStart, skipEnd, i, boundaries.length);
            if (skipStart != skipEnd) { // skipStart == skipEnd == skipping nothing, we can just continue
                if (textStart != skipStart) {
                    slices.push(textStart, skipStart);
                    textStart = skipEnd;
                } else { // if we are skipping from the start of things, just continue to next skip
                    textStart = skipEnd;
                }
            }
            if (i + 2 >= boundaries.length) {
                // console.log("text (%d-%d), skip(%d-%d) [%d/%d]", textStart, textEnd, skipStart, skipEnd, i+2, boundaries.length);
                if (skipEnd != textEnd) {
                    slices.push(skipEnd, textEnd);
                }
            }
        }
    }

    // console.log("Slices:", slices)
    let rawText = "";
    for (var i = 0; i < slices.length; i += 2) {
        let from = slices[i];
        let to = slices[i + 1];
        console.log("Slice(%d, %d): [%s]", from, to, innards.slice(from, to));
        rawText += innards.slice(from, to);
    }
    console.log("Concat: [%s]", rawText);

    console.log("Finding simple apostrophes...");
    let simpleApostrophes = FindSimpleApostrophes(rawText);
    console.log(simpleApostrophes);
    console.log("Finding Double Quotes...");
    let doubleQuotes = FindDoubleQuotes(rawText);
    console.log(doubleQuotes);
    console.log("Finding Single Quotes");
    let singleQuotes = FindSingleQuotes(rawText);
    console.log(singleQuotes);
    console.log("Finding final apostrophes...");
    let finalApostrophes = FindRemainingApostrophes(rawText, singleQuotes);
    console.log(finalApostrophes);
    console.log("Finding ellipses...");
    let ellipses = FindEllipses(rawText);
    console.log(ellipses);
    console.log("Finding en dashes...");
    let enDashes = FindEnDashes(rawText);
    console.log(enDashes);
    console.log("Finding em dashes...");
    let emDashes = FindEmDashes(rawText);
    console.log(emDashes);

    /*
    Now we need to create newInnards based on the tags and raw text:
    
    Step our cursor to the first available text character. Add to our newInnards any tag information that comes up
    before the first text character. Now, run a simple regex search for ('|"|-) - the three characters we are replacing.
    If nothing is found, attach all of the original text and move on to the next. If we find one, we check our lists:
    is it an apostrophe? Go ahead and just put in HTML_SINGLE_CLOSE. Is it a quotation mark? If doubleQuoteOpen, do
    HTML_DOUBLE_CLOSE, otherwise do HTML_DOUBLE_OPEN. If we are highlighting, then in the first case, also add </span>;
    in the latter, add <span class="doubleQuote">, but only if there is another quotation mark in the list, otherwise use
    doubleQuoteRunon. If we're at the end of the text and doubleQuoteOpen, add </span> to close the runon if that setting
    is enabled. Do likewise for single quotes.

    */
    let newInnards = "";
    let originalCursor = 0;
    let openDouble = false;
    let openSingle = false;
    let indexT = 0;
    let target = /("|'|\.\.\.|---|--)/gum;
    let offset = 0;
    let fullLength = innards.length;

    while (originalCursor < fullLength) {
        console.log("Start loop with originalCursor@%d", originalCursor);
        let isAtTextEnd = indexT + 2 >= slices.length;
        let textStart = slices[indexT];
        let textEnd = slices[indexT + 1];
        indexT += 2;
        console.log("Adjusting cursor from %d to %d and copying in original text for that range: [%s]", originalCursor, textStart, innards.slice(originalCursor, textStart));
        newInnards += innards.slice(originalCursor, textStart);
        originalCursor = textStart;
        let workingText = innards.slice(textStart, textEnd);
        let textOffset = offset;
        console.log("Text needs processing: [%s] (%d-%d) with offset %d (at end? %s) and textOffset %d", workingText, textStart, textEnd, offset, isAtTextEnd, textOffset);
        while (workingText.length > 0) {
            let textLen = workingText.length;
            let firstIndex = workingText.search(target);
            let checkIndex = firstIndex + textOffset;
            console.log("Working text is [%s] (len=%d), with match at %d (checking %d as offset is %d)", workingText, textLen, firstIndex, checkIndex, textOffset);
            if (firstIndex >= 0) {
                console.log("Adding [%s] to new inner HTML block.", workingText.slice(0, firstIndex));
                console.log("Our matched character is [%s]", workingText[firstIndex]);
                let context = workingText.slice(0, firstIndex);;
                newInnards += context;
                workingText = workingText.slice(firstIndex);
                if (simpleApostrophes.contains(checkIndex) || finalApostrophes.contains(checkIndex)) {
                    console.log("Matched character is an apostrophe.");
                    newInnards += HTML_SINGLE_CLOSE;
                    workingText = workingText.slice(1);
                } else if (doubleQuotes.contains(checkIndex)) {
                    console.log("Matched character is a double quote (open? %s).", openDouble);
                    let style = "";
                    if (settings.colorDoubleQuotes && openDouble) {
                        style = CLOSE_SPAN;
                    } else if (settings.colorDoubleQuotes && doubleQuotes[doubleQuotes.length - 1] == checkIndex && doubleQuotes.length % 2 != 0) {
                        // if we are the last double quote and there are an uneven number, we are a runon
                        // we color as normal unless we don't color the mismatches differently.
                        style = settings.colorMismatchedDoubleQuotes ? OPEN_DOUBLE_SPAN_RUNON : OPEN_DOUBLE_SPAN;
                    } else if (settings.colorDoubleQuotes) {
                        style = OPEN_DOUBLE_SPAN;
                    }
                    newInnards += openDouble ? HTML_DOUBLE_CLOSE + style : style + HTML_DOUBLE_OPEN;
                    openDouble = !openDouble;
                    workingText = workingText.slice(1);
                } else if (singleQuotes.contains(checkIndex)) {
                    console.log("Matched character is a single quote (open? %s).", openSingle);
                    let style = "";
                    if (settings.colorSingleQuotes) {
                        style = openSingle ? CLOSE_SPAN : OPEN_SINGLE_SPAN;
                    }
                    newInnards += openSingle ? HTML_SINGLE_CLOSE + style : style + HTML_SINGLE_OPEN;
                    openSingle = !openSingle;
                    workingText = workingText.slice(1);
                } else if (ellipses.contains(checkIndex)) {
                    console.log("Matched character is a horizontal ellipsis.");
                    newInnards += HTML_HORIZ_ELLIPSIS;
                    workingText = workingText.slice(3);
                } else if (emDashes.contains(checkIndex)) {
                    console.log("Matched character is an em-dash.");
                    newInnards += HTML_EM_DASH;
                    workingText = workingText.slice(3);
                } else if (enDashes.contains(checkIndex)) {
                    console.log("Matched character is an en-dash.");
                    newInnards += HTML_EN_DASH;
                    workingText = workingText.slice(2);
                } else {
                    console.log("Matched character is unknown:: %s<<[%s]>>%s", context, workingText[0], workingText.slice(1));
                    break;
                }
            } else {
                console.log("No matches on line. Adding text and clearing workingText.");
                newInnards += workingText;
                originalCursor = textEnd;
                workingText = "";
            }
            console.log("Adjusting textOffset(%d) += %d - %d = %d", textOffset, textLen, workingText.length, textLen - workingText.length);
            textOffset += textLen - workingText.length;
        }
        console.log("Adjusting offset (%d) += %d - %d = %d", offset, textEnd, textStart, offset + (textEnd - textStart));
        offset += textEnd - textStart;
        if (isAtTextEnd) {
            if (openDouble && settings.colorMismatchedDoubleQuotes) {
                console.log("Double quotes are open. Closing text span and adding remainder of original innards.");
                newInnards += CLOSE_SPAN;
            }
            console.log ("Spanning to end, adjusting cursor.")
            newInnards += innards.slice(textEnd);
            originalCursor = fullLength;
        } else {
            console.log("Adjusting original cursor from %d to %d.", originalCursor, textEnd);
            originalCursor = textEnd;
        }
    }

    el.innerHTML = newInnards;

    /*
    console.log(el.childNodes)
    Traverse(el, settings);
    console.log ("Input line: ", text, "<EOI>")
    text = SimpleApo(text);
    text = EraApo(text);
    text  = DoubleQuotes(text);
    text = DoubleQuotesUnclosed(text);
    let results = text;
    console.log ("Transformation:", results, "<EOR>")
    return results;
    */
};

export { Typography as typography };