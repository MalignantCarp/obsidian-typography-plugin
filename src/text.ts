import { ReplacementToken } from "./types";

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

const CLASS_SEQ_DOUBLE = "doubleQuote";
const CLASS_SEQ_DOUBLE_RUN = "doubleQuoteRunon";
const CLASS_SEQ_SINGLE = "singleQuote";

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

const FindTokens = (text: string): ReplacementToken[] => {
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
    console.log("[%s]", text);
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
            if (sequence == '...') {
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
            } else if (sequence == '---') {
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
            } else { // obviously it's '--'
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
            if (char == '"' && !escaped) {
                let isClosing = dqStack.length == 1; // If there is a double quote on the stack, we are closing that quotation.
                let token: ReplacementToken = {
                    location: i,
                    resolved: isClosing, // if we are closing, we know that we are
                    length: 1,
                    lengthOffset: 0,
                    original: '"',
                    replacement: isClosing ? UNI_DOUBLE_CLOSE : UNI_DOUBLE_OPEN,
                    spanStart: !isClosing,
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
        token.spanClass = CLASS_SEQ_DOUBLE_RUN;
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

const ResolveTokens = (text: string, tokens: ReplacementToken[]) => {
    /*  This method proceeds through the list of tokens and resolves them by utilizing context
        retrieved using GetContext() based on the ReplacementToken's location. It is only run
        when the ReplacementToken.resolved == false

        Anything that we determine is not appropriate, such as -- or --- following or followed
        by &gt; or &lt; can be added to rejects, which will be removed from the list
    */
    let rejects: number[] = [];
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
                // opening or closing quote

                if ((IsLetter(charBefore) && IsLetter(charAfter))
                    || (IsNumber(charBefore) && IsNumber(charAfter))
                    || (/\s/.test(charBefore) && /\s/.test(charAfter))
                    || ((!/\p{L}|\p{P}/.test(charBefore) || charBefore == "" || /\s/.test(charBefore)) && /(?=\d\ds?)(?!\d\ds?')/gum.test(after))) {
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

                    Finding single quotes is rather troublesome. The best regex was as follows by highest to lowest specificity:

                    /('[^\n\r"]*?\p{P}(?<!")')|('[\p{L}\p{N} ]*?')|('[^\n\r]*? ".*?" [^\n\r]*?\p{P}(?<!")')/mug;

                    The first group is ('[^\n\r"]*?\p{P}(?<!")').
                    The rule is thus: Match any text between dumb apos that:
                    Is 0 or more non-newline non-quote characters followed by a punctuation mark that is not a double quote

                    The second group is ('[\p{L}\p{N} ]*?'). It could probably be extended to ('[\p{L}\p{N} -]*?')
                    The rule is thus: Match any text between dumb apos that:
                    Is a letter, number, or space. (We could add hyphens as well, technically.)

                    The third group is ('[^\n\r]*? ".*?" [^\n\r]*?\p{P}(?<!")')
                    The rule is thus: Match any text between dumb apos that:
                    Begins with one or more non-newline characters followed by a space,
                    followed by a statement in double quotes (the statement can contain anything),
                    followed by a space, then a non-newline character, then punctuation that is not a double quote.

                    This will require an enormous amount of context around the statements to adequately determine that they
                    have matched these rules. It is probably best to integrate somewhere that we just runs the regex tests no the text
                    and test for them in here, rather than trying to scan the text to and fro.

                    But let's do the thinking experiment.

                    So first we could check: if there is a space or nothing before and a number after, we're probably an
                    opening quote. The logic behind this is that we've already made apostrophes out of everything that
                    would otherwise be before a digit, thus it stands to reason that if there is a number preceded by
                    a dumb apo, it is probably an opening single quote.

                    If we have an opening quote, we probably have a closing quote, but there's no proper logical check for that.

                    A single quote that immediately follows punctuation that is not a double quote is pretty much guaranteed to be
                    a closing quote.

                    If it's at the end of a line, it is a closing quote.

                    So let's break down where and when each can or cannot occur so we can determine some logical statements:

                    Open Single Quote:
                    - Cannot be followed by whitespace of any kind. (It will always start a statement.)
                    - Cannot end a line.
                    - Can start a line (useless, as an apostrophe can as well)
                    - Cannot follow terminal punctuation (e.g., .,?!) or closing punctuation
                    - Cannot follow an open single quote
                    - Can follow a space (but so can an apostrophe, so useless)

                    Close Single Quote:
                    - Can end a line.
                    - Can start a line (useless)
                    - Can follow terminal punctuation
                    - Cannot follow a space (but an apostrophe can, so useless)
                    - Cannot be followed immediately by a non-space, non-punctuation character
                        - This would be either an apostrophe or a single open quote
                        - If this follows another dumb apo, then this is an apostrophe not a closing single quote
                    - Will follow a number if also followed by whitespace

                    
                    Basic logic from the above:
                     - If there is no context after, we have a closing quote.
                     - If terminal punctuation or closing punctuation is immediately before, we have a closing quote.
                     - If there is a dumb apo before and a non-space, non-punctuation character after, it is an apostrophe.
                     - If there is a dumb apo before and a space after, it is a closing single quote.
                     - If there is a dumb apo after but not before, it is an opening single quote.
                     - If there is a number after, this is an open single quote
                        - Remember we will have already resolved an entry in the form of '90s or '96, so this is not that.
                     - If there is a number before and a space after, this is a closing single quote


                    None of this logic helps us with 'n' - technically, this can be indicating the letter N, or it could be 
                    a contraction of the word and, with both a and d ommitted. In the first case, it would be an open first
                    and a close second, in the second case, it would be both apostrophes.

                */
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

export { FindRawText, FindTokens, ResolveTokens };