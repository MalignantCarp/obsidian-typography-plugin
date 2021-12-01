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
*/

/* Simple apostrophe: \b'\b

Replaces any instance of letter characters separated by a single tick.

*/
const SimpleApo = (text:string = ''):string => {
    let results = text.replace(/\b'\b/ug, '\u2019')
    //console.log('Transform(', text, ')=>', results)
    return results;
}

/* Era apostrophe, matches things like '80s and '90s wherever they occur:
Only matches when a non-letter precedes the single tick to avoid possible issues with odd sci-fi names doob'00s.

/\B'(\d0s)/
*/

const EraApo = (text:string = ''):string => {
    let results = text.replace(/\B'(\d0s)/ug, '\u2019$1')
    //console.log('Transform(', text, ')=>', results)
    return results;
}

/* Full enclosing double quotes are easy: /"(.*?)"/ug
*/
const DoubleQuotes = (text:string = '', style:boolean = false):string => {
    let start = '';
    let end = '';
    if (style) {
        let start = '<span class="doubleQuote">';
        let end = '</span>';
    }
    let results = text.replace(/"(.*?)"/ug, start + '\u201C' + "$1" + '\u201D' + end);
    return results;
}

// Once all other double quotes are done, we're left with the opening ones that don't end.
const DoubleQuotesUnclosed = (text:string = '', style:boolean = false):string => {
    let start = '';
    let end = '';
    if (style) {
        let start = '<span class="doubleQuoteRunon">';
        let end = '</span>';
    }

    let results = text.replace('"', start + '\u201C' + end);
    return results;
}

/*
There are a few expressions where we are likely to get correct single quotes.
/'(\w+)'/ug - single word encapsulation
/^'(.*?)'$/ - whole paragraph encapsulation, no other ticks
/\B'\b(.*?)\b'/ug - this should match most legitimate cases, but can return false positives
*/
const SingleQuotes = (text:string = '', style:boolean = false):string => {

    let start = '';
    let end = '';
    if (style) {
        let start = '<span class="singleQuote">';
        let end = '</span>';
    }
    text = text.replace(/'(\w+)'/ug, start + '\u2018$1\u2019' + end);
    text = text.replace(/^'(.*?)'$/, start + '\u2018$1\u2019' + end)
    let results = text.replace(/\B'\b(.*?)\b'/ug, start + '\u2018$1\u2019' + end)
    return results;
}

function parseHTML(html:string) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content;
}

const Transform = (text:string, settings:TypographySettings) => {
    console.log ("Input line: ", text, "<EOI>")
    //if (settings.apostrophes) {
        text = SimpleApo(text);
        text = EraApo(text);
    //}
    //if (settings.doubleQuotes) {
        text = DoubleQuotes(text, settings.colorDoubleQuotes);
        text = DoubleQuotesUnclosed(text, settings.colorMismatchedDoubleQuotes);
    //}
    //if (settings.singleQuotes) {
        text = SingleQuotes(text, settings.colorSingleQuotes);
    //}
    text = text.replace("'", '\u2019')
    text = text.replace(/(\s|\w|\p{P})---(\s|\w|\p{P})/ug, '$1\u2014$2') // em-dashes
    text = text.replace(/(\s|\w|\p{P})--(\s|\w|\p{P})/ug, '$1\u2013$2') // en-dashes
    text = text.replace(/\.\.\./ug, '\u2026')
    let results = text;
    console.log ("Transformation:", results, "<EOR>")
    return results;
}

const TraverseNodes = (node:ChildNode, settings:TypographySettings, recurse:boolean) => {
    if (recurse && node.childNodes.length > 1) {
        TraverseNodes(node, settings, true);
    }
    if (node.nodeType == 3) {
        console.log ("Transforming text node: ", node.textContent)
        node.replaceWith (Transform(node.textContent, settings))
        console.log ("Transformed to: ", node.textContent)
    }
}

const Traverse = (el:Element, settings:TypographySettings) => {
    let isContainerElement = false;

    console.log ("Element is ", el.tagName);
    if (el.tagName.match(/(H1|H2|H3|H4|H5|H6)/)) {
        /* if we have a heading, we may not be able to directly access the HTML
        element for that heading as it has a bunch of junk from the SVG folds
        */
        let nodes = el.childNodes;
        console.log ("Traversing nodes...")
        for (var i = 0; i < nodes.length; i++) {
            TraverseNodes (nodes[i], settings, true);
            console.log ("Element is ", el.tagName);
            console.log(nodes[i]);
            console.log("Children:")
            console.log(nodes[i].childNodes)
        }
        console.log ("Done traversing nodes.")
    }
    // we only care about elements that can contain text
    if (el.tagName.match(/(DIV|P|SPAN|EM|STRONG|A|H1|H2|H3|H4|H5|H6|UL|OL|LI)/)) { 
        console.log ("Element is a text container.")
        isContainerElement = true;
    }
    // if there are child elements, we need to dig to the bottom
    if (el.children.length > 0) {
        console.log ("Element has ", el.children.length, " children. Traversing...");
        var children = el.children;
        for (var i = 0; i < children.length; i++) {
            Traverse(children[i], settings);
        }
        if (isContainerElement) {
            var childNodes = el.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                TraverseNodes(childNodes[i], settings, false);
            }
        }
        console.log ("Done traversing children.");
    } else {
    // if we don't have children, we're probably fine to transform the text as is
        console.log ("Element is atomic. Transforming text.")
        console.log ("Element inner text: `", el.innerText, "'")
        console.log ("Element inner HTML: `", el.innerHTML, "'")
        console.log ("Done element ", el.tagName);
        el.innerHTML = Transform(el.innerHTML, settings)
    }
}

const Typography = (el:HTMLElement, settings:TypographySettings) => {
    console.log(el.childNodes)
    Traverse(el, settings);
    /*
    console.log ("Input line: ", text, "<EOI>")
    text = SimpleApo(text);
    text = EraApo(text);
    text  = DoubleQuotes(text);
    text = DoubleQuotesUnclosed(text);
    let results = text;
    console.log ("Transformation:", results, "<EOR>")
    return results;
    */
}

export { Typography as typography};