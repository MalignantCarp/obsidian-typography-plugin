export interface TypographySettings {
    dashes: boolean;
    singleQuotes: boolean;
    doubleQuotes: boolean;
    apostrophes: boolean;
    ellipses: boolean;
    colorDoubleQuotes: boolean;
    colorMismatchedDoubleQuotes: boolean;
    colorSingleQuotes: boolean;
//    colorMismatchedSingleQuotes: boolean;
}

export interface ReplacementToken {
    location: number;
    resolved: boolean;
    length: number;
    lengthOffset: number;
    original: string;
    replacement: string;
    spanStart: boolean;
    spanClass: string;
    spanEnd: boolean;
    spanForChar: boolean;
    spanClassForChar: string;
    opener: ReplacementToken; // This is a reference to the opener for THIS instance; if this is the opener, it should be null
    closer: ReplacementToken; // This is a reference to the closer for THIS instance; if this is the closer, it should be null
}