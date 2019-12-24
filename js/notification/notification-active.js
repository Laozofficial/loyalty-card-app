function notify(from, align, icon, type, animIn, animOut, title, message) {
	$.growl(
		{
			icon: icon,
			title: title,
			message: message,
			url: ""
		},
		{
			element: "body",
			type: type,
			allow_dismiss: true,
			placement: {
				from: from,
				align: align
			},
			offset: {
				x: 20,
				y: 85
			},
			spacing: 10,
			z_index: 9999,
			delay: 2500,
			timer: 1000,
			url_target: "_blank",
			mouse_over: false,
			animate: {
				enter: animIn,
				exit: animOut
			},
			icon_type: "class",
			template:
				'<div data-growl="container" class="alert" role="alert">' +
				'<button type="button" class="close" data-growl="dismiss">' +
				'<span aria-hidden="true">&times;</span>' +
				'<span class="sr-only">Close</span>' +
				"</button>" +
				'<span data-growl="icon"></span>' +
				'<span data-growl="title"></span>' +
				'<span data-growl="message"></span>' +
				'<a href="#" data-growl="url"></a>' +
				"</div>"
		}
	);
}

function successNotify(message) {
	notify(
		"top",
		"center",
		"fa fa-check",
		"success",
		"animated fadeInDown",
		"animated fadeOutUp",
		" ",
		message
	);
}

function errorNotify(message) {
	notify(
		"top",
		"center",
		"fa fa-exclamation-circle",
		"danger",
		"animated fadeInDown",
		"animated fadeOutUp",
		" ",
		message
	);
}
