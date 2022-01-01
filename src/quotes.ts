export const QUOTE_PRESETS: Quote[] = [
    {
        name: "Standard (\u201C\u201D)",
        open: "\u201C",
        close: "\u201D"
    },
    {
        name: "Guillemets (\u00AB\u00BB)",
        open: "\u00AB",
        close: "\u00BB"
    },
    {
        name: "Inverted Guillemets (\u00BB\u00AB)",
        open: "\u00BB",
        close: "\u00AB"
    },
    {
        name: "Custom",
        open: null,
        close: null
    },
];


export interface Quote {
    name: string,
    open: string,
    close: string,
}