const form = document.querySelector("form");
form.addEventListener("submit", submitForm);

window.ipcRenderer.on("edit:setting", (e, setting) => {
	console.log(setting);
	document.querySelector("#amount_per_point").value = setting.amount_per_point;
	document.querySelector("#host").value = setting.host;
	document.querySelector("#port").value = setting.port;
	document.querySelector("#database").value = setting.database;
	document.querySelector("#user").value = setting.user;
	document.querySelector("#password").value = setting.password;
});

function submitForm(e) {
	e.preventDefault();
	const amount_per_point = document.querySelector("#amount_per_point").value;
	const host = document.querySelector("#host").value;
	const port = document.querySelector("#port").value;
	const database = document.querySelector("#database").value;
	const user = document.querySelector("#user").value;
	const password = document.querySelector("#password").value;

	let hasError = false;
	document.querySelectorAll(".form-error").forEach(e => e.remove());

	if (amount_per_point == "" || amount_per_point == null) {
		let errorNode = document.createElement("small");
		errorNode.innerHTML = "The amount per point is required";
		errorNode.classList.add("form-error");
		document.querySelector("#amount_per_point").after(errorNode);
		hasError = true;
	}

	if (hasError) return;

	window.ipcRenderer.send("setting:save", {
		amount_per_point,
		host,
		database,
		port,
		user,
		password
	});
}
