/* eslint-disable no-undef */
vex.defaultOptions.className = "vex-theme-plain";

document.addEventListener("click", function(e) {
	if (e.target && e.target.classList.contains("delete-row-item")) {
		e.preventDefault();
		let id = e.target.getAttribute("data-id");
		delete_item(id, "this user and all user loyalty point logs");
	} else if (e.target && e.target.classList.contains("edit-item")) {
		e.preventDefault();
		let id = e.target.getAttribute("data-id");
		window.ipcRenderer.send("user:edit", id);
	}
});

document.querySelector(".search-form").addEventListener("submit", submitSearchForm);
document.querySelector(".add-points-form").addEventListener("submit", submitAddPointsForm);
document.querySelector(".redeem-points-form").addEventListener("submit", submitRedeemPointsForm);
document.getElementById("barcode").addEventListener("change", searchBarcodeChanged);
document.getElementById("red-barcode").addEventListener("change", searchBarcodeChanged);

window.ipcRenderer.on("view:home", () => viewHome());
window.ipcRenderer.on("view:users", (event, data) => viewUsers(data));
window.ipcRenderer.on("view:loyalty-logs", (event, data) => viewLoyaltyLogs(data));
window.ipcRenderer.on("user:delete", (event, id) => remove_deleted_item(id));
window.ipcRenderer.on("user:add", (e, user) => notifyUserAdded(user));
window.ipcRenderer.on("user:add-points-success", e => notifyAddPointSuccess());
window.ipcRenderer.on("user:redeem-points-success", e => notifyRedeemPointSuccess());
window.ipcRenderer.on("user:settings-saved-success", e => notifySettingsSavedSuccess());
window.ipcRenderer.on("data-error", (e, message) => errorNotify(message));
window.ipcRenderer.on("user:fetch", (e, user) => showFetchedUser(user));
window.ipcRenderer.on("view:redeem-points", () => viewRedeemPoints());
window.ipcRenderer.on("show:statistics", (e, data) => showStatistics(data));

viewHome();

function showStatistics(data) {
	document.querySelector(".user-count").innerHTML = data.count_users;
	document.querySelector(".log-count").innerHTML = data.count_logs;
	document.querySelector(".amount-per-point").innerHTML = data.setting.amount_per_point;

	if (data.status == 1) {
		errorNotify(data.message);
		document.querySelector(".connection").innerHTML = "Disconnected";
	} else {
		document.querySelector(".connection").innerHTML = "Connected";
	}
}

function showFetchedUser(user) {
	if (user == null) {
		resetForms();
		errorNotify("User with barcode number does not exist in the database");
		return;
	}

	if (document.getElementById("home").style.display === "none") {
		document.getElementById("red-name").value = user.name;
		document.getElementById("red-loyalty-points").value = user.loyalty_points;
		document.getElementById("red-points").disabled = false;
	} else {
		document.getElementById("name").value = user.name;
		document.getElementById("add-points").disabled = false;
	}
}

function notifyUserAdded(user) {
	document.querySelector(".user-count").innerHTML =
		parseInt(document.querySelector(".user-count").innerHTML) + 1;
	resetForms();
	successNotify("User added successfully.");
}

function notifyAddPointSuccess() {
	document.querySelector(".log-count").innerHTML =
		parseInt(document.querySelector(".log-count").innerHTML) + 1;
	document.querySelector(".add-points-form").reset();
	successNotify("User loyalty points added successfully.");
}

function notifyRedeemPointSuccess() {
	document.querySelector(".log-count").innerHTML =
		parseInt(document.querySelector(".log-count").innerHTML) + 1;
	document.querySelector(".redeem-points-form").reset();
	successNotify("User loyalty points redeemed successfully.");
}

function notifySettingsSavedSuccess() {
	window.ipcRenderer.send("get:statistics");
	successNotify("Settings saved successfully.");
}

function searchBarcodeChanged(e) {
	window.ipcRenderer.send("user:fetch", e.target.value);
}

function viewHome() {
	document.getElementById("users").style.display = "none";
	document.getElementById("logs").style.display = "none";
	document.getElementById("redeem-points").style.display = "none";
	document.getElementById("home").style.display = "block";
	document.getElementById("add-points").disabled = true;
}

function viewRedeemPoints() {
	document.getElementById("users").style.display = "none";
	document.getElementById("logs").style.display = "none";
	document.getElementById("home").style.display = "none";
	document.getElementById("redeem-points").style.display = "block";
	document.getElementById("add-points").disabled = true;
}

function viewLoyaltyLogs(data) {
	document.getElementById("home").style.display = "none";
	document.getElementById("users").style.display = "none";
	document.getElementById("redeem-points").style.display = "none";
	document.getElementById("logs").style.display = "block";
	let tbody = document.getElementById("logs-table-body");
	tbody.innerHTML = "";
	let i = 0;
	data.logs.forEach(log => {
		i++;
		let row = document.createElement("tr");
		row.innerHTML = `
        <td>${i}</td>
        <td>${log.name}</td>
        <td>${log.amount}</td>
        <td>${log.points}</td>
		<td>${
			log.status
				? "<span class='alert alert-sm alert-danger'>Withdraw</span>"
				: "<span class='alert alert-sm alert-success'>Added</span>"
		}</td>
        <td>${log.created_at}</td>
        `;
		tbody.appendChild(row);
	});
}

function viewUsers(data) {
	document.getElementById("home").style.display = "none";
	document.getElementById("logs").style.display = "none";
	document.getElementById("redeem-points").style.display = "none";
	document.getElementById("users").style.display = "block";
	let tbody = document.getElementById("users-table-body");
	tbody.innerHTML = "";
	let i = 0;
	data.users.forEach(user => {
		i++;
		let row = document.createElement("tr");
		row.innerHTML = `
        <td>${i}</td>
        <td>${user.barcode}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
		<td>${user.phone}</td>
		<td>${user.loyalty_points}</td>
        <td>${user.created_at}</td>
        <td>
            <a href="#" class="btn btn-sm btn-danger delete-row-item" data-id="${user.id}"><i class="fa fa-trash delete-row-item" data-id="${user.id}"></i></a>
            <a href="#" class="btn btn-sm btn-primary edit-item" data-id="${user.id}"><i class="fa fa-pencil edit-item" data-id="${user.id}"></i></a>
        </td>
        `;
		tbody.appendChild(row);
	});

	document.querySelector("#search-term").value = data.search;
}

function submitAddPointsForm(e) {
	e.preventDefault();
	const barcode = document.querySelector("#barcode").value;
	const amount = document.querySelector("#amount").value;
	window.ipcRenderer.send("user:add-point", { barcode, amount });
}

function submitRedeemPointsForm(e) {
	e.preventDefault();
	const barcode = document.querySelector("#red-barcode").value;
	const amount = document.querySelector("#red-amount").value;
	window.ipcRenderer.send("user:redeem-point", { barcode, amount });
}

function submitSearchForm(e) {
	e.preventDefault();
	const search = document.querySelector("#search-term").value;
	window.ipcRenderer.send("user:search", search);
}

function remove_deleted_item(id) {
	window.ipcRenderer.send("get:statistics");
	document.querySelectorAll(".delete-row-item").forEach(e => {
		if (e.getAttribute("data-id") == id) {
			let dom = upTo(e, "tr");
			if (dom != null) dom.remove();
		}
	});
}

function delete_item(id, message) {
	vex.dialog.confirm({
		message: "Are you absolutely sure you want to delete " + message + "?",
		callback: function(value) {
			if (value) {
				window.ipcRenderer.send("user:delete", id);
			}
		}
	});
}

function resetForms() {
	document.getElementById("barcode").value = "";
	document.getElementById("red-barcode").value = "";
	document.getElementById("name").value = "";
	document.getElementById("red-name").value = "";
	document.getElementById("add-points").disabled = true;
	document.getElementById("red-points").disabled = true;
}

// Find first ancestor of el with tagName or undefined if not found
function upTo(el, tagName) {
	tagName = tagName.toLowerCase();

	while (el && el.parentNode) {
		el = el.parentNode;
		if (el.tagName && el.tagName.toLowerCase() == tagName) {
			return el;
		}
	}
	return null;
}
