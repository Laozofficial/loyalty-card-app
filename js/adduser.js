const form = document.querySelector("form");
form.addEventListener("submit", submitForm);

const User = {};

window.ipcRenderer.on("error:unique-barcode", () => {
	let errorNode = document.createElement("small");
	errorNode.innerHTML = "The barcode is already registered";
	errorNode.classList.add("form-error");
	document.querySelector("#barcode").after(errorNode);
});

window.ipcRenderer.on("edit:user", (e, user) => {
	document.querySelector("#barcode").value = user.barcode;
	document.querySelector("#name").value = user.name;
	document.querySelector("#email").value = user.email;
	document.querySelector("#phone").value = user.phone;
	document.querySelector("button").innerHTML = "Save";
	User.id = user.id;
});

function submitForm(e) {
	e.preventDefault();
	const barcode = document.querySelector("#barcode").value;
	const name = document.querySelector("#name").value;
	const email = document.querySelector("#email").value;
	const phone = document.querySelector("#phone").value;

	let hasError = false;
	document.querySelectorAll(".form-error").forEach(e => e.remove());

	if (barcode == "" || barcode == null) {
		let errorNode = document.createElement("small");
		errorNode.innerHTML = "The barcode is required";
		errorNode.classList.add("form-error");
		document.querySelector("#barcode").after(errorNode);
		hasError = true;
	}
	if (name == "" || name == null) {
		let errorNode = document.createElement("small");
		errorNode.innerHTML = "The user's full name is required";
		errorNode.classList.add("form-error");
		document.querySelector("#name").after(errorNode);
		hasError = true;
	}

	if (hasError) return;

	if (Object.keys(User) == 0) {
		window.ipcRenderer.send("user:add", {
			barcode,
			name,
			email,
			phone
		});
	} else {
		window.ipcRenderer.send("user:save", {
			id: User.id,
			barcode,
			name,
			email,
			phone
		});
	}
}
