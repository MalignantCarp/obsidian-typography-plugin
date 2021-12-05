import { App, MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import TypographySettingsTab from './settings';
import { TypographySettings } from './types';
import { typography } from './typography';

const DEFAULT_SETTINGS: TypographySettings = {
    dashes: true,
    singleQuotes: true,
    doubleQuotes: true,
    apostrophes: true,
    ellipses: true,
    colorDoubleQuotes: true,
    colorMismatchedDoubleQuotes: true,
    colorSingleQuotes: true,
    colorMismatchedSingleQuotes: true
};

export default class TypographyPlugin extends Plugin {
    settings: TypographySettings;

    public postprocessor: MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        // console.log('Post processor called.');
        //const source = el.innerHTML
        //console.log ("Element is ", el.tagName)
        let typograph = typography(el, this.settings);
        el.innerHTML = typograph;
    };

    async onload() {
        console.log('Loading typography plugin');
        await this.loadSettings();
        this.addSettingTab(new TypographySettingsTab(this.app, this));
        MarkdownPreviewRenderer.registerPostProcessor(this.postprocessor, 0)
        console.log("Loaded.");
    }

    async onunload() {
        console.log('Unloading typography plugin');
        MarkdownPreviewRenderer.unregisterPostProcessor(this.postprocessor)
        console.log('Unloaded.');
    }

    async loadSettings() {
        console.log('Loading typography settings.');
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        console.log('Done.')
    }

    async saveSettings() {
        console.log('Saving typography settings.');
        await this.saveData(this.settings);
        console.log('Done.')
    }
}
