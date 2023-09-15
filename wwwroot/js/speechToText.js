//speechToText.js

try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  $('.no-browser-support').show();
  $('.app').hide();
}


var noteTextarea = $('#speech-to-text');
var printMessage = $('#mic-text');

var noteContent = '';
var isSpeaking = false;
var stoppedByUser = false;

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true; //stop after 15 seconds

// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

  // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
	noteContent += "."
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function() { 
  //printMessage.text('Voice recognition activated. Try speaking into the microphone.');
    document.getElementById("info-message").innerHTML = "";
}

recognition.onspeechend = function() {
  //printMessage.text('You were quiet for a while so voice recognition turned itself off.');
  if(stoppedByUser == false) {
	  console.log("quite for a while, so turned off");
	  isSpeaking = false;
	  noteContent = '';
	  toggleMicroPhoneImage();
	  document.getElementById("info-message").innerHTML = "You have been quite for a while, so the Listener turned itself off.";
  }
}

recognition.onerror = function(event) {
	console.log("recognition error");
}


/********************************
	image
********************************/
function toggleMicroPhoneImage() {
	
	var a = document.getElementById("mic-image").src;
	if(document.getElementById("mic-image").src.includes("image/microphone.png")) {
		document.getElementById("mic-image").src = "image/microphone-stop.png";
		document.getElementById("mic-text").innerHTML = "Listening ...";
	}
	else {
		document.getElementById("mic-image").src = "image/microphone.png";
		document.getElementById("mic-text").innerHTML = "Click above to speak";
	}
}

//to start/stop recording
function micImageOnClick() {
	console.log("micImageOnclicked() entered");

	if(isSpeaking == false) {
		isSpeaking = true;
		//reset values
		stoppedByUser = false;
		noteContent = ' ';
		noteTextarea.val(''); 
		
		toggleMicroPhoneImage();
		recognition.start();
	}
	else {
		isSpeaking = false;
		toggleMicroPhoneImage();
		stoppedByUser = true;
		recognition.stop();
	}
}