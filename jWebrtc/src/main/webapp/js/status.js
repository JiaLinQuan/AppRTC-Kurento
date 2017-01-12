    
var myConsultant = {name: '', status: ''};
 
ws.onopen = function() {
    console.log("ws connection now open");
    requestAppConfig();

    try{
          myConsultant.name = $('#webrtc-online-status').attr('data-peer');
          log('checking online status of:'+myConsultant.name);
          checkOnlineStatus(myConsultant);
       }catch(err){}
    isExtensionInstalled();
}


function checkOnlineStatus(user) {
	var message = {
		id : 'checkOnlineStatus',
		user : user.name
	};
	sendMessage(message);
}

function setOnlineStatus(message) {
    var statusTextElement = $("#webrtc-online-status");
    if (message.message == myConsultant.name) {
            myConsultant.status = message.response;
    }
    from = message.myUsername;
    console.log('setting online status done: myUsername is:'+from+' status:'+myConsultant.status);
    statusTextElement.text(myConsultant.name + ' is ' + myConsultant.status);
    if(myConsultant.status=='online'){
        enableButton('#call', 'call()');
    }else{
        disableButton('#call');
    }
}
var videoInput;
var videoOutput;
var miniVideo; 
var icons;
var isVideoMuted;
var isMicroMuted;

window.onload = function() {

    setRegisterState(NOT_REGISTERED);
    videoInput = document.getElementById('local-video');
    videoOutput = document.getElementById('remote-video');
    miniVideo = document.getElementById('mini-video');
    icons = document.getElementById('icons');
}	

function setRegisterState(nextState) {
	switch (nextState) {
	case NOT_REGISTERED:
		setCallState(NO_CALL);
		break;
	case REGISTERING:
		break;
	case REGISTERED:
		setCallState(NO_CALL);
		break;
	default:
		return;
	}
	registerState = nextState;
}

function setCallState(nextState) {
	switch (nextState) {
	
        case NO_CALL:
            deactivate(this.videoOutput);
            deactivate(this.miniVideo);
            deactivate(this.videoInput);
            this.deactivate(icons);
            this.activate('#confirm-join-div'); 
            enableButton('#call', 'call()');
            // this.deactivate('#cancel'); 
            disableButton('#cancel');
            break;

	case PROCESSING_CALL:
            disableButton('#call');
            this.activate(icons); 
            enableButton('#muteVideo', 'muteVideo()');
            enableButton('#muteAudio', 'muteMicrophone()');
            enableButton('#terminate', 'terminate()');
            enableButton('#cancel', 'terminate()');
            enableButton('#hangup', 'call()');
            disableButton('#muteAudio');
            disableButton('#muteVideo');
          //  disableButton('#terminate');
            break;

	case IN_CALL:
            disableButton('#call');
            miniVideo.src = videoInput.src;
            activate(this.videoOutput);
            this.activate(icons); 
            activate(this.miniVideo);
            this.deactivate('#confirm-join-div'); 
            break;
		
	default:
		return;
	}
	callState = nextState;
}

function activate(id) {
	$(id).removeClass("hidden").addClass( "active" );
}
function deactivate(id) {
	$(id).removeClass( "active" ).addClass("hidden");
}


function incomingCall(message) {
	// If busy just reject without disturbing user
	if (callState != NO_CALL) {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'bussy'
		};
		return sendMessage(response);
	}

	setCallState(PROCESSING_CALL);
	if (confirm('User ' + message.from
			+ ' is calling you. Do you accept the call?')) {

        videoInput = document.getElementById('local-video');
        videoOutput = document.getElementById('remote-video');
        miniVideo = document.getElementById('mini-video');
        icons = document.getElementById('icons');
        showSpinner(videoInput, videoOutput);
       
        from = message.from;
		var options = {
			localVideo : videoInput,
			remoteVideo : videoOutput,
			onicecandidate : onIceCandidate,
			onerror : onError
		}
                
        options.configuration  = configuration;
		webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
				function(error) {
					if (error) {
						return console.error(error);
					}
					webRtcPeer.generateOffer(onOfferIncomingCall);
                });

	} else {
		var response = {
			id : 'incomingCallResponse',
			from : message.from,
			callResponse : 'reject',
			message : 'user declined'
		};
		sendMessage(response);
		stop();
	}
}

function muteMicrophone() {
     isMicroMuted = !isMicroMuted;
    webRtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0].enabled = isMicroMuted;
   

}

function muteVideo() {
    isVideoMuted = !isVideoMuted;
    webRtcPeer.peerConnection.getLocalStreams()[0].getVideoTracks()[0].enabled = isVideoMuted;
   	
}

function onOfferIncomingCall(error, offerSdp) {

	if (error)
		return console.error("Error generating the offer");
	var response = {
		id : 'incomingCallResponse',
		from : from,
		callResponse : 'accept',
		sdpOffer : offerSdp
	};
	sendMessage(response);
}


function call() {

	setCallState(PROCESSING_CALL);
        videoInput = document.getElementById('local-video');		// <video>-element
        videoOutput = document.getElementById('remote-video');
        miniVideo = document.getElementById('mini-video');
        icons = document.getElementById('icons');
	showSpinner(videoInput, videoOutput);

	var options = {
		localVideo : videoInput,
		remoteVideo : videoOutput,
		onicecandidate : onIceCandidate,
		onerror : onError
	}

        options.configuration  = configuration;
	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
			function(error) {
				if (error) {
					return console.error(error);
				}
				webRtcPeer.generateOffer(onOfferCall);
			});
}

function onOfferCall(error, offerSdp) {
	
	if (error) {
		return console.error('Error generating the offer');
	}

	console.log('Invoking SDP offer callback function : calling:'+myConsultant.name+ ' from:'+from);
	
	var message = {
		id : 'call',
                from: from,
                to: myConsultant.name,
		sdpOffer : offerSdp
	};
	
	sendMessage(message);
}


function writeHTML(){
    document.write("<div id='videos'>");
    document.write("    <video id='mini-video' autoplay muted></video>");
    document.write("    <video id='remote-video' autoplay></video>");
    document.write("    <video id='local-video' autoplay muted></video>");
    document.write("</div>");

    document.write("<div id='confirm-join-div'>");
    document.write("    <div><span id='confirm-join-room-span'></span></div>");
    document.write("    <button id='call'>Call Now!</button>");
    document.write("    <button id='cancel'>Cancel</button>");
    document.write("</div>");

    document.write("<div id='icons'>");
    document.write("    <svg id='muteAudio' xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewbox='-10 -10 68 68'>");
    document.write("    <title>title</title>");
    document.write("      <circle cx='24' cy='24' r='34'>");
    document.write("        <title>Mute audio</title>");
    document.write("      </circle>");
    document.write("      <path class='on' transform='scale(0.6), translate(17,18)' d='M38 22h-3.4c0 1.49-.31 2.87-.87 4.1l2.46 2.46C37.33 26.61 38 24.38 38 22zm-8.03.33c0-.11.03-.22.03-.33V10c0-3.32-2.69-6-6-6s-6 2.68-6 6v.37l11.97 11.96zM8.55 6L6 8.55l12.02 12.02v1.44c0 3.31 2.67 6 5.98 6 .45 0 .88-.06 1.3-.15l3.32 3.32c-1.43.66-3 1.03-4.62 1.03-5.52 0-10.6-4.2-10.6-10.2H10c0 6.83 5.44 12.47 12 13.44V42h4v-6.56c1.81-.27 3.53-.9 5.08-1.81L39.45 42 42 39.46 8.55 6z' fill='white'/>");
    document.write("      <path class='off' transform='scale(0.6), translate(17,18)'  d='M24 28c3.31 0 5.98-2.69 5.98-6L30 10c0-3.32-2.68-6-6-6-3.31 0-6 2.68-6 6v12c0 3.31 2.69 6 6 6zm10.6-6c0 6-5.07 10.2-10.6 10.2-5.52 0-10.6-4.2-10.6-10.2H10c0 6.83 5.44 12.47 12 13.44V42h4v-6.56c6.56-.97 12-6.61 12-13.44h-3.4z'  fill='white'/>");
    document.write("</svg>");

    document.write("<svg id='muteVideo' xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewbox='-10 -10 68 68'>");
    document.write("     <circle cx='24' cy='24' r='34'>");
    document.write("         <title>Mute video</title>");
    document.write("     </circle>");
    document.write("     <path class='on' transform='scale(0.6), translate(17,16)' d='M40 8H15.64l8 8H28v4.36l1.13 1.13L36 16v12.36l7.97 7.97L44 36V12c0-2.21-1.79-4-4-4zM4.55 2L2 4.55l4.01 4.01C4.81 9.24 4 10.52 4 12v24c0 2.21 1.79 4 4 4h29.45l4 4L44 41.46 4.55 2zM12 16h1.45L28 30.55V32H12V16z' fill='white'/>");
    document.write("     <path class='off' transform='scale(0.6), translate(17,16)' d='M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4zm-4 24l-8-6.4V32H12V16h16v6.4l8-6.4v16z' fill='white'/>");
    document.write("</svg>");

   // document.write("    <svg id='fullscreen' class='hidden' xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewbox='-10 -10 68 68'>");
   // document.write("      <circle cx='24' cy='24' r='34'>");
   // document.write("        <title>Enter fullscreen</title>");
  // document.write("     </circle>");
  //  document.write("      <path class='on' transform='scale(0.8), translate(7,6)' d='M10 32h6v6h4V28H10v4zm6-16h-6v4h10V10h-4v6zm12 22h4v-6h6v-4H28v10zm4-22v-6h-4v10h10v-4h-6z' fill='white'/>");
  //  document.write("      <path class='off' transform='scale(0.8), translate(7,6)'  d='M14 28h-4v10h10v-4h-6v-6zm-4-8h4v-6h6v-4H10v10zm24 14h-6v4h10V28h-4v6zm-6-24v4h6v6h4V10H28z' fill='white'/>");
  //  document.write("    </svg>");

    document.write("<svg id='terminate' xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewbox='-10 -10 68 68'>");
    document.write("      <circle cx='24' cy='24' r='34'>");
    document.write("        <title>Hangup</title>");
    document.write("      </circle>");
    document.write("      <path transform='scale(0.7), translate(11,10)' d='M24 18c-3.21 0-6.3.5-9.2 1.44v6.21c0 .79-.46 1.47-1.12 1.8-1.95.98-3.74 2.23-5.33 3.7-.36.35-.85.57-1.4.57-.55 0-1.05-.22-1.41-.59L.59 26.18c-.37-.37-.59-.87-.59-1.42 0-.55.22-1.05.59-1.42C6.68 17.55 14.93 14 24 14s17.32 3.55 23.41 9.34c.37.36.59.87.59 1.42 0 .55-.22 1.05-.59 1.41l-4.95 4.95c-.36.36-.86.59-1.41.59-.54 0-1.04-.22-1.4-.57-1.59-1.47-3.38-2.72-5.33-3.7-.66-.33-1.12-1.01-1.12-1.8v-6.21C30.3 18.5 27.21 18 24 18z' fill='white'/>");
    document.write("</svg>");
    document.write("</div>");
}

writeHTML();