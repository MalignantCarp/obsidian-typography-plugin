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

const OPEN_DOUBLE_SPAN = '<span class="doubleQuote">';
const OPEN_SINGLE_SPAN = '<span class="singleQuote">';
const OPEN_DOUBLE_SPAN_RUNON = '<span class="doubleQuoteRunon">';
const OPEN_SINGLE_SPAN_RUNON = '<span class="singleQuoteRunon">';
const CLOSE_SPAN = "</span>";

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

const FindStyleableText = (el: Node, offset: number): [string, Map<[number, number], Node>] => {
    let styleableText: Map<[number, number], Node> = new Map<[number, number], Node>();
    let text = "";

    // console.log ("Node is ", el);
    for (var i = 0; i < el.childNodes.length; i++) {
        let child = el.childNodes[i];
        // console.log ("Childnode[%d]: %s", i, child.nodeType);
        // console.log ("Offset is %d", offset);

        let type = "";
        switch (child.nodeType) {
            case 1: type = "Element"; break;
            case 2: type = "Attribute"; break;
            case 3: type = "Text"; break;
            case 4: type = "CDATA"; break;
            case 7: type = "Processing Instruction"; break;
            case 8: type = "Comment"; break;
            case 9: type = "Document"; break;
            case 10: type = "DOCTYPE"; break;
            case 11: type = "DocumentFragment"; break;
            default: type = "Unknown"; break;
        }
        //console.log("Node is %s(<%s>)", type, child.nodeName);
        // console.log("Node value: ", child.nodeValue);

        let ignore = ["pre", "code"];

        if (type == "Element" && !ignore.contains(child.nodeName.toLowerCase())) {
            let newMap = FindStyleableText(child, offset);
            // console.log (newMap);
            if (newMap[1].size > 0) {
                let adjustment = newMap[0].length;
                // console.log("New content found in child(ren), adjusting offset from %d to %d", offset, offset+adjustment)
                styleableText = new Map([...styleableText, ...newMap[1]]);
                text += newMap[0];
                offset += adjustment;
            }
        } else if (type == "Text") {
            let content = child.nodeValue;
            let start = offset;
            let end = content.length + offset;
            // console.log("New content found, adjusting offset from %d to %d", offset, end);
            offset = end;
            styleableText.set([start, end], child);
            text += content;
        } else {
            //console.log ("Skipping node of type '%s': [%s]", type, child);
        }
    }
    return [text, styleableText];
};

const LocateTokens = (textContent: string): Map<number, [string, number, number, number, boolean]> => {
    let simpleApos = FindSimpleApostrophes(textContent);
    let singleQuotes = FindSingleQuotes(textContent);
    let doubleQuotes = FindDoubleQuotes(textContent);
    let remainingApos = FindRemainingApostrophes(textContent, singleQuotes);
    let ellipses = FindEllipses(textContent);
    let enDashes = FindEnDashes(textContent);
    let enDashesNum = FindEnDashesBetweenNumbers(textContent);
    let emDashes = FindEmDashes(textContent);

    let doubleIsOpen = false;
    let singleIsOpen = false;

    let replaceIt: Map<number, [string, number, number, number, boolean]> = new Map();
    // Our map is index, [replacement char(s), length of source, change in length, type, complete?]
    // type is oen of PUNC_ATOMIC, PUNC_OPENING, PUNC_CLOSING

    for (var i = 0; i < textContent.length; i++) {
        // Prepare easy mapping table
        if (simpleApos.contains(i) || remainingApos.contains(i)) {
            replaceIt.set(i, [UNI_SINGLE_CLOSE, 1, 0, PUNC_ATOMIC, false]); // same number of characters
        } else if (ellipses.contains(i)) {
            replaceIt.set(i, [UNI_HORIZ_ELLIPSIS, 3, -2, PUNC_ATOMIC, false]); // we lose 2 characters as we are replacing ... with the unicode equivalent, which is 1 char
        } else if (enDashes.contains(i)) {
            replaceIt.set(i, [UNI_EN_DASH, 2, -1, PUNC_ATOMIC, false]); // we are replacing -- with an en-dash, so 2 to 1, losing 1
        } else if (emDashes.contains(i)) {
            replaceIt.set(i, [UNI_EM_DASH, 3, -2, PUNC_ATOMIC, false]); // we are replacing --- with an em-dash, so 3 to 1, losing 2
        } else if (enDashesNum.contains(i)) {
            // This is a slightly unique situation; we are replacing -- with a hair space on either side of an en-dash, so 2 to 3, gaining 1
            replaceIt.set(i, [UNI_HAIRSPACE + UNI_EN_DASH + UNI_HAIRSPACE, 2, 1, PUNC_ATOMIC, false]);
        } else if (doubleQuotes.contains(i)) {
            // console.log(i, doubleIsOpen, doubleQuotes[doubleQuotes.length - 1]);
            if (doubleIsOpen) {
                replaceIt.set(i, [UNI_DOUBLE_CLOSE, 1, 0, PUNC_CLOSING, false]);
            } else {
                // if we are opening quotes and we are the last quote, we are not complete
                replaceIt.set(i, [UNI_DOUBLE_OPEN, 1, 0, PUNC_OPENING, !(i == doubleQuotes[doubleQuotes.length - 1])]);
            }
            doubleIsOpen = !doubleIsOpen;
        } else if (singleQuotes.contains(i)) {
            if (singleIsOpen) {
                replaceIt.set(i, [UNI_SINGLE_CLOSE, 1, 0, PUNC_CLOSING, false]);
            } else {
                replaceIt.set(i, [UNI_SINGLE_OPEN, 1, 0, PUNC_OPENING, true]);
            }
            singleIsOpen = !singleIsOpen;
        }

    }
    return replaceIt;
};

const Typography = (el: HTMLElement, settings: TypographySettings) => {
    // console.log("Parsing typography...");
    // console.log(el.innerHTML);
    let tup = FindStyleableText(el, 0);
    let textContent = tup[0];
    let nodeMap = tup[1];
    /*     console.log("Validating  text content map...");
        for (const keyPair of nodeMap.keys()) {
            let start = keyPair[0];
            let end = keyPair[1];
            let textSlice = textContent.slice(start,end);
            console.log(textSlice);
            console.log(nodeMap.get(keyPair).textContent);
            console.log (textSlice == nodeMap.get(keyPair).textContent);
        }
     */

    let replacementMap = LocateTokens(textContent);
    let styleMap: Map<number, [string, number, boolean]> = new Map();
    /*

    We now know where everything is. We will now step through each entry in the replacement map
    and make the required adjustments, then remap that data into the styleMap based on the offset
    adjustments provided in the token replacement map.

    Because everything is based on the full text content of all of the nodes, the index we retrieve
    for start and end within the map is for the whole text content. In order to translate to the
    text node's content, we must subtract the start index from it.

    Further, we must set an offset within the node to account for fluctuation due to changing text content
    for things like the dashes and ellipses, as these change the length of the string.

    */
    let totalLength = 0;
    if (nodeMap.size > 0) { // if there's nothing there, bypass
        let mapIter = nodeMap.keys();
        let textRange = mapIter.next().value;
        let start = textRange[0];
        let end = textRange[1];
        let textNode = nodeMap.get(textRange);
        let offset = 0;
        totalLength = textNode.textContent.length;
        console.log(replacementMap);
        for (const [index, replacementTuple] of replacementMap) {
            let token = replacementTuple[0];
            let tokenLength = replacementTuple[1];
            let lengthChange = replacementTuple[2];
            let opening = replacementTuple[3];
            let complete = replacementTuple[4];
            let originalContent = textNode.textContent;
            styleMap.set(index + lengthChange, [token, opening, complete]);
            // console.log("@Index(%d), Range(%d-%d), Text = [%s]", index, start, end, originalContent);
            while (index >= end) {
                // console.log("Moving to next node...");
                textRange = mapIter.next().value;
                start = textRange[0];
                end = textRange[1];
                textNode = nodeMap.get(textRange);
                originalContent = textNode.textContent;
                totalLength += originalContent.length + offset;
                // console.log("@Index(%d), Range(%d-%d), Text = [%s]", index, start, end, originalContent);
                // reset offset
                offset = 0;
            }
            let modChar = index - start + offset;
            // console.log("Starting at %s for %s characters, for token [%s]", modChar, tokenLength, token);
            // console.log("[%s]\n[%s]-->[%s]\n[%s]", originalContent.slice(0, modChar), originalContent.slice(modChar, modChar + tokenLength), token, originalContent.slice(modChar + tokenLength));
            textNode.textContent = originalContent.slice(0, modChar) + token + originalContent.slice(modChar + tokenLength);
            // console.log("==>[%s]", textNode.textContent);
            offset += lengthChange;
        }
    }
    if (styleMap.size > 0) { // if we have any style information
        if (settings.colorDoubleQuotes || settings.colorMismatchedDoubleQuotes || settings.colorSingleQuotes) {
            // we won't bother doing any of this stuff if we don't have to
            let mapIter = nodeMap.keys();
            let textRange = mapIter.next().value;
            let start = textRange[0];
            let end = textRange[1];
            let textNode = nodeMap.get(textRange);
            let offset = 0;
            let singleQuoteLocations: [number, number][] = [];
            let doubleQuoteLocations: [number, number][] = [];
            let runOnLocations: [number, number][] = []; // this should run from start of quote to end of block; should only have one runOn
            var singleLoc: [number, number];
            var doubleLoc: [number, number];
            var runOn: [number, number];
            // console.log(styleMap);
            for (const [index, styleTuple] of styleMap) {
                let token = styleTuple[0];
                let puncType = styleTuple[1];
                let complete = styleTuple[2];
                // console.log("@Index(%d), Range(%d-%d), Text = [%s]", index, start, end, originalContent);
                while (index >= end) {
                    // console.log("Moving to next node...");
                    textRange = mapIter.next().value;
                    start = textRange[0];
                    end = textRange[1];
                    textNode = nodeMap.get(textRange);
                    // console.log("@Index(%d), Range(%d-%d), Text = [%s]", index, start, end, originalContent);
                    // reset offset
                    offset = 0;
                }
                let doubles = [UNI_DOUBLE_OPEN, UNI_DOUBLE_CLOSE];
                let singles = [UNI_SINGLE_OPEN, UNI_SINGLE_CLOSE];
                // console.log(token, puncType, complete, doubleLoc, singleLoc, runOn);
                if (settings.colorDoubleQuotes && doubles.contains(token) && puncType == PUNC_OPENING && (complete || !settings.colorMismatchedDoubleQuotes)) {
                    // we need to create a span around the start of the block with the opening double quote if it is complete or if we are not
                    // styling mismatched double quotes differently
                    doubleLoc = [index, -1];
                    // console.log("Double=", doubleLoc);
                } else if (settings.colorMismatchedDoubleQuotes && doubles.contains(token) && puncType == PUNC_OPENING && !complete) {
                    // we need to create a span around the start of the block with the opening double quote that doesn't terminate
                    runOn = [index, totalLength] // there should technically be only one of these
                    // console.log("Runon=", runOn);
                    runOnLocations.push(runOn);
                } else if ((settings.colorDoubleQuotes) && doubles.contains(token) && puncType == PUNC_CLOSING) {
                    // close the span
                    doubleLoc[1] = index;
                    // console.log("Double=>", doubleLoc);
                    doubleQuoteLocations.push(doubleLoc);
                    doubleLoc = [null, null];
                } else if (settings.colorSingleQuotes && singles.contains(token) && puncType == PUNC_OPENING) {
                    // open the span
                    singleLoc = [index, -1];
                    // console.log("Single=", singleLoc);
                } else if (settings.colorSingleQuotes && singles.contains(token) && puncType == PUNC_CLOSING) {
                    // close the span
                    if (singleLoc) {
                        singleLoc[1] = index;
                        singleQuoteLocations.push(singleLoc);
                        // console.log ("Single=>", singleLoc)
                    }
                    singleLoc = [null, null];
                }
            }
            // console.log("DQ", doubleQuoteLocations);
            // console.log("SQ", singleQuoteLocations);
            // console.log("RO", runOnLocations);

            /*
                All that remains now is running through the entire node tree and replacing the text locations that
                contain the single and double quote and runon blocks with spans surrounding them. Probably easiest
                to first determine if all of the text blocks are under the same parent. If that is the case,
                the job is easier, especially if there are no non-text blocks in between. This really only gets
                complicated when there are tags of any kind other than <em> <bold> <strong> <i> etc. that cross
                over, so we will want to generate some test modeling with things like [**"This is a** test."] to
                ensure that we are properly handling that.
            */
        }
        
    }
};

export { Typography as typography };