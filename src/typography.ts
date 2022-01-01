import { ReplacementToken, TypographySettings } from "./types";
import { CLASS_SEQ_DOUBLE, CLASS_SEQ_DOUBLE_RUN, CLASS_SEQ_SINGLE, FindRawText, FindTokens, FindTokensFaster, ResolveTokens } from "./text";

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

const ProcessElement = (el: HTMLElement, settings: TypographySettings) => {
    let rawText = FindRawText(el);

    /*
        Unit testing here shows the new routine using the old regex is at least 100% faster (and as much as 1000% faster than the character-by-character)
        variant, so we will utilize it.
    
        let times = 1024;
    
        let FTST = Date.now();
    
        let FTTokens = FindTokens(rawText, settings);
        for (var i = 0; i < times; i++) {
            FindTokens(rawText);
        }
    
        let FTET = Date.now();
    
        let FTFST = Date.now();
        let FTFTokens = FindTokensFaster(rawText, settings);
        for (var i = 0; i < times; i++) {
            FindTokensFaster(rawText);
        }
        let FTFET = Date.now();
    
        console.log(FTTokens, FTFTokens)
        console.log("FindTokens() found %s tokens x %s in %d seconds (%d/tokens per second)", FTTokens.length, times, FTET - FTST, (FTTokens.length * times) / (FTET - FTST));
        console.log("FindTokensFaster() found %s tokens x %s in %d seconds (%d/tokens per second)", FTFTokens.length, times, FTFET - FTFST, (FTFTokens.length * times) / (FTFET - FTFST));
        return;
     */
    let tokens = FindTokensFaster(rawText, settings);
    // console.log("%d token(s)", tokens.length);
    if (tokens.length > 0) {
        // console.log(rawText, tokens);
        ResolveTokens(rawText, tokens, settings);
        //ProcessNode(el, 0, tokens, settings);
        let spanStack: HTMLElement[] = [];
        let textOffset = 0;
        let tokenNum = 0;
        let ignoreTags = ["pre", "code"];
        let limit = 0;
        let currentNode: Node = el;
        while (currentNode != null) {
            if (limit > 255) {
                // There shouldn't be any recursion issues, but I am leaving these is.
                console.log("Obsidian Typography: Maximum recursion limit reached for ProcessElement()");
                break;
            }
            limit++;
            // console.log("Obtained current node: [%s]", currentNode.outerHTML || currentNode.textContent);
            if (currentNode.nodeType == currentNode.ELEMENT_NODE) {
                // console.log("It is an element (<%s>).", currentNode.nodeName);
                // we can't do anything with an element node, we need to traverse its children until we find text nodes
                // but we want to ignore any content that might be in <pre> or <code> tags
                if (!ignoreTags.contains(currentNode.nodeName.toLowerCase())) {
                    if (currentNode.hasChildNodes()) {
                        // console.log("It has children.");
                        currentNode = currentNode.firstChild;
                        continue;
                    }
                    // if there are no child nodes, we do nothing and move on
                }
            } else if (currentNode.nodeType == currentNode.TEXT_NODE) {
                // console.log("It is a text node.");
                let token = tokens[tokenNum];
                while (tokenNum < tokens.length && !token.resolved) {
                    // console.log("Skipping token [%s]->[%s]@%d", token.original, token.replacement, token.location);
                    tokenNum++;
                    token = tokens[tokenNum];
                }
                let textLength = currentNode.textContent.length;

                if (tokenNum < tokens.length) {
                    // console.log("Token %d/%d", tokenNum + 1, tokens.length);
                    // console.log("Token [%s]@%d - %d = %d for %d", token, token.location, textOffset, token.location - textOffset, textLength);
                }
                if (tokenNum < tokens.length && token.location >= textOffset && token.location - textOffset < textLength) {
                    // If token.location is > or equal to textOffset - textLength, then the token belongs in another text node
                    // console.log("Token is in this node.");
                    // console.log("Replacing [%s] in [%s] from %d to %d.", token.original, currentNode.textContent, token.location - textOffset, token.location - textOffset + token.length);

                    let splitLocation = token.location - textOffset;
                    let insert = token.replacement;

                    let replacementNode = <Text>currentNode;
                    let rNode = currentNode;

                    // console.log("Replacement node acquired: [%s]", replacementNode.textContent);
                    if (splitLocation != 0) {
                        replacementNode = replacementNode.splitText(splitLocation); // this now starts with our token
                        // console.log("Replacement node split at %d: %s", splitLocation, replacementNode);
                        // console.log("Split [%s<-->%s]", left.textContent, replacementNode.textContent);
                    }
                    // we are now on our newly separated middle-ground.
                    // we need to break off the replacement character itself
                    // but only if our replacement actually moves beyond this node; if it ends it, we don't need anything more than this
                    if (replacementNode.textContent.length > token.length) {
                        replacementNode.splitText(token.length); // split off remainder
                        // console.log("Replacement node split at %d: %s", token.length, replacementNode);
                        // console.log("Split [%s<-->%s]", replacementNode.textContent, right.textContent);
                    }
                    rNode = replacementNode; // need a non-TextNode reference for later
                    // set our replacement text
                    // console.log("Replacing [%s] with [%s] content.", replacementNode.textContent, insert);
                    /*
                        If we have a span for this character, we need to create a span with the appropriate style and replace this
                        childNode with the span.
                    */
                    if (token.spanForChar) {
                        let span = document.createElement("span");
                        span.className = token.spanClassForChar;
                        span.appendChild(document.createTextNode(insert));
                        // console.log("Span created in place of text node.");
                        replacementNode.replaceWith(span);
                        rNode = span; // our new rNode reference must be the span containing the text
                        // console.log(span.outerHTML);
                        //console.log(span, span.parentNode, span.parentElement);
                        if (splitLocation == 0) {
                            // our "current node" is the replacement node, so we need it to be amended to the span as well
                            currentNode = span;
                        }
                    } else {
                        // console.log("Replaced textContent of replacementNode with [%s]", insert);
                        replacementNode.textContent = insert;
                    }
                    // console.log("Compensating textOffset(%d)+%d = %d", textOffset, -token.lengthOffset, textOffset - token.lengthOffset);
                    textOffset -= token.lengthOffset;

                    if (spanStack.length > 0) {
                        // we need to move stuff into the span
                        // console.log("We have open spans.");
                        let span = spanStack[spanStack.length - 1];
                        // console.log(span.outerHTML);
                        // console.log("Adding current node to span: %s", currentNode.textContent);
                        // console.log(span.outerHTML);
                        span.appendChild(currentNode);
                        // console.log("-->", span.outerHTML);
                    }

                    if (token.spanEnd && spanStack.length > 0) {
                        // console.log("Popping span off stack");
                        let span = spanStack.pop();
                        // console.log(span.outerHTML);
                        // The span ends after and including our replacement, so the current node, with preceding content, and our
                        // replacement node (if different) needs to be added to the span
                        if (rNode != currentNode) {
                            span.appendChild(rNode);
                            // console.log("Added replacement node to span.");
                            // console.log("-->", span.outerHTML);
                        }
                    }

                    if (token.spanStart) {
                        // if our span starts, create it, set its class, push it onto the stack
                        // console.log("Opening new span.");
                        let span = document.createElement("span");
                        span.className = token.spanClass;
                        // console.log(el.innerHTML);
                        if (rNode == currentNode) {
                            // console.log("Replacement node is current node, inserting span before current node.");
                            currentNode.parentNode.insertBefore(span, currentNode);
                        } else {
                            // console.log("Replacement node is after current node, inserting span before replacement node.");
                            rNode.parentNode.insertBefore(span, rNode);
                        }
                        // console.log(el.innerHTML);
                        // console.log("Pushing span.");
                        if (spanStack.length > 0) {
                            // if we are currently in a span, then this span needs to be added into the previous span
                            spanStack[spanStack.length - 1].appendChild(span);
                        }
                        spanStack.push(span);
                        span.appendChild(rNode);
                    }
                    tokenNum++;
                } else {
                    // console.log("No replacements for this text node.");
                    if (spanStack.length > 0) {
                        let span = spanStack[spanStack.length - 1];
                        // we need to move stuff into the span
                        // console.log("But we have open spans. Checking to see if currentNode is in span or not.");
                        if (!span.contains(currentNode)) {
                            // console.log("Inserting current node into span.");
                            // console.log(span.outerHTML);
                            if (currentNode.parentNode.childNodes.length == 1) {
                                span.appendChild(currentNode.parentNode);
                            } else {
                                span.appendChild(currentNode);
                            }
                            // console.log("-->", span.outerHTML);
                        }
                    }

                }
                // console.log("Adjusting textOffset(%d)+%d = %d", textOffset, currentNode.textContent.length, textOffset + currentNode.textContent.length);
                textOffset += currentNode.textContent.length;
                // if (spanStack.length > 0) {
                //     currentNode = spanStack[spanStack.length - 1];
                // }
            }
            // console.log("Current node is [%s]", currentNode.outerHTML || currentNode.textContent, "Moving to next sibling.");
            // console.log("Main element is [%s]", el.outerHTML || el.textContent);
            // we have done all we can do with the current situation
            // move on to the next sibling if there isn't one, otherwise
            // we will move out to the previous parent and continue from there
            // console.log(nodeStack);
            let sibling = currentNode.nextSibling;
            // console.log(sibling);
            if (sibling != null) {
                currentNode = sibling;
            } else {
                currentNode = currentNode.parentNode;
                // console.log("Sibling is null. Obtained next parent [%s]", currentNode.outerHTML || currentNode.textContent, "Testing for siblings.");
                if (currentNode == el) {
                    // console.log("Parent is top element. Done.");
                    currentNode = null;
                    break;
                }
                let sibling: Node = currentNode.nextSibling;
                let maxLimit = 0;
                if (sibling != null) {
                    // console.log("Ancestor had sibling [%s]", sibling.outerHTML || sibling.textContent);
                    currentNode = sibling;
                } else {
                    while (currentNode != el && sibling == null) { // we don't want to get our main element's sibling
                        if (maxLimit > 32) {
                            console.log("Obsidian Typography: Maximum recursion limit reached in ProcessElement() while finding next node.");
                            break;
                        }
                        maxLimit++;
                        currentNode = currentNode.parentNode;
                        if (currentNode == null) {
                            break;
                        }
                        // console.log("Sibling is null. Obtained next parent [%s]", currentNode.outerHTML || currentNode.textContent, "Testing for siblings.");
                        sibling = currentNode.nextSibling;
                        if (sibling != null) {
                            // console.log("Ancestor had sibling [%s]", sibling.outerHTML || sibling.textContent);
                            currentNode = sibling;
                            break;
                        } else {
                            // console.log("Ancestor has no siblings.");
                        }
                    }
                    if (maxLimit > 32) {
                        break;
                    }
                    if (currentNode == el) {
                        // console.log("Parent is parent element, no siblings accessible.");
                        currentNode = null;
                    }
                }
            }
            // otherwise we will move on.
        }
        el.normalize();
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