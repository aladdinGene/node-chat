// var socket = io("http://192.168.111.132:3001");
// var socket = io("http://chat.sunnah.work/socket.io");
var socket = io("localhost:4000");
let typingTimer = {}, typing_sent = {};
const TIMER_STOP_TIME = 3000;
socket.emit('auth', {apikey: 'longman0512asdwds3210', id: user_id});

socket.on("message_added", (message)=>{
	var active_room = $(".list-group-item.active").attr('data-room')
	if(message.room == active_room) {
		var avatar_url = $(".list-group-item.active").find('img.rounded-circle').attr('src')
		var member_name = $(".list-group-item.active").find('.chat-title').text().trim()
		var d = new Date(message.created_at);
	    var time = d.toLocaleTimeString();
		var append_ele = display_messages(message, avatar_url, time, member_name)
		
		$(".chat-content").append($(append_ele))
		$(".chat-content").scrollTop( $( ".chat-content" ).prop( "scrollHeight" ) );
		
	}
	var preview_content = ''
	if(message.kind == 3) {
		preview_content = '<i class="bx bx-file"></i> file'
	} else if(message.kind == 2) {
		preview_content = '<i class="bx bx-image"></i> image'
	} else {
		preview_content = message.content
	}
	$(`.list-group-item[data-room=${message.room}]`).find('.chat-msg').html(preview_content)
})

socket.on("isOline", (result)=>{
	console.log('isOnline', result)
	var chat_list_item = $(`.list-group-item[data-user=${result.id}]`)
	if(chat_list_item.length > 0){
		chat_list_item.find('.chat-user-offline').removeClass('chat-user-offline').addClass('chat-user-online')
	} else {
		jQuery.ajax({
	        type: "POST",
	        url: '/fetch_new_user/',
	        data: {
	            id: result.id
	        },
	        dataType: 'json',
	        async: false,
	        success: function (result) {
	            if(result.status){
	            	var temp_ele = `<a href="javascript:;" class="list-group-item" data-user="${result.data[0].id}" data-room="">
	                                    <div class="d-flex">
	                                        <div class="chat-user-online">
	                                            <img src="/${result.data[0].u_avatar}" width="42" height="42" class="rounded-circle" alt="">
	                                        </div>
	                                        <div class="flex-grow-1 ms-2">
	                                            <h6 class="mb-0 chat-title">${result.data[0].u_firstname} ${result.data[0].u_lastname}</h6>
	                                            <p class="mb-0 chat-msg"></p>
	                                        </div>
	                                        <div class="chat-time">
	                                          <p class="mb-0"></p>
	                                          <p class="typing mb-0">typing...</p>
	                                        </div>
	                                    </div>
	                                </a>`
	                $(".chat-list").append($(temp_ele))
	            }
	        }
	    });
	}
})

socket.on("isOffline", (result)=>{
	$(`.list-group-item[data-user=${result.id}]`).find('.chat-user-online').removeClass('chat-user-online').addClass('chat-user-offline')
	$(`.list-group-item[data-user=${result.id}]`).find('.typing').removeClass('show')
})

socket.on("typing_receive", (result) => {
	if(result.typing) {
		$(`.list-group-item[data-room=${result.room}]`).find('.typing').addClass('show')
	} else {
		$(`.list-group-item[data-room=${result.room}]`).find('.typing').removeClass('show')
	}
})

socket.on("chat_added", (data) => {
	$(`.list-group-item[data-user=${data.sender_id}]`).attr('data-room', data.group_id)
	Lobibox.notify('info', {
		pauseDelayOnHover: true,
		continueDelayOnInactiveTab: false,
		position: 'top right',
		icon: 'bx bx-info-circle',
		msg: `${data.sender_name} want to chat with you.`,
		sound: false
	});
})

const send_message = () => {
	var message = {
		'content': '',
		'to': ''
	}
	message['content'] = $("#msg-input").val();
	message['to'] = $(".list-group-item.active").attr('data-room')
	message['kind'] = 1
	message['user_id'] = user_id
	socket.emit('Add', message)
}

const fetch_message = () => {
	var group_id = $(".list-group-item.active").attr('data-room')
	var avatar_url = $(".list-group-item.active").find('img.rounded-circle').attr('src')
	var member_name = $(".list-group-item.active").find('.chat-title').text().trim()
	jQuery.ajax({
        type: "POST",
        url: '/fetch_messages/',
        data: {
            group_id: group_id
        },
        dataType: 'json',
        async: false,
        success: function (result) {
            if(result.messages) {
            	$(".chat-content").empty()
            	var messages = result.messages
            	messages.map((message) => {
            		var d = new Date(message.created_at);
                    var time = d.toLocaleTimeString();
                    var append_ele = ``
                    var append_ele = display_messages(message, avatar_url, time, member_name)
					$(".chat-content").append($(append_ele))
					$(".chat-content").scrollTop( $( ".chat-content" ).prop( "scrollHeight" ) );
            	})
            }
        }
    });
}

const display_messages = (message, avatar_url, time, member_name) => {
	var append_ele = ''
	if(message.kind == 1) {
	    if(message.user_id != user_id) {
			append_ele = `<div class="chat-content-leftside">
				              <div class="d-flex">
				                  <img src="${avatar_url}" width="48" height="48" class="rounded-circle" alt="" />
				                  <div class="flex-grow-1 ms-2">
				                      <p class="mb-0 chat-time">${member_name}, ${time}</p>
				                      <p class="chat-left-msg">${message.content}</p>
				                  </div>
				              </div>
				          </div>`
		} else {
		    append_ele = `<div class="chat-content-rightside">
				              <div class="d-flex">
				                  <div class="flex-grow-1 me-2">
				                      <p class="mb-0 chat-time text-end">you, ${time}</p>
				                      <p class="chat-right-msg">${message.content}</p>
				                  </div>
				              </div>
				          </div>`
		}
	} else if(message.kind==2) {
		if(message.user_id != user_id) {
			append_ele = `<div class="chat-content-leftside">
				              <div class="d-flex">
				                  <img src="${avatar_url}" width="48" height="48" class="rounded-circle" alt="" />
				                  <div class="flex-grow-1 ms-2">
				                      <p class="mb-0 chat-time">${member_name}, ${time}</p>
				                      <a class="chat-left-msg" href="/${message.content}" download>
				                      	  <img src="/${message.content}" alt="" width="300" height="180" />
				                      </a>
				                  </div>
				              </div>
				          </div>`
		} else {
			append_ele = `<div class="chat-content-rightside">
				              <div class="d-flex">
				                  <div class="flex-grow-1 me-2">
				                      <p class="mb-0 chat-time text-end">you, aaa</p>
				                      <a class="chat-right-msg" href="/${message.content}" download>
				                      	  <img src="/${message.content}" alt="" width="300" height="180" />
				                      </a>
				                  </div>
				              </div>
				          </div>`
		}
	} else {
		if(message.user_id != user_id) {
			append_ele = `<div class="chat-content-leftside">
				              <div class="d-flex">
				                  <img src="${avatar_url}" width="48" height="48" class="rounded-circle" alt="" />
				                  <div class="flex-grow-1 ms-2">
				                      <p class="mb-0 chat-time">${member_name}, ${time}</p>
				                      <a class="chat-left-msg" href="/${message.content}" download>
				                      	  <img src="/assets/images/avatars/file.png" alt="" width="300" height="180" />
				                      </a>
				                  </div>
				              </div>
				          </div>`
		} else {
			append_ele = `<div class="chat-content-rightside">
				              <div class="d-flex">
				                  <div class="flex-grow-1 me-2">
				                      <p class="mb-0 chat-time text-end">you, aaa</p>
				                      <a class="chat-right-msg" href="/${message.content}" download>
				                      	  <img src="/assets/images/avatars/file.png" alt="" width="300" height="180" />
				                      </a>
				                  </div>
				              </div>
				          </div>`
		}
	}
	return append_ele;
}

const typing_now = () => {
	console.log('aaaaaaaaaaaaaaaaa')
	var current_room = $(".list-group-item.active").attr("data-room")
	if(typing_sent[current_room]){
		clearTimeout(typingTimer[current_room]);
		typingTimer[current_room] = setTimeout(typing_is_stopped, TIMER_STOP_TIME, current_room);
	} else {
		typing_sent[current_room] = true
		socket.emit('typing_send', {
			room: current_room,
			started: true,
			user_id
		})
	}
}

const typing_is_stopped = (room) => {
	socket.emit('typing_send', {
		room,
		started: false,
		user_id
	})
	typing_sent[room] = false
}

$(document).ready(function(){
	$("#msg-input").on("keydown", (e)=>{
		if(e.keyCode == "13") {
			if($("#msg-input").val()) {
				send_message();
				$("#msg-input").val('')
			}
		} else {
			typing_now()
		}
	})

	$("#chat-send-btn").on("click", () => {
		if($("#msg-input").val()) {
			send_message();
			$("#msg-input").val('')
		}
	})

	$(".chat-list").on('click', ".list-group-item", function(){
		var _this = $(this);
		$('.chat-header').css({"opacity": "1", "pointer-events": "auto"})
		$(".chat-footer").css({"opacity": "1", "pointer-events": "auto"})
		$(".list-group-item.active").removeClass('active')
		_this.addClass('active')
		var current_member = _this.find('.chat-title').text().trim()
		$("#member-name").text(current_member)
		if(_this.attr('data-room')) fetch_message()
		else {
			$(".chat-content").empty()
			var avatar_url = _this.find('.rounded-circle').attr('src')
			var member_name = _this.find('.chat-title').text().trim()
			var temp_ele = `<div class="mt-5 text-center">
					          <img src="${avatar_url}" class="rounded-circle" alt="" width="150" height="150">
					        </div>
					        <div class="mt-4 text-center"><button class="btn btn-info new-chat-btn">Chat with ${member_name}</button></div>`
			$(".chat-content").append($(temp_ele))
		}
	})

	$('.chat-content').on('click', '.new-chat-btn', function(e){
		member_id = $('.list-group-item.active').attr('data-user')
		var new_chat_ele = $('.list-group-item.active')
		jQuery.ajax({
	        type: "POST",
	        url: '/add_new_group/',
	        data: {
	            users: JSON.stringify([user_id, Number(member_id)])
	        },
	        dataType: 'json',
	        async: false,
	        success: function (result) {
	            if(result.created){
	            	socket.emit('chat_want', {
	            		sender_name: $("#user-name").text().trim(),
	            		group_id: result.group_id,
	            		to: Number(member_id),
	            		sender_id: user_id
	            	})
	            	$(".chat-content").empty()
	            	new_chat_ele.attr('data-room', result.group_id)
	            	var avatar_url = new_chat_ele.find('.rounded-circle').attr('src')
					var member_name = new_chat_ele.find('.chat-title').text().trim()
					var temp_ele = `<div class="mt-5 text-center">
							          <img src="${avatar_url}" class="rounded-circle" alt="" width="150" height="150">
							        </div>
							        <h3 class="mt-4 text-center">You can chat with ${member_name}</h3>`
					$(".chat-content").append($(temp_ele))
	            } else {
	            	console.log('failed.')
	            }
	        }
	    });
	})

	$("#chat-file-input").on('change', function(){
		var file = $(this).get(0).files[0]
		var group_id = $(".list-group-item.active").attr('data-room')
		var chat_file = new FormData()
		chat_file.append("path", `chat/${group_id}`)
		chat_file.append("image", file)
		jQuery.ajax({
            type: "POST",
            url: '/chat_file/',
            data: chat_file,
            contentType: false,
        	processData: false,
            success: function (data) {
            	var kind = 2;
            	if(!data.mimetype.includes("image")) kind = 3;
            	var message = {
					'content': '',
					'to': ''
				}
				message['content'] = data.filepath;
				message['to'] = $(".list-group-item.active").attr('data-room')
				message['kind'] = kind
				message['user_id'] = user_id
				socket.emit('Add', message)
            }
        });
	})
})