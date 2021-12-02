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

const DoubleQuotes = (text:string):string => {
    let results = text.replace(/"(.*?)"/ug, HTML_DOUBLE_OPEN + "$1" + HTML_DOUBLE_CLOSE);
    return results;
}

// Once all other double quotes are done, we're left with the opening ones that don't end.
// We use the unicode character here so we can search for it and replace it with the
// HTML version once we've opened and closed our <span>

const DoubleQuotesUnclosed = (text:string):string => {
    let results = text.replace('"', UNI_DOUBLE_OPEN);
    return results;
}

// There are a few expressions where we are likely to get correct single quotes.
// /'(\w+)'/ug - single word encapsulation
// /^'(.*?)'$/ - whole paragraph encapsulation, no other ticks
// /\B'\b(.*?)\b'/ug - this should match most legitimate cases, but can return false positives
// /('(.*?\p{P})'|'(\P{P}*)')/ug - better match for most proper-formed, but can return truncated entries

const SingleQuotes = (text:string):string => {
    text = text.replace(/'(\w+)'/ug, HTML_SINGLE_OPEN + '$1' + HTML_SINGLE_CLOSE);
    let results = text.replace(/('(.*?\p{P})'|'(\P{P}*)')/ug, HTML_SINGLE_OPEN + '$2$3' + HTML_SINGLE_CLOSE)
    return results;
}


const Typography = (el: HTMLElement, settings: TypographySettings) => {
    /*
        console.log("Root element is <%s> with %d child(ren):", el.tagName, el.children.length);
        // We want to separately run through any non-paragraph elements
        if (el.children.length > 0 && !matchTags.contains(el.tagName)) {
            for (var i = 0; i < el.children.length; i++) {
                // console.log(el.children[i].outerHTML);
                // console.log("Parsing child...");
                Typography(el.children[i], settings);
            }
        }
     */
    /*
    One thing we can definitely do first is run the simple apostrophe replacements,
    as they are not likely to be causing any trouble whatsoever and are necessary to
    clear up some possible mismatches later on while trying to nail down opening single
    quotes. The only time we're going to be able to fully and automatically replace the
    standard straight ' character with a single closing quote is when it is between two
    word boundaries, so we are okay to proceed always.

    We can also test for the date-based apostrophe, because Obsidian and/or Electron only
    use quotation marks around tag attributes, so there should be no instances of something
    like: <span style='80s'>Blah blah blah</span>
    */

    let innards = el.innerHTML;
    innards = SimpleApo(innards);
    innards = EraApo(innards);

    /*
    We now need to find a way to traverse our text to not end up in tags. So we need to find
    all tag boundaries.
    */

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


    rawText = DoubleQuotes(rawText);
    rawText = DoubleQuotesUnclosed(rawText); // this using the unicode char to allow us to spot the unclosed.
    rawText = SingleQuotes(rawText);
    rawText = rawText.replace(/'/ug, UNI_SINGLE_CLOSE); // since this is an apostrophe, we are using the unicode character, see note at top
    rawText = rawText.replace(/(?<!&gt;|&lt;|<|>)---(?!&gt;|&lt;|<|>)/ug, HTML_EM_DASH); // em-dashes
    rawText = rawText.replace(/(?<!&gt;|&lt;|<|>)--(?!&gt;|&lt;|<|>)/ug, HTML_EN_DASH); // en-dashes
    rawText = rawText.replace(/\.\.\./ug, HTML_HORIZ_ELLIPSIS);

    /*
    Now we need to reconsistute our raw text into the tagged version. We have the original boundaries for the tags,
    we have the original tags, and we have the text boundaries, so we know where in the string the boundaries go.
    We also know the length of the tags (and can easily obtain them with a regex if need be)

    /(&\w+;)

    Our first step is finding out if we are laying down any tags to start. While our tag boundaries are less than
    our slice boundaries, we can go ahead and just lay down the tags and proceed through boundaries until we find
    the point at which we can start adding in our text slices. We will then obtain the original text slice
    and grab the new slice (based on the cursor offset). If the two strings match, we can just lay the text in.
    If the text does not match, we need to adjust our cursor offset. To do that, we need to find out at what
    point the text stops matching by searching for our HTML entities.

    Now, theoretically, some entities could already exist, so it's a matter of obtaining the index and then doing
    a quick match with the original text to see if it matches, if so, we can move on to the next match. Once we find
    the point of divergence, we adjust the cursor and continue to lay down the text, moving along the text until
    we reach the end of the current text boundary.

    */

    let cursor = 0;
    let boundIndex = 0;
    let offset = 0;
    let newInnards = "";
    let rtStart = 0;
    let rtEnd = rawText.length;
    // There should always be tag boundaries, but just in case...
    if (boundaries.length > 0) {
        for (var i = 0; i < slices.length; i += 2) {
            let bStart = boundaries[boundIndex];
            let bEnd = boundaries[boundIndex+1];
            let tStart = slices[i];
            let tEnd = slices[i+1];

        }
    } else {
        newInnards = rawText;
        textEnd = newInnards.length;
    }

    newInnards.replace(/(&ldquo;)(.*?)(&rdquo;)/ug, '<span class="doubleQuote">$1$2$3</span>');
    let dqRunon = newInnards.contains(UNI_DOUBLE_OPEN);
    newInnards.replace(UNI_DOUBLE_OPEN, '<span class="doubleQuoteRunon">' + HTML_DOUBLE_OPEN);
    if (dqRunon) {
        newInnards = newInnards.slice(0, textEnd) + "</span>" + newInnards.slice(textEnd);
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