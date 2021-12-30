import { ReplacementToken, TypographySettings } from "./types";
import { FindRawText, FindTokens, ResolveTokens } from "./text";

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

const PUNC_ATOMIC = -1;
const PUNC_OPENING = 0;
const PUNC_CLOSING = 1;

const UNI_SINGLE_OPEN = "\u2018";
const UNI_SINGLE_CLOSE = "\u2019";

const UNI_DOUBLE_OPEN = "\u201C";
const UNI_DOUBLE_CLOSE = "\u201D";

const UNI_HORIZ_ELLIPSIS = "\u2026";

const UNI_EN_DASH = "\u2013";
const UNI_EM_DASH = "\u2014";

const UNI_HAIRSPACE = "\u200A";

const SPAN_DOUBLE = '<span class="doubleQuote">';
const SPAN_SINGLE = '<span class="singleQuote">';
const SPAN_DOUBLE_RUNON = '<span class="doubleQuoteRunon">';
const SPAN_CLOSE = "</span>";

const FindSimpleApostrophes = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /((?<!\p{L}|\p{P})'(?=\d0s)(?!\d0s')|(?<=\p{L}|\d)'(?=\p{L}|\d)|(?<=\s)'(?=\s))/gmu;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const TransformSimpleApostrophes = (text: string): string => {
    // console.log ("Transforming simple apostrophes...");
    return text.replace(/((?<!\p{L}|\p{P})'(?=\d0s)(?!\d0s')|(?<=\p{L}|\d)'(?=\p{L}|\d)|(?<=\s)'(?=\s))/gmu, UNI_SINGLE_CLOSE);
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
    /*
    Before we start, we need to make sure we aren't matching other apostrophes that should
    have been transformed already, so we convert them to unicode close single quote before we
    run our new search.
    */
    // console.log("[%s]",text);
    text = TransformSimpleApostrophes(text);
    // console.log(">[%s]",text);
    let locations: number[] = [];

    // this will match most single quote blocks accurately
    let finder = /('[^\n\r"]*?\p{P}(?<!")')|('[\p{L}\p{N} ]*?')|('[^\n\r]*? ".*?" [^\n\r]*?\p{P}(?<!")')/mug;

    // console.log("Matching...")
    let match;
    while ((match = finder.exec(text)) !== null) {
        let matchText = text.slice(match.index, finder.lastIndex);
        //console.log ("Match found, [%s], @ %d%s%d, lastchar[%s]", matchText, match.index, UNI_EN_DASH, finder.lastIndex, matchText[matchText.length - 1]);
        locations.push(match.index);
        if (matchText[matchText.length - 1] == "'") { locations.push(finder.lastIndex - 1); };
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
    let finder = /(?<!&gt;|&lt;|<|>|-|\d)--(?!&gt;|&lt;|<|>|-|\d)/ug;
    let match;
    while ((match = finder.exec(text)) !== null) {
        locations.push(match.index);
    }
    return locations;
};

const FindEnDashesBetweenNumbers = (text: string): number[] => {
    let locations: number[] = [];
    let finder = /(?<=\d)--(?=\d)/ug;
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

const ProcessNode = (node: Node, offset: number, tokens: ReplacementToken[], settings: TypographySettings): number => {
    /*
        We need to have a means of passing the node tree back in case our span begins in the midst of a child element,
        but ends in a different one. We will need to relocate the subsequent elements into that span.
    */
    console.log("ProcessNode(%s, %d, %s)", node, offset, tokens);
    console.log('---');
    let tokenOffset = 0;
    for (var i = 0; i < node.childNodes.length && tokens.length > 0 && tokenOffset < tokens.length; i++) {
        let child = node.childNodes[i];
        // console.log ("Childnode[%d]: %s", i, child.nodeType);
        // console.log ("Offset is %d", offset);

        let ignore = ["pre", "code"];

        if (child.nodeType == child.ELEMENT_NODE && !ignore.contains(child.nodeName.toLowerCase())) {
            console.log("Processing child element(s)");
            offset = ProcessNode(child, offset, tokens, settings);
        } else if (child.nodeType == child.TEXT_NODE) {
            console.log("Processing text within [%s]", child.textContent);
            /*
                Now we actually get to do something.
                offset is our offset into the main rawText that was retrieved in ProcessElement.
                We are following that code here ignoring <pre> and <code> tags, so we should be safe to operate here
                on whatever text we find. The offset is so we know what index within this text we are to operate on.
                Once we have dealt with a token, we should remove it from the token list.
            */
            let token = tokens[tokenOffset];
            let adjustment = child.textContent.length;
            let pos = token.location - offset;
            while (pos <= adjustment && tokenOffset < tokens.length) {
                console.log("Full text range is %d -> %d", offset, offset + adjustment);
                console.log("Local text range is %d -> %d", 0, adjustment);
                console.log("Token location is %d within full text, %d within local text", token.location, pos);
                // while our position within the text is within this child textNode
                console.log(token, offset, child.textContent);
                if (token.resolved) {
                    // we only want to take action of the token is resolved
                    if (token.spanStart || token.spanEnd || token.spanForChar) {
                        // We want to stick to raw replacements for now. Anything requiring DOM manipulation can be bypassed
                        console.log("Bypassing span token.");
                        tokenOffset++;
                    } else {
                        let originalContent = child.textContent;
                        child.textContent = originalContent.slice(0, pos) + token.replacement + originalContent.slice(pos + token.length);
                        tokens.remove(token);
                    }
                } else {
                    console.log("Bypassing unresolved token.");
                    tokenOffset++;
                }
                token = tokens[tokenOffset];
                pos = token.location - offset;
                // console.log('---');
            }
            offset += adjustment;
        } else {
            //console.log ("Skipping node of type '%s': [%s]", type, child);
        }
    }
    // console.log("---");
    return offset;
};

const ProcessElement = (el: HTMLElement, settings: TypographySettings) => {
    let rawText = FindRawText(el);
    let tokens = FindTokens(rawText);
    if (tokens.length > 0) {
        console.log(rawText, tokens);
        ResolveTokens(rawText, tokens);
        //ProcessNode(el, 0, tokens, settings);
        let nodeStack: Node[] = [el];
        let spanStack: Node[] = [];
        let textOffset = 0;
        let tokenNum = 0;
        let endPoint = rawText.length;
        let ignoreTags = ["pre", "code"];
        let limit = 0;
        while (nodeStack.length > 0) {
            if (limit > 255) {
                console.log("Something went wrong!");
                break;
            }
            limit++;
            let currentNode = nodeStack.pop(); // grab the current node
            console.log("Obtained current node: ", currentNode);
            if (currentNode.nodeType == currentNode.ELEMENT_NODE) {
                console.log("It is an element.");
                // we can't do anything with an element node, we need to traverse its children until we find text nodes
                // but we want to ignore any content that might be in <pre> or <code> tags
                if (!ignoreTags.contains(currentNode.nodeName.toLowerCase())) {
                    if (currentNode.hasChildNodes()) {
                        console.log("It has children.");
                        nodeStack.push(currentNode); // put this element back onto the stack
                        nodeStack.push(currentNode.firstChild);
                        continue;
                    }
                    // if there are no child nodes, we do nothing and move on
                }
            } else if (currentNode.nodeType == currentNode.TEXT_NODE) {
                console.log("It is a text node.");
                let token = tokens[tokenNum];
                while (tokenNum < tokens.length && !token.resolved) {
                    console.log("Skipping token [%s]->[%s]@%d", token.original, token.replacement, token.location);
                    tokenNum++;
                    token = tokens[tokenNum];
                }
                let textLength = currentNode.textContent.length;
                console.log("Token %d/%d", tokenNum + 1, tokens.length);
                if (tokenNum < tokens.length) { console.log(token, token.location, textOffset, textLength, token.location - textOffset); }
                if (tokenNum < tokens.length && token.location >= textOffset && token.location - textOffset < textLength) {
                    // If token.location is > or equal to textOffset - textLength, then the token belongs in another text node
                    console.log("Token is in this node.");
                    console.log("Replacing [%s] in [%s] from %d to %d.", token.original, currentNode.textContent, token.location - textOffset, token.location - textOffset + token.length);
                    let splitLocation = token.location - textOffset;
                    let insert = token.replacement;
                    // once we do this, the "currentNode" is actually going to be any preceding content
                    // as such, we will likely want to move it to the next sibling manually
                    // obviously, if we are splitting things at the start of this node, we don't need to do
                    // this
                    let replacementNode = <Text>currentNode;
                    if (splitLocation != 0) {
                        let left = replacementNode; // currentNode;
                        replacementNode = <Text>currentNode.splitText(splitLocation);
                        console.log("Split [%s<-->%s]", left.textContent, replacementNode.textContent);
                    }
                    // we are now on our newly separated middle-ground.
                    // we need to break off the replacement character itself
                    // but only if our replacement actually moves beyond this node; if it ends it, we don't need anything more than this
                    if (replacementNode.textContent.length > token.length) {
                        let right = replacementNode.splitText(token.length);
                        console.log("Split [%s<-->%s]", replacementNode.textContent, right.textContent);
                    }
                    // set our replacement text
                    console.log("Replacing [%s] with [%s] content.", replacementNode.textContent, insert);
                    replacementNode.textContent = insert;
                    console.log("Compensating textOffset(%d)+%d = %d", textOffset, -token.lengthOffset, textOffset - token.lengthOffset);
                    textOffset -= token.lengthOffset;
                    /*
                        Now comes the fun part.
                        If we have a span for this character, we need to create a span with the appropriate style and replace this
                        childNode with the span. To do that, we need to obtain the childNode that corresponds to the Text node.

                    */

                    /*
                        Even more fun. Now, we get to see if we are ending a span or starting one. If we are starting one,
                        we need to create a span and insert the replacementNode and into the span, and add the span to
                        the spanStack. Reset current node appropriately.

                        We then need to add code that will plunk stuff into the span as appropriate as we move through
                        until we close a span.

                        If we are ending one, we pop the span stack, and move remainder (if any), outside of the span.
                    */

                    // once we've dealt with the token, we can move on to the next token
                    tokenNum++;
                } else {
                    /*  Because tokens are added as they occur in the text, they should all be in order of appearance.
                        As such, if the token is outside the current text node, we are safe to proceed to another text
                        node.
                    */
                    console.log("Nothing to do in this text node.");
                }
                console.log("Adjusting textOffset(%d)+%d = %d", textOffset, currentNode.textContent.length, textOffset + currentNode.textContent.length);
                textOffset += currentNode.textContent.length;
            }
            console.log("Moving to next sibling.");
            // we have done all we can do with the current situation
            // move on to the next sibling if there isn't one, otherwise
            // we will move out to the previous parent and continue from there
            // console.log(nodeStack);
            let sibling = currentNode.nextSibling;
            // console.log(sibling);
            if (sibling != null) {
                // if there is a sibling, add it to the stack
                nodeStack.push(sibling);
            } else {
                console.log("Sibling is null. Moving to next available ancestor's sibling.");
                let nextAncestor = nodeStack.pop();
                // console.log(nextAncestor);
                let maxLimit = 0;
                while (nextAncestor != el) { // we don't want to get our main element's sibling
                    // console.log(nodeStack);
                    if (maxLimit > 10) {
                        console.log("Something went wrong.");
                        break;
                    }
                    maxLimit++;
                    console.log("Obtained next ancestor. Testing siblings...");
                    nextAncestor = nextAncestor.nextSibling;
                    if (nextAncestor != null) {
                        console.log("Ancestor had sibling. Pushed.");
                        nodeStack.push(nextAncestor);
                        break;
                    } else {
                        console.log("Ancestor has no siblings. Obtained next ancestor.");
                        nextAncestor = nodeStack.pop();
                    }
                }
                if (maxLimit > 10) {
                    break;
                }
                console.log("Parent is parent element, no siblings accessible.");
            }
            // otherwise we will move on.
        }
    }
};

const Typography = (el: HTMLElement, settings: TypographySettings) => {
    // We need to run this on certain tags: h*, p, etc.
    for (var i = 1; i <= 6; i++) {
        var levelHeaders = Array.from(el.getElementsByTagName('h' + i));
        for (var j = 0; j < levelHeaders.length; j++) {
            ProcessElement(<HTMLElement>levelHeaders[j], settings);
        }
    }
    let elements: HTMLElement[] = [];
    elements = Array.from(el.getElementsByTagName('p'));
    for (var i = 0; i < elements.length; i++) {
        ProcessElement(<HTMLElement>elements[i], settings);
    }
    elements = Array.from(el.getElementsByTagName('li'));
    for (var i = 0; i < elements.length; i++) {
        ProcessElement(<HTMLElement>elements[i], settings);
    }

};
export { Typography as typography };