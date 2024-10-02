import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import SimpleTimeTrackerPlugin from "./main";
import { defaultSettings } from "./settings";
import HeavenHrApi from "./api/heavenhr";
const eventBus = require('js-event-bus')();

export class SimpleTimeTrackerSettingsTab extends PluginSettingTab {

    plugin: SimpleTimeTrackerPlugin;
	heavenHrApi: HeavenHrApi;

    constructor(app: App, plugin: SimpleTimeTrackerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
		this.heavenHrApi = new HeavenHrApi(
			this.plugin.settings,
			this.plugin.saveSettings(),
		);

		// refresh the token and bootstrap the users
		this.heavenHrApi.refreshToken()
			.then(async (data) => {
				// save access token
				access_token_field.settingEl.querySelector("input").value = data;

				return new Notice("Successfully got access token. Please choose yourself in the dropdown menu now.");
			})
			.then(() => {
				// get the users
				this.heavenHrApi.getEmployees().then((data) => {
					eventBus.emit("heavenHrUsers", null, data);
				}).catch((err) => {
					throw new Error(err);
				});
			})
			.catch((err) => {
				new Notice("Could not get access token. Please check your client id and client secret.");
			});


        this.containerEl.empty();
        this.containerEl.createEl("h2", {text: "Super Simple Time Tracker Settings"});

        new Setting(this.containerEl)
            .setName("Timestamp Display Format")
            .setDesc(createFragment(f => {
                f.createSpan({text: "The way that timestamps in time tracker tables should be displayed. Uses "});
                f.createEl("a", {text: "moment.js", href: "https://momentjs.com/docs/#/parsing/string-format/"});
                f.createSpan({text: " syntax."});
            }))
            .addText(t => {
                t.setValue(String(this.plugin.settings.timestampFormat));
                t.onChange(async v => {
                    this.plugin.settings.timestampFormat = v.length ? v : defaultSettings.timestampFormat;
                    await this.plugin.saveSettings();
                });
            });

		new Setting(this.containerEl)
			.setName("Enable Punch In/Out")
			.setDesc("If enabled, the time tracker will automatically add a new row when you start a new session. This is useful for tracking time spent on a single task.")
			.addToggle(t => {
				t.setValue(this.plugin.settings.enablePunchInOut);
				t.onChange(async v => {
					this.plugin.settings.enablePunchInOut = v;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName("Pause Keywords")
			.setDesc("A list of keywords that will count towards your break time. Separate keywords with a comma. TODO: MAKE CLEAR OF CONTAIN!")
			.addTextArea(t => {
				t.setValue(this.plugin.settings.pauseKeywords.join(", "));
				t.onChange(async v => {
					this.plugin.settings.pauseKeywords = v.split(", ").filter(x => x.length);
					await this.plugin.saveSettings();
				});
			});

        new Setting(this.containerEl)
            .setName("CSV Delimiter")
            .setDesc("The delimiter character that should be used when copying a tracker table as CSV. For example, some languages use a semicolon instead of a comma.")
            .addText(t => {
                t.setValue(String(this.plugin.settings.csvDelimiter));
                t.onChange(async v => {
                    this.plugin.settings.csvDelimiter = v.length ? v : defaultSettings.csvDelimiter;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(this.containerEl)
            .setName("Fine-Grained Durations")
            .setDesc("Whether durations should include days, months and years. If this is disabled, additional time units will be displayed as part of the hours.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.fineGrainedDurations);
                t.onChange(async v => {
                    this.plugin.settings.fineGrainedDurations = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(this.containerEl)
            .setName("Timestamp Durations")
            .setDesc("Whether durations should be displayed in a timestamp format (12:15:01) rather than the default duration format (12h 15m 1s).")
            .addToggle(t => {
                t.setValue(this.plugin.settings.timestampDurations);
                t.onChange(async v => {
                    this.plugin.settings.timestampDurations = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(this.containerEl)
            .setName("Display Segments in Reverse Order")
            .setDesc("Whether older tracker segments should be displayed towards the bottom of the tracker, rather than the top.")
            .addToggle(t => {
                t.setValue(this.plugin.settings.reverseSegmentOrder);
                t.onChange(async v => {
                    this.plugin.settings.reverseSegmentOrder = v;
                    await this.plugin.saveSettings();
                });
            });

		// add some spacing
		this.containerEl.createEl("br");
		this.containerEl.createEl("br");

		// heaven hr related settings
		this.containerEl.createEl("h2", { text: "Heaven HR Integration" });
		this.containerEl.createEl("p",
			{ text: "You will need to obtain an access key first using cUrl. If you need any instructions, please look them up in the documentation." }
		);
		this.containerEl.createEl("a", {
			text: "Heaven HR API Documentation",
			href: "https://api.heavenhr.com/#introduction"
		});

		this.containerEl.createEl("p", { text: "" });

		new Setting(this.containerEl)
			.setName("Heaven HR client_id")
			.setDesc("Your company's heaven hr client_id")
			.addText(t => {
				t.setValue(String(this.plugin.settings.client_id));
				t.onChange(async v => {
					this.plugin.settings.client_id = v.length ? v : defaultSettings.client_id;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName("Heaven HR client_secret")
			.setDesc("Your company's heaven hr client_secret")
			.addText(t => {
				t.setValue(String(this.plugin.settings.client_secret));
				t.onChange(async v => {
					this.plugin.settings.client_secret = v.length ? v : defaultSettings.client_secret;
					await this.plugin.saveSettings();
				});
			});

		const access_token_field = new Setting(this.containerEl)
			.setName("Heaven HR Access Token")
			.setDesc("The access token of your heaven hr credentials")
			.addText(t => {
				t.setValue(String(this.plugin.settings.heavenHrAccessToken));
				t.onChange(async v => {
					this.plugin.settings.heavenHrAccessToken = v.length ? v : defaultSettings.heavenHrAccessToken;
					await this.plugin.saveSettings();
				});
			});

		// todo if token is valid, update data!
		new Setting(this.containerEl)
			.setName("Heaven HR User")
			.setDesc("The user you want to track time for")
			.addDropdown(d => {
				d.addOption("", "Please select a User");

				eventBus.once("heavenHrUsers", (e: any) => {
					e.data.forEach((user: any) => {
						d.addOption(user.id, `${user.firstName} ${user.lastName}`);
					});

					if (this.plugin.settings.heavenHrUserId != "") {
						d.setValue(this.plugin.settings.heavenHrUserId);

						// get projects for employee
						this.heavenHrApi.getProjects(this.plugin.settings.heavenHrUserId).then((data) => {
							eventBus.emit("heavenHrProjects", null, data);
						}).catch((err) => {
							throw new Error(err);
						});

						this.heavenHrApi.getCategories().then((data) => {
							eventBus.emit("heavenHrCategories", null, data);
						}).catch((err) => {
							throw new Error(err);
						});
					}
				});

				d.onChange(async v => {
					this.plugin.settings.heavenHrUserId = v;
					await this.plugin.saveSettings();

					// get projects for employee
					this.heavenHrApi.getProjects(this.plugin.settings.heavenHrUserId).then((data) => {
						eventBus.emit("heavenHrProjects", null, data);
					}
					).catch((err) => {
						throw new Error(err);
					});
				});
			});

		new Setting(this.containerEl)
			.setName("Heaven HR Project")
			.setDesc("The project you want to track time for")
			.setClass("project-dropdown")
			.addDropdown(d => {
				d.addOption("", "Please select a Project");

				eventBus.on("heavenHrProjects", (e: any) => {
					this.emptyDropdown(".project-dropdown");
					d.addOption("", "Please select a Project");

					e.data.forEach((project: any) => {
						d.addOption(project.id, project.name);
					});

					if (this.plugin.settings.heavenHrProjectId != "" && e.data.findIndex((project: any) => project.id == this.plugin.settings.heavenHrProjectId) != -1) {
						d.setValue(this.plugin.settings.heavenHrProjectId);
					}
				});

				d.onChange(async v => {
					this.plugin.settings.heavenHrProjectId = v;
					await this.plugin.saveSettings();
				});
			});

		new Setting(this.containerEl)
			.setName("Heaven HR Category")
			.setDesc("The category you want to track time for")
			.setClass("category-dropdown")
			.addDropdown(d => {
				d.addOption("", "Please select a category");

				eventBus.on("heavenHrCategories", (e: any) => {
					this.emptyDropdown(".category-dropdown");
					d.addOption("", "Please select a category");

					e.data.forEach((category: any) => {
						d.addOption(category.id, category.name);
					});

					if (this.plugin.settings.heavenHrCategoryId != "" && e.data.findIndex((category: any) => category.id == this.plugin.settings.heavenHrCategoryId) != -1) {
						d.setValue(this.plugin.settings.heavenHrCategoryId);
					}
				});

				d.onChange(async v => {
					this.plugin.settings.heavenHrCategoryId = v;
					await this.plugin.saveSettings();
				});
			});

		const statusDropdown = new Setting(this.containerEl)
			.setName("Tracking default status")
			.setDesc("The status that your tracking should have by default")
			.setClass("status-dropdown")
			.addDropdown(d => {
				d.addOption("EDITABLE", "EDITABLE");
				d.addOption("REQUESTED", "REQUESTED");

				console.log("status,", this.plugin.settings.heavenHrTrackingStatus)

				d.setValue(this.plugin.settings.heavenHrTrackingStatus);



				d.onChange(async v => {
					this.plugin.settings.heavenHrTrackingStatus = v;
					await this.plugin.saveSettings();
				});
			});



        this.containerEl.createEl("hr");
        this.containerEl.createEl("p", { text: "Need help using the plugin? Feel free to join the Discord server!" });
        this.containerEl.createEl("a", { href: "https://link.ellpeck.de/discordweb" }).createEl("img", {
            attr: { src: "https://ellpeck.de/res/discord-wide.png" },
            cls: "simple-time-tracker-settings-image"
        });
        this.containerEl.createEl("p", { text: "If you like this plugin and want to support its development, you can do so through my website by clicking this fancy image!" });
        this.containerEl.createEl("a", { href: "https://ellpeck.de/support" }).createEl("img", {
            attr: { src: "https://ellpeck.de/res/generalsupport-wide.png" },
            cls: "simple-time-tracker-settings-image"
        });
    }

	private emptyDropdown(elClass: string) {
		// empty dropdown
		const el = document.querySelector(elClass).find('select');

		console.log("element?", el)
		if (el) el.empty();

	}
}
