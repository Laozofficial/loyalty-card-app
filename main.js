/* eslint-disable no-undef */
// Modules to control application life and create native browser window
const DataStore = require("./DataStore");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const url = require("url");
const settingsDataStore = new DataStore({ name: "Loyalty Settings" });

let settings = settingsDataStore.getSettingsData().settings_data;

// Keep a global reference of the window object
let mainWindow, addWindow, editWindow, settingWindow, aboutWindow;

if (Object.keys(settings).length == 0) {
	settings = {
		amount_per_point: 100,
		host: "127.0.0.1",
		port: 3307,
		user: "loyalty",
		password: "loyalty@4400",
		database: "loyaltydb"
	};

	settingsDataStore.saveSettingsData(settings);
}

let knex = require("knex")({
	client: "mysql",
	connection: {
		host: settings.host,
		user: settings.user,
		port: settings.port,
		password: settings.password,
		database: settings.database
	},
	useNullAsDefault: true
	// debug: true
});

function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1100,
		height: 800,
		icon: "./icon.png",
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	// and load the index.html of the app.
	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, "/template/index.html"),
			protocol: "file:",
			slashes: true
		})
	);

	// Emitted when the window is closed.
	mainWindow.on("closed", function() {
		// Dereference the window object
		mainWindow = null;
		app.quit();
	});

	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

	//Insert menu
	Menu.setApplicationMenu(mainMenu);

	mainWindow.webContents.once("dom-ready", () => {
		getStats();
	});
}

function getStats() {
	knex.count()
		.from("users")
		.then(count_users => {
			knex.count("*")
				.from("loyalty_points_logs")
				.then(count_logs => {
					mainWindow.webContents.send("show:statistics", {
						setting: settings,
						status: 0,
						count_users: count_users[0]["count(*)"],
						count_logs: count_logs[0]["count(*)"]
					});
				});
		})
		.catch(err => {
			mainWindow.webContents.send("show:statistics", {
				setting: settings,
				status: 1,
				message: err.sqlMessage,
				count_users: 0,
				count_logs: 0
			});
		});
}

//Handle add new user
function createSettingsWindow() {
	settingWindow = new BrowserWindow({
		width: 500,
		height: 480,
		title: "Settings",
		icon: "./icon.png",
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	settingWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, "/template/settings.html"),
			protocol: "file:",
			slashes: true
		})
	);

	settingWindow.setMenuBarVisibility(false);

	settingWindow.webContents.once("dom-ready", () => {
		settingWindow.webContents.send("edit:setting", settings);
	});
}

//Handle add new user
function createAddWindow() {
	addWindow = new BrowserWindow({
		width: 500,
		height: 520,
		title: "Add User",
		resizable: false,
		icon: "./icon.png",
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	addWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, "/template/adduser.html"),
			protocol: "file:",
			slashes: true
		})
	);
	addWindow.setMenuBarVisibility(false);
}

//Handle edit user
function createEditWindow(user) {
	editWindow = new BrowserWindow({
		width: 500,
		height: 520,
		title: "Edit User",
		resizable: false,
		icon: "./icon.png",
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	editWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, "/template/adduser.html"),
			protocol: "file:",
			slashes: true
		})
	);
	editWindow.setMenuBarVisibility(false);

	editWindow.webContents.once("dom-ready", () => {
		editWindow.webContents.send("edit:user", user);
	});
}

// Handle about us
function showAboutUs() {
	aboutWindow = new BrowserWindow({
		width: 500,
		height: 520,
		title: "About Us",
		icon: "./icon.png",
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	aboutWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, "/template/about.html"),
			protocol: "file:",
			slashes: true
		})
	);
	aboutWindow.setMenuBarVisibility(false);

	aboutWindow.webContents.on("new-window", function(event, url) {
		event.preventDefault();
		shell.openExternal(url);
	});
}

//Show the users list view
function showUsersList(offset, limit, search = "") {
	knex.select("*")
		.from("users")
		.where("barcode", "like", `%${search}%`)
		.orWhere("name", "like", `%${search}%`)
		.limit(limit)
		.offset(offset)
		.then(users => {
			mainWindow.webContents.send("view:users", { users, offset, limit, search });
		});
}

function showLogsList(offset, limit, search = "") {
	knex.select("*")
		.from("loyalty_points_logs")
		// .where("amount", "like", `%${search}%`)
		// .orWhere("name", "like", `%${search}%`)
		.join("users", "users.id", "loyalty_points_logs.user_id")
		.limit(limit)
		.offset(offset)
		.orderBy("id", "desc")
		.then(logs => {
			mainWindow.webContents.send("view:loyalty-logs", { logs, offset, limit, search });
		});
}

// Get system statistics
ipcMain.on("get:statistics", function() {
	getStats();
});

// Add loyalty point
ipcMain.on("user:add-point", function(e, data) {
	knex.select("*")
		.from("users")
		.where("barcode", data.barcode)
		.first()
		.then(user => {
			let current_point = parseInt(data.amount / settings.amount_per_point);
			let loyalty_record = {
				user_id: user.id,
				amount: data.amount,
				points: current_point,
				status: 0,
				created_at: new Date().toLocaleString()
			};
			knex.insert(loyalty_record)
				.into("loyalty_points_logs")
				.then(function() {
					data.loyalty_points = user.loyalty_points + current_point;
					data.updated_at = new Date().toLocaleString();
					knex.table("users")
						.where("id", user.id)
						.update({
							loyalty_points: data.loyalty_points,
							updated_at: data.updated_at,
							backed_up: 0
						})
						.then(function() {
							mainWindow.webContents.send("user:add-points-success");
						})
						.catch(function(error) {
							mainWindow.webContents.send("data-error", error);
						});
				})
				.catch(function(error) {
					mainWindow.webContents.send("data-error", error);
				});
		})
		.catch(function(error) {
			mainWindow.webContents.send("data-error", error);
		});
});

// Redeem loyalty point
ipcMain.on("user:redeem-point", function(e, data) {
	knex.select("*")
		.from("users")
		.where("barcode", data.barcode)
		.first()
		.then(user => {
			if (user.loyalty_points < data.amount) {
				mainWindow.webContents.send(
					"data-error",
					"The user does not have sufficient points to redeem the amount"
				);
				return;
			}
			let loyalty_record = {
				user_id: user.id,
				amount: data.amount,
				points: data.amount,
				status: 1,
				created_at: new Date().toLocaleString()
			};
			knex.insert(loyalty_record)
				.into("loyalty_points_logs")
				.then(function() {
					data.loyalty_points = user.loyalty_points - data.amount;
					data.updated_at = new Date().toLocaleString();

					knex.table("users")
						.where("id", user.id)
						.update({
							loyalty_points: data.loyalty_points,
							updated_at: data.updated_at,
							backed_up: 0
						})
						.then(function() {
							mainWindow.webContents.send("user:redeem-points-success");
						})
						.catch(function(error) {
							mainWindow.webContents.send("data-error", error);
						});
				})
				.catch(function(error) {
					mainWindow.webContents.send("data-error", error);
				});
		})
		.catch(function(error) {
			mainWindow.webContents.send("data-error", error);
		});
});

// Edit user
ipcMain.on("user:fetch", function(e, barcode) {
	knex.select("*")
		.from("users")
		.where("barcode", barcode)
		.first()
		.then(user => {
			mainWindow.webContents.send("user:fetch", user);
		})
		.catch(function(error) {
			mainWindow.webContents.send("user:fetch:error", error);
		});
});

/// Catch settings save
ipcMain.on("setting:save", function(e, setting) {
	mainWindow.webContents.send("setting:save", setting);
	settingsDataStore.saveSettingsData(setting);
	settings = setting;
	settingWindow.close();
	mainWindow.webContents.send("user:settings-saved-success");
});

// Edit user
ipcMain.on("user:edit", function(e, id) {
	knex.select("*")
		.from("users")
		.where("id", id)
		.first()
		.then(user => {
			createEditWindow(user);
		});
});

// Search User
ipcMain.on("user:search", function(e, term) {
	showUsersList(0, 50, term);
});

ipcMain.on("user:delete", function(e, id) {
	knex.table("users")
		.where("id", id)
		.del()
		.then(function() {
			mainWindow.webContents.send("user:delete", id);
		});
});

// Catch user add
ipcMain.on("user:add", function(e, user) {
	user.created_at = new Date().toLocaleString();
	user.updated_at = new Date().toLocaleString();
	user.loyalty_points = 0;

	knex.count()
		.from("users")
		.where("barcode", user.barcode)
		.then(function(res) {
			let count = res[0]["count(*)"];
			if (count == 0) {
				knex.insert(user)
					.into("users")
					.then(function() {
						addWindow.close();
						mainWindow.webContents.send("user:add", user);
					})
					.catch(function(error) {
						console.error(error);
					});
			} else {
				addWindow.webContents.send("error:unique-barcode");
			}
		});
});

// Catch user edit save
ipcMain.on("user:save", function(e, user) {
	mainWindow.webContents.send("user:save", user);

	user.updated_at = new Date().toLocaleString();

	knex.table("users")
		.where("id", user.id)
		.update(user)
		.then(function() {
			editWindow.close();
		})
		.catch(function(error) {
			console.error(error);
		});
});

const mainMenuTemplate = [
	{
		label: "File",
		submenu: [
			{
				label: "Home",
				click() {
					mainWindow.webContents.send("view:home");
				}
			},
			{
				type: "separator"
			},
			{
				label: "Redeem Points",
				click() {
					mainWindow.webContents.send("view:redeem-points");
				}
			},
			{
				label: "Add User",
				click() {
					createAddWindow();
				}
			},
			{
				label: "Settings",
				click() {
					createSettingsWindow();
				}
			},
			{
				type: "separator"
			},
			{
				label: "Exit",
				accelerator: process.platform == "darwin" ? "Command+Q" : "ctrl+Q",
				click() {
					app.quit();
				}
			}
		]
	},
	{
		label: "View",
		submenu: [
			{
				label: "Users",
				click() {
					showUsersList(0, 500);
				}
			},
			{
				label: "Loyalty Point Logs",
				click() {
					showLogsList(0, 1000);
				}
			}
		]
	},
	{
		label: "About",
		click() {
			showAboutUs();
		}
	}
];

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
	if (process.platform !== "darwin") app.quit();
});

// Re open window
app.on("activate", function() {
	if (mainWindow === null) createWindow();
});

//Add dev tools in development mode
// if (process.env.NODE_ENV !== "production") {
// 	mainMenuTemplate.push({
// 		label: "Developer Tools",
// 		submenu: [
// 			{
// 				label: "Toggle Developer Tools",
// 				accelerator: process.platform == "darwin" ? "Command+I" : "ctrl+I",
// 				click(item, focusedWindow) {
// 					focusedWindow.toggleDevTools();
// 				}
// 			},
// 			{
// 				role: "reload"
// 			}
// 		]
// 	});
// }
