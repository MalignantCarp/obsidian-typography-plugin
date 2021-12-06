const FindSingleQuotes = (text: string): number[] => {
    /*
    Before we start, we need to make sure we aren't matching other apostrophes that should
    have been transformed already, so we convert them to unicode close single quote before we
    run our new search.
    */
    // console.log("[%s]",text);
    // text = TransformSimpleApostrophes(text);
    // console.log(">[%s]",text);
    let locations: number[] = [];

/*
    
    Working on a new algorithm. The following will match only closing single quotes. Not all of them, but most:
    
    /('(?= )|'$|(?<=\p{P})'(?=\p{P}))/gmu
    
    And this does open quotes:
    /('(?=(?:\p{L}|\u2019| )*?')|'(?=.*?\p{P}'))/gmu
    
    Again, not all of them, but most. It does fall for 'twas if it is inside quotation marks.
    Probably an idea to parse things in quotation marks individually.
    
        let closeFinder = /('(?= )|'$|(?<=\p{P})'(?=\p{P}))/gmu;
        let openFinder = /(?:^|(?<=\s))'(?=(?:\p{L}|\u2019)*?')|(?:^|(?<=\s))'(?=.*?\p{P}')/gmu;
        let blockFinder = /(('\w+')|(^|(?<=\p{P}\s))('.*?\p{P}')($|(?=\s))|((?<=\s)'[^\.\n]*')|(^|(?<=\p{P}\s))('.*?\p{P})$)/ug;
    
    
    The new algorithm has no way of termining if something is an opening quote without something that follows giving it a clue.
    
    As such, combining the results of the two algorithms may allow us to make the determination. We will need to walk through
    the original results, basically filtering out closing/opening based on the two separate lists from the above regexes.
    That will probably yield the best result.
    
    Still need to find an adequate way to match opening single quotes. If I can find a way that catches all legitimate
    open quotes, then the remainders can be caught by the Final Apostrophes.
    
    --------------
    
    So our biggest issue is nesting of quotation marks, parentheses, backets, and braces. That is our biggest issue with parsing
    this text. We are going to have to iterate over the entire string recursively processing based on where we find what.
    
    The simple rules:
    
    An opening single quote may:
    * Be found at the start of the line
    * Follow whitespace
    * Follow opening nesting characters (e.g., parentheses, brackets, braces, chevrons, double quotes)
    
    An opening single quote may NOT:
    * Follow a letter
    * Follow a sentence separator
    * Be at the end of a line
    
    A closing single quote may:
    * Be found at the start of a line
    * Be found after a sentence separator (at the end of a line or followed by a space)
    * Be found at the end of a line
    * Be found preceding a letter or other word character (including digits)
    
    A closing single quote may NOT:
    * ?
    
    */

    let openers: number[] = [];
    let closers: number[] = [];
    let stack: string[] = [""];


    // we're going to have trouble keeping track of nests if we need to watch out for these
    text = text.replace("&gt;", ">");
    text = text.replace("&lt;", "<");

    let nestStarts = '"([{<';
    let nestEnds = '")]}>';
    let chevrons = "<>";

    let separators = ",.?!";

    let wordChar = /[\p{L}\p{N}]/gum;

    // I think short of some kind of language tool that can determine what is a sentence, what is a phrase, etc.,
    // we're not really going to have a heck of a lot of luck here, but we'll try.

    let lastChar = "";
    // we need to increment offset each time we reach a chevron (< or >)  by 3 to make up for having converted
    // the HTML entities into the literal character.
    let offset = 0;
    for (var i = 0; i < text.length; i++) {
        let char = text[i];
        let nextChar = "";
        if (i + 1 < text.length) {
            nextChar = text[i + 1];
        }
        let startOfLine = (lastChar == "" || lastChar == "\n");
        let endOfLine = (text.length == (i + 1) || nextChar == "\n");

        // we only need to do something if we have a nest character or if we have an apostrophe
        let currentNest = null || stack[stack.length - 1];
        console.log(stack);
        console.log(currentNest);
        let closeChar = "";
        if (currentNest) {
            closeChar = nestEnds[nestStarts.indexOf(currentNest)];
        }
        console.log("closeChar = [%s]");
        if (char == closeChar) {
            console.log("Popped: ", stack.pop());
        } else if (nestStarts.contains(char)) {
            console.log("Pushed:", char);
            stack.push(char);
        } else if (nestEnds.contains(char)) {
            console.log("Closing nest char [%s] but that is not current nest char [%s]", char, nestEnds[nestEnds.length - 1]);
        } else if (char == "'") {
            /* this is the hard part
            We need to essentially emulate these rules:

            ('[^\n\r"*?\p{P}')|('[\p{L}\p{N} ]+')


            ('[\p{L}\p{N}]+(?: ".*?" )?(?:[\p{L}\p{N}]+)?')|('[^\n\r"]*?\p{P}')|('[\p{L}\p{N} ]+')

            So broken down, we are capturing the start and end point of two things:

            The second rule is simpler, so lets do that first:

            If we find an opening quote, we track it as a nest. We then proceed and so long as we don't hit any other
            single quotes and only run into letters, numbers, and spaces, we likely will have uncovered 

            */
            if (separators.contains(lastChar)) {
                closers.push(i+offset);
                console.log("Found closing single quote")
            }
        }
        lastChar = char;
        if (chevrons.contains(char)) {
            offset += 3;
        }
    }

    return locations;
}