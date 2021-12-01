import { App, MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting  } from 'obsidian';
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
}

export default class TypographyPlugin extends Plugin {
	settings: TypographySettings;

    public postprocessor: MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        //const source = el.innerHTML
        //console.log ("Element is ", el.tagName)
        let typograph = typography(el, this.settings)
        //el.innerHTML = typograph
    }

    async onload() {
        console.log('Loading typography plugin');
		await this.loadSettings();
		this.addSettingTab(new TypographySettingsTab(this.app, this));
        MarkdownPreviewRenderer.registerPostProcessor(this.postprocessor, 0)
    }

    async onunload() {
        console.log('Unloading typography plugin');
        MarkdownPreviewRenderer.unregisterPostProcessor(this.postprocessor)
    }

	async loadSettings() {
	 	this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
	 	await this.saveData(this.settings);
	}
}
