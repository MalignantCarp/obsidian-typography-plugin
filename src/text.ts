import { ReplacementToken, TypographySettings } from "./types";

const UNI_SINGLE_OPEN = "\u2018";
const UNI_SINGLE_CLOSE = "\u2019";

const UNI_DOUBLE_OPEN = "\u201C";
const UNI_DOUBLE_CLOSE = "\u201D";

const UNI_HORIZ_ELLIPSIS = "\u2026";

const UNI_EN_DASH = "\u2013";
const UNI_EM_DASH = "\u2014";

const UNI_HAIRSPACE = "\u200A";

const CLASS_CHAR_DQ_OPEN = "OTPTokenDQOpen";
const CLASS_CHAR_DQ_CLOSE = "OTPTokenDQClose";
const CLASS_CHAR_SQ_OPEN = "OTPTokenSQOpen";
const CLASS_CHAR_SQ_CLOSE = "OTPTokenSQClose";

export const CLASS_SEQ_DOUBLE = "doubleQuote";
export const CLASS_SEQ_DOUBLE_RUN = "doubleQuoteRunon";
export const CLASS_SEQ_SINGLE = "singleQuote";

const NOT_FOR_DASHES = ["&gt;", "&lt;", "<", ">"]; // sequences and characters that can be before or after hyphens that will prevent them from becoming dashes


const IsLetter = (char: string): boolean => {
    return char.length === 1 && /\p{L}/mug.test(char);
};

const IsNumber = (char: string): boolean => {
    return char.length === 1 && /\p{N}/mug.test(char);
};

const IsPunctuation = (char: string): boolean => {
    return char.length === 1 && /\p{P}/mug.test(char);
};

const FindRawText = (el: Node): string => {
    /* This function returns the raw text found within the given node's childNodes, unless contained in <pre> or <code> blocks.
    This function should only be run on <p> and similar text-bearing elements and not text nodes, or it will return nothing.
    */
    let rawText = "";

    // console.log ("Node is ", el);
    for (var i = 0; i < el.childNodes.length; i++) {
        let child = el.childNodes[i];
        // console.log ("Childnode[%d]: %s", i, child.nodeType);
        // console.log ("Offset is %d", offset);

        let ignore = ["pre", "code"];

        if (child.nodeType == child.ELEMENT_NODE && !ignore.contains(child.nodeName.toLowerCase())) {
            let childText = FindRawText(child);
            if (childText) {
                rawText += childText;
            }
        } else if (child.nodeType == child.TEXT_NODE) {
            rawText += child.nodeValue;
        } else {
            //console.log ("Skipping node of type '%s': [%s]", type, child);
        }
    }
    return rawText;
};

const FindDQs = (text: string): number[] => {
    let locations: number[] = [];

    let finder = /"/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const FindSQs = (text: string): number[] => {
    let locations: number[] = [];

    let finder = /('(?!\s)[^\n\r"]*?\p{P}(?<!"|\s)'(?![^\s\p{P}]))|('(?!\s)[\p{L}\p{N} ]*?(?<!"|\s)'(?![^\s\p{P}]))|('(?!\s)[^\n\r]*? ".*?" [^\n\r]*?\p{P}(?<!"|\s)'(?![^\s\p{P}]))|('(?!\s).*'$)|('[^\s]*?')/mug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        let matchText = text.slice(match.index, finder.lastIndex);
        //console.log ("Match found, [%s], @ %d%s%d, lastchar[%s]", matchText, match.index, UNI_EN_DASH, finder.lastIndex, matchText[matchText.length - 1]);
        locations.push(match.index);
        if (matchText[matchText.length - 1] == "'") { locations.push(finder.lastIndex - 1); };
    }
    // console.log(locations);
    return locations;
};

const FindDumbApos = (text: string): number[] => {
    let locations: number[] = [];

    let finder = /'/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
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
    let finder = /(?<!-)--(?!-)/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const FindEmDashes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /(?<!-)---(?!-)/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;

};

const FindTokensFaster = (text: string, settings: TypographySettings): ReplacementToken[] => {
    let tokens: ReplacementToken[] = [];
    if (!(settings.apostrophes || settings.singleQuotes || settings.doubleQuotes || settings.dashes || settings.ellipses)) {
        // if we're not searching for any of these things, we're done.
        return tokens;
    }

    let locations: [number, string][] = [];

    let dqs = FindDQs(text);
    let apos = FindDumbApos(text);
    let ell = FindEllipses(text);
    let ens = FindEnDashes(text);
    let ems = FindEmDashes(text);

    for (var i = 0; i < dqs.length && settings.doubleQuotes; i++) {
        locations.push([dqs[i], '"']);
    }

    for (var i = 0; i < apos.length && (settings.apostrophes || settings.singleQuotes); i++) {
        locations.push([apos[i], "'"]);
    }

    for (var i = 0; i < ell.length && settings.ellipses; i++) {
        locations.push([ell[i], '...']);
    }

    for (var i = 0; i < ens.length && settings.dashes; i++) {
        locations.push([ens[i], '--']);
    }

    for (var i = 0; i < ems.length && settings.dashes; i++) {
        locations.push([ems[i], '---']);
    }

    locations = locations.sort((a, b) => {
        return a[0] - b[0];
    });

    // console.log(locations);

    let dqStack: ReplacementToken[] = [];

    let dqOpen = settings.doubleQuotePreset.open;
    let dqClose = settings.doubleQuotePreset.close;
    if (dqOpen == null) {
        dqOpen = settings.doubleQuoteOpen == null ? UNI_DOUBLE_OPEN : settings.doubleQuoteOpen;
    }
    if (dqClose == null) {
        dqClose = settings.doubleQuoteClose == null ? UNI_DOUBLE_CLOSE : settings.doubleQuoteClose;
    }
    for (var i = 0; i < locations.length; i++) {
        let [loc, sequence] = locations[i];
        if (sequence == '...') {
            let token: ReplacementToken = {
                location: loc,
                resolved: true,
                length: 3,
                lengthOffset: -2, // we will be removing two characters from the raw text
                original: '...',
                replacement: UNI_HORIZ_ELLIPSIS,
                spanStart: false,
                spanClass: null,
                spanEnd: false,
                spanForChar: false,
                spanClassForChar: null,
                opener: null,
                closer: null,
            };
            tokens.push(token);
        } else if (sequence == '---') {
            let token: ReplacementToken = {
                location: loc,
                resolved: false, // we need context; if &gt; or &lt; come before or after, we will discard this token
                length: 3,
                lengthOffset: -2, // we will be removing two characters from the raw text
                original: '---',
                replacement: UNI_EM_DASH,
                spanStart: false,
                spanClass: null,
                spanEnd: false,
                spanForChar: false,
                spanClassForChar: null,
                opener: null,
                closer: null,
            };
            tokens.push(token);
        } else if (sequence == '--') { // obviously it's '--'
            let token: ReplacementToken = {
                location: loc,
                resolved: false, // we need context same as for em-dashes; digits before and after will add hair space on either side
                length: 2,
                lengthOffset: -1, // we will be removing one character from the raw text
                original: '--',
                replacement: UNI_EN_DASH,
                spanStart: false,
                spanClass: null,
                spanEnd: false,
                spanForChar: false,
                spanClassForChar: null,
                opener: null,
                closer: null,
            };
            tokens.push(token);
        } else if (sequence == '"') {
            let isClosing = dqStack.length == 1; // If there is a double quote on the stack, we are closing that quotation.
            let token: ReplacementToken = {
                location: loc,
                resolved: isClosing, // if we are closing, we know that we are
                length: 1,
                lengthOffset: isClosing ? dqClose.length - 1 : dqOpen.length -1,
                original: '"',
                replacement: isClosing ? dqClose : dqOpen,
                spanStart: !isClosing && settings.colorDoubleQuotes,
                spanClass: CLASS_SEQ_DOUBLE,
                spanEnd: isClosing,
                spanForChar: true,
                spanClassForChar: isClosing ? CLASS_CHAR_DQ_CLOSE : CLASS_CHAR_DQ_OPEN,
                opener: isClosing ? dqStack.pop() : null, // If there is a double quote on the stack, that is what this one is closing, so that is our opener
                closer: null, // we don't know who the closer is
            };
            if (!isClosing) { // if we are not closing our current double quote, we will push this one onto the stack
                dqStack.push(token);
            } else {
                //if we are closing, we can set the closer for our opener
                token.opener.closer = token;
                // and set it to resolved
                token.opener.resolved = true;
            }
            tokens.push(token);
        } else if (sequence == "'") {
            /* We need full context to determine whether this is an apostrophe or a single quote, so will defer resolution
            */
            let token: ReplacementToken = {
                location: loc,
                resolved: false,
                length: 1,
                lengthOffset: 0,
                original: "'",
                replacement: null,
                spanStart: null,
                spanClass: null,
                spanEnd: null,
                spanForChar: null,
                spanClassForChar: null,
                opener: null,
                closer: null,
            };
            tokens.push(token);
        }
    }
    if (dqStack.length > 0) {
        let token = dqStack.pop();
        token.spanStart = settings.colorMismatchedDoubleQuotes;
        token.spanClass = settings.colorMismatchedDoubleQuotes ? CLASS_SEQ_DOUBLE_RUN : CLASS_SEQ_DOUBLE;
        token.resolved = true; // this is now resolved
    }
    return tokens;
};

const FindTokens = (text: string, settings: TypographySettings): ReplacementToken[] => {
    /*  This function returns an array of ReplacementTokens found within the provided text. These tokens
        will then need to be fully resolved and then can be used to replace text content within the DOM.
        The tokens indicate when a span should be opened or closed and the class, as well as if a span
        should be opened solely for the replacement token itself, the length of the original text,
        the length offset following replacement, the original text, the replacement character(s),
        and, in the case of an item that opens or closes (such as a quote), the opposing item (i.e.,
        in the event of a closing quote, the opening quote; and in the case of an opening quote,
        the closing quote, with the exception of a double quote that is not closed).
    */
    let tokens: ReplacementToken[] = [];
    if (!(settings.apostrophes || settings.singleQuotes || settings.doubleQuotes || settings.dashes || settings.ellipses)) {
        // if we're not searching for any of these things, we're done.
        return tokens;
    }
    let sequence = "";
    /*
        Double quotes are the simplest to parse. Since we're operating on individual paragraphs,
        we can assume that we are opening and closing them. At the end, we check to see if we have
        a double quote on the stack. If so, we pop it off and set its spanClass appropriately.

        These will always be resolved because we know what they are.
    */
    let dqStack: ReplacementToken[] = [];
    let escaped = false;
    let lastChar = "";
    let extendedTokens = ["...", "---", "--"];
    let watchChars = ["'", '"', '-', '.'];
    // console.log("[%s]", text);
    let dqOpen = settings.doubleQuotePreset.open;
    let dqClose = settings.doubleQuotePreset.close;
    if (dqOpen == null) {
        dqOpen = settings.doubleQuoteOpen == null ? UNI_DOUBLE_OPEN : settings.doubleQuoteOpen;
    }
    if (dqClose == null) {
        dqClose = settings.doubleQuoteClose == null ? UNI_DOUBLE_CLOSE : settings.doubleQuoteClose;
    }
    for (var i = 0; i < text.length; i++) {
        let char = text[i];
        // we want to make sure that if characters repeat, we watch out for the
        // full sequence of them, for matching ..., ---, and --
        // if they match and sequence is blank, we add both, else we just append current char
        if (char == lastChar) {
            sequence += sequence == "" ? char + lastChar : char;
        }
        // console.log("Checking char: %s[%s] (sequence: [%s])", lastChar, char, sequence);
        // console.log("%s && (%s || (%s && %s))", extendedTokens.contains(sequence), char != lastChar, char == lastChar, i + 1 >= text.length);
        if (extendedTokens.contains(sequence) && (char != lastChar || (char == lastChar && i + 1 >= text.length))) {
            // if our current character is not equal to our last character, then we have moved to a different sequence
            // if we are at the end of the text, we have finished our sequence
            // thus if that sequence is equal to '...' '---' or '--', we can tag them as appropriate.
            // Note: we cannot resolve dashes without context
            let loc = i + 1 >= text.length ? i + 1 : i;
            if (sequence == '...' && settings.ellipses) {
                let token: ReplacementToken = {
                    location: loc - 3, // it started 3 characters ago
                    resolved: true,
                    length: 3,
                    lengthOffset: -2, // we will be removing two characters from the raw text
                    original: '...',
                    replacement: UNI_HORIZ_ELLIPSIS,
                    spanStart: false,
                    spanClass: null,
                    spanEnd: false,
                    spanForChar: false,
                    spanClassForChar: null,
                    opener: null,
                    closer: null,
                };
                tokens.push(token);
            } else if (sequence == '---' && settings.dashes) {
                let token: ReplacementToken = {
                    location: loc - 3, // it started 3 characters ago
                    resolved: false, // we need context; if &gt; or &lt; come before or after, we will discard this token
                    length: 3,
                    lengthOffset: -2, // we will be removing two characters from the raw text
                    original: '---',
                    replacement: UNI_EM_DASH,
                    spanStart: false,
                    spanClass: null,
                    spanEnd: false,
                    spanForChar: false,
                    spanClassForChar: null,
                    opener: null,
                    closer: null,
                };
                tokens.push(token);
            } else if (settings.dashes) { // obviously it's '--'
                let token: ReplacementToken = {
                    location: loc - 2, // it started 3 characters ago
                    resolved: false, // we need context same as for em-dashes; digits before and after will add hair space on either side
                    length: 2,
                    lengthOffset: -1, // we will be removing one character from the raw text
                    original: '--',
                    replacement: UNI_EN_DASH,
                    spanStart: false,
                    spanClass: null,
                    spanEnd: false,
                    spanForChar: false,
                    spanClassForChar: null,
                    opener: null,
                    closer: null,
                };
                tokens.push(token);
            }
        }
        if (watchChars.contains(char)) {
            if (char == '"' && !escaped && settings.doubleQuotes) {
                let isClosing = dqStack.length == 1; // If there is a double quote on the stack, we are closing that quotation.
                let token: ReplacementToken = {
                    location: i,
                    resolved: isClosing, // if we are closing, we know that we are
                    length: 1,
                    lengthOffset: isClosing ? dqClose.length - 1 : dqOpen.length -1,
                    original: '"',
                    replacement: isClosing ? dqClose : dqOpen,
                    spanStart: !isClosing && settings.colorDoubleQuotes,
                    spanClass: CLASS_SEQ_DOUBLE,
                    spanEnd: isClosing,
                    spanForChar: true,
                    spanClassForChar: isClosing ? CLASS_CHAR_DQ_CLOSE : CLASS_CHAR_DQ_OPEN,
                    opener: isClosing ? dqStack.pop() : null, // If there is a double quote on the stack, that is what this one is closing, so that is our opener
                    closer: null, // we don't know who the closer is
                };
                if (!isClosing) { // if we are not closing our current double quote, we will push this one onto the stack
                    dqStack.push(token);
                } else {
                    //if we are closing, we can set the closer for our opener
                    token.opener.closer = token;
                    // and set it to resolved
                    token.opener.resolved = true;
                }
                tokens.push(token);
            } else if (char == "'" && !escaped) {
                /* We need full context to determine whether this is an apostrophe or a single quote, so will defer resolution
                */
                let token: ReplacementToken = {
                    location: i,
                    resolved: false,
                    length: 1,
                    lengthOffset: 0,
                    original: "'",
                    replacement: null,
                    spanStart: null,
                    spanClass: null,
                    spanEnd: null,
                    spanForChar: null,
                    spanClassForChar: null,
                    opener: null,
                    closer: null,
                };
                tokens.push(token);
            }
        }
        if (char != lastChar) {
            sequence = "";
        }
        lastChar = char;
    }
    if (dqStack.length > 0) {
        let token = dqStack.pop();
        token.spanStart = settings.colorMismatchedDoubleQuotes;
        token.spanClass = settings.colorMismatchedDoubleQuotes ? CLASS_SEQ_DOUBLE_RUN : CLASS_SEQ_DOUBLE;
        token.resolved = true; // this is now resolved
    }
    return tokens;
};

const GetContext = (text: string, index: number, width: number, context: number): [string, string, string] => {
    /*
        This function obtains the context surrounding an index into the provided text string.
        The context will be based on word boundary, either a piece of punctuation or a space.
        It will attempt to provide as much context as requested via context. The width is the
        width of the "character" we are obtaining context for.
    */
    let before = "";
    let after = "";
    let seq = "";

    let boundary = /[\p{P}\s]/gmu; // punctuation or whitespace

    if (index + width <= text.length) { // we don't want to do anything if seq would exceed the text bounds
        // the first thing we do is partition everything
        before = index > 0 ? text.slice(0, index) : "";
        after = index + width < text.length ? text.slice(index + width) : "";
        seq = text.slice(index, index + width);
        // now we just need to whittle away before and after to conform to context
        if (before.length > context) {
            for (var i = before.length; i > 0; i--) {
                if (before.length - i >= context) {
                    // once we're at least context large, we want to see if we are on a word boundary
                    if (before[i].match(boundary)) {
                        before = before.slice(i);
                    }
                }
            }
        }
        if (after.length > context) {
            for (var i = 0; i < after.length; i++) {
                if (i >= context) {
                    // once we're at least context large, we want to see if we are on a word boundary
                    if (after[i].match(boundary)) {
                        after = after.slice(0, i);
                    }
                }
            }
        }
    } else {
        // this should never happen if GetContext is called from our list of ReplacementTokens
        // if this happens, we want to know
        console.log("GetContext(%s, %d, %d, %d) - index out of range for width", text, index, width, context);
        throw RangeError();
    }
    return [before, seq, after];
};

const ResolveTokens = (text: string, tokens: ReplacementToken[], settings: TypographySettings) => {
    /*  This method proceeds through the list of tokens and resolves them by utilizing context
        retrieved using GetContext() based on the ReplacementToken's location. It is only run
        when the ReplacementToken.resolved == false

        Anything that we determine is not appropriate, such as -- or --- following or followed
        by &gt; or &lt; can be added to rejects, which will be removed from the list
    */
    let rejects: number[] = [];
    let sqStack: ReplacementToken[] = [];
    let sqs = FindSQs(text);
    // console.log("Resolving tokens...");
    for (var i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        // console.log("Token[%d]", i, token);
        if (!token.resolved) { // if the token is already resolved, we can ignore it
            let [before, char, after] = GetContext(text, token.location, token.length, 8);
            let charBefore = before.length > 0 ? before[before.length - 1] : "";
            let charAfter = after.length > 0 ? after[0] : "";
            // console.log("Token context: [%s], [%s], [%s]", before, char, after);
            if (char.contains("-")) {
                // console.log("Token is a dash.");
                // if we have <, >, &gt;, or &lt; before or after the dash, we don't want to do anything
                if ((before.length > 4 && NOT_FOR_DASHES.contains(before.slice(before.length - 4)))
                    || ((after.length > 4 && NOT_FOR_DASHES.contains(after.slice(0, 4))))
                    || (NOT_FOR_DASHES.contains(charBefore))
                    || (NOT_FOR_DASHES.contains(charAfter))) {
                    // console.log("Rejecting token.");
                    rejects.push(i);
                    continue;
                }
                if (token.replacement == UNI_EN_DASH) { // we-re dealing with an en-dash
                    // if we are between numbers, add a hairline space to either side, adjust the length offset
                    if (IsNumber(charBefore) && IsNumber(charAfter)) {
                        // console.log("Token is en-dash surrounded by numbers.");
                        token.replacement = UNI_HAIRSPACE + UNI_EN_DASH + UNI_HAIRSPACE;
                        token.lengthOffset = 1; // replacing 2 with 3 characters
                    }
                }
                token.resolved = true;
            } else if (char === "'") {
                // the dreaded dumb apostrophe
                // we have some quick checks to see if this is a legitimate apostrophe vs a single
                // opening or closing quote; in these cases, we definitely have an apostrophe

                if ((IsLetter(charBefore) && IsLetter(charAfter))
                    || (IsNumber(charBefore) && IsNumber(charAfter))
                    || (/\s/.test(charBefore) && /\s/.test(charAfter))
                    || ((!/\p{L}|\p{P}/.test(charBefore) || charBefore == "" || /\s/.test(charBefore)) && /(?=\d\ds?)(?!\d\ds?')/gum.test(after))) {
                    if (!settings.apostrophes) {
                        rejects.push(i);
                        continue;
                    }
                    token.resolved = true;
                    token.replacement = UNI_SINGLE_CLOSE;
                    token.spanStart = false;
                    token.spanEnd = false;
                    token.spanForChar = false;
                    continue;
                }
                /*
                        We have now resolved all we know to be actual apostrophes.
                        We now have to guess which ones are single opening and closing quotes
                        and then all that remain must be apostrophes

                        We're going to use our new regex expression, which has a decent accuracy. It's not perfect
                        by any stretch, but there is no perfection with dumb apostrophes.

                    */
                let singleOpen = sqStack.length == 1;
                if (!singleOpen && sqs.contains(token.location)) {
                    // console.log("Opening: [%s] [%s] [%s]", before, char, after)
                    if (!settings.singleQuotes) {
                        rejects.push(i);
                        continue;
                    }
                    token.resolved = false;
                    token.replacement = UNI_SINGLE_OPEN;
                    token.spanStart = true && settings.colorSingleQuotes;
                    token.spanClass = CLASS_SEQ_SINGLE;
                    token.spanEnd = false;
                    token.spanForChar = true;
                    token.spanClassForChar = CLASS_CHAR_SQ_OPEN;
                    sqStack.push(token);
                    continue;
                }
                if (singleOpen && sqs.contains(token.location)) {
                    // console.log("Closing: [%s] [%s] [%s]", before, char, after)
                    if (!settings.singleQuotes) {
                        rejects.push(i);
                        continue;
                    }
                    token.resolved = true;
                    token.replacement = UNI_SINGLE_CLOSE;
                    token.spanStart = false;
                    token.spanEnd = true && settings.colorSingleQuotes;
                    token.spanForChar = true;
                    token.spanClassForChar = CLASS_CHAR_SQ_CLOSE;
                    token.opener = sqStack.pop();
                    token.opener.resolved = true;
                    token.opener.closer = token;
                    continue;
                }
                // console.log("Apostrophe[%s]: [%s] [%s] [%s]", !sqs.contains(token.location), before, char, after);
                if (!settings.apostrophes) {
                    rejects.push(i);
                    continue;
                }
                token.resolved = true;
                token.replacement = UNI_SINGLE_CLOSE;
                token.spanStart = false;
                token.spanEnd = false;
            }
        }
        // console.log(token.resolved ? "Resolved token." : "Failed to resolve token", token);
    }
    for (var i = 0; i < rejects.length; i++) {
        // console.log("Rejecting:", tokens[rejects[i]]);
        tokens.remove(tokens[rejects[i]]);
    }
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].resolved) {
            continue;
        }
        // console.log("Unresolved token:", tokens[i], GetContext(text, tokens[i].location, tokens[i].length, 8));
    }
};

export { FindRawText, FindTokens, ResolveTokens, FindTokensFaster };