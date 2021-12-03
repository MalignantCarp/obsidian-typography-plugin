import { App, Setting, PluginSettingTab } from "obsidian";
import TypographyPlugin from "./main";

export default class TypographySettingsTab extends PluginSettingTab {
	plugin: TypographyPlugin;

	constructor(app: App, plugin: TypographyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

    display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Advanced Typography Settings'});

		new Setting(containerEl)
			.setName('Typographer Single Quotes')
			.setDesc('default is on')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.singleQuotes)
				.onChange(async (value: boolean) => {
					this.plugin.settings.singleQuotes = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Typographer Double Quotes')
			.setDesc('default is on')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.doubleQuotes)
				.onChange(async (value: boolean) => {
					this.plugin.settings.doubleQuotes = value
					await this.plugin.saveSettings()
				}))

		new Setting(containerEl)
			.setName('Apostrophes')
			.setDesc('default is on')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.apostrophes)
				.onChange(async (value: boolean) => {
					this.plugin.settings.apostrophes = value
					await this.plugin.saveSettings()
				}))                

		new Setting(containerEl)
			.setName('Ellipses')
			.setDesc('This will replace three consecutive periods (...) with an ellipsis (\u2026)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ellipses)
				.onChange(async (value: boolean) => {
					this.plugin.settings.ellipses = value
					await this.plugin.saveSettings()
				}))                

        new Setting(containerEl)
            .setName('Dashes')
            .setDesc('This will replace two consecutive hyphens (--) with an en-dash (\u2013) and three consecutive hyphens (---) with an em-dash (\u2014).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.dashes)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.dashes = value
                    await this.plugin.saveSettings()
                }))                

                    
        containerEl.createEl('h2', {text: 'Style Options'});
        containerEl.createEl('p', {text:'Please install Style Settings plugin for customization of text styles.'})

        new Setting(containerEl)
            .setName('Style Single Quotes')
            .setDesc('Plugin will apply a style class around the single quoted block to highlight quoted text.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.colorSingleQuotes)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.colorSingleQuotes = value
                    await this.plugin.saveSettings()
                }))                

        new Setting(containerEl)
            .setName('Style Double Quotes')
            .setDesc('Plugin will apply a style class around the double quoted block to highlight quoted text.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.colorDoubleQuotes)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.colorDoubleQuotes = value
                    await this.plugin.saveSettings()
                }))                

        new Setting(containerEl)
            .setName('Style Double Quote Mismatches')
            .setDesc('Plugin will apply a separate style class around text where a double quote is started but not finished.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.colorMismatchedDoubleQuotes)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.colorMismatchedDoubleQuotes = value
                    await this.plugin.saveSettings()
                }))                

		new Setting(containerEl)
			.setName('Style Single Quote Mismatches')
			.setDesc('Plugin will apply a separate style class around text where a double quote is started but not finished.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.colorMismatchedSingleQuotes)
				.onChange(async (value: boolean) => {
					this.plugin.settings.colorMismatchedSingleQuotes = value
					await this.plugin.saveSettings()
				}))                
	
    }


}