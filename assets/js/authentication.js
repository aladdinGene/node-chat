$(document).ready(function(){
	$("#sign-up-btn").on('click', function(){
		var firstName = $("#inputFirstName").val()
		var lastName = $("#inputLastName").val()
		var email = $("#inputEmailAddress").val()
		var pwd = $("#inputChoosePassword").val()
		var mobile = $("#inputMobile").val()

		if((firstName == "") || (lastName == "") || (email == "") || (pwd == "") || (mobile == "")) {
			Lobibox.notify('error', {
				pauseDelayOnHover: true,
				continueDelayOnInactiveTab: false,
				position: 'top right',
				icon: 'bx bx-x-circle',
				msg: 'Input all fields correctly.',
				sound: false
			});
		} else {
			var signupData = new FormData();
			signupData.append("email", email)
			signupData.append("pwd", pwd)
			signupData.append("firstName", firstName)
			signupData.append("lastName", lastName)
			signupData.append("mobile", mobile)
			signupData.append("path", "avatars")
			if($("#avatar")[0].files.length > 0) {
				signupData.append("image", $("#avatar")[0].files[0])
			}
			jQuery.ajax({
	            type: "POST",
	            url: '/signup/',
	            data: signupData,
	            contentType: false,
            	processData: false,
	            success: function (data) {
	            	var result = JSON.parse(data)
	                if (result.flag) {
	                    Lobibox.notify('success', {
							pauseDelayOnHover: true,
							continueDelayOnInactiveTab: false,
							position: 'top right',
							icon: 'bx bx-check-circle',
							msg: result.msg,
							sound: false
						});
	                } else {
	                	Lobibox.notify('error', {
							pauseDelayOnHover: true,
							continueDelayOnInactiveTab: false,
							position: 'top right',
							icon: 'bx bx-x-circle',
							msg: result.msg,
							sound: false
						});
	                }
	            }
	        });
		}
	});

	$("#sign-in-btn").on('click', function(){
		var email = $("#inputEmailAddress").val()
		var pwd = $("#inputChoosePassword").val()

		if((email == "") || (pwd == "")) {
			Lobibox.notify('error', {
				pauseDelayOnHover: true,
				continueDelayOnInactiveTab: false,
				position: 'top right',
				icon: 'bx bx-x-circle',
				msg: 'Input all fields correctly.',
				sound: false
			});
		} else {
			jQuery.ajax({
	            type: "POST",
	            url: '/signin/',
	            data: {
	                email: email,
	                pwd: pwd
	            },
	            dataType: 'json',
	            async: false,
	            success: function (result) {
	                if (!result.flag) {
	                    Lobibox.notify('error', {
							pauseDelayOnHover: true,
							continueDelayOnInactiveTab: false,
							position: 'top right',
							icon: 'bx bx-x-circle',
							msg: result.msg,
							sound: false
						});
	                } else {
	                	window.location = "/"
	                }
	            }
	        });
		}
	})

	$("#avatar").on("change", ()=>{
		var file = $("#avatar")[0].files[0]
		var fReader = new FileReader();
		fReader.onloadend = function(e) {
			let image = $("#avatar-preview");
			image.attr("src", e.target.result);
		};
		fReader.readAsDataURL(file);
	})
})