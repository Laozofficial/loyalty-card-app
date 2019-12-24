const Store = require("electron-store");

class DataStore extends Store {
	constructor(settings) {
		super(settings);
		this.settings_data = this.get("SettingsData") || {};
	}

	saveSettingsData(data) {
		this.set("SettingsData", data);
		return this;
	}

	getSettingsData() {
		this.settings_data = this.get("SettingsData") || {};
		return this;
	}
}

module.exports = DataStore;
