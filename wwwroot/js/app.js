//////////////////////////////////////////////////////////////////////////////////////////


//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var micImage = document.getElementById("mic-image");
var isRecording = false;

var speaking = false;
var utter;
var voiceBlob = null; //null - voice not recorded, not null - voice recorded

//////////////////////////////////////////////////////////////////////////////////////////
//wavesurfer
var wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#A8DBA8',
  progressColor: '#3B8686'
});

//ready - waveform is ready for playing
wavesurfer.on('ready', function() {
	console.log("!!!wavesurfer will play");
	document.getElementById("buttons").style.display = "block";
});


wavesurfer.on('error', function(e) {
	console.log("there is an error");
});

//////////////////////////////////////////////////////////////////////////////////////////

	
//adds listeners to teh play/pause button, and the save button
document.querySelector('[data-action="play"]').addEventListener('click', wavesurfer.playPause.bind(wavesurfer));	
document.querySelector('[data-action="save"]').addEventListener('click', function() {
		voiceBlob = null;
});

//the beforeunload stuff, used in index.html and recordMore.html
//@TBD: currently for the recordMore page, it will always trigger the confirmation dialog when user leaves that page
function onPageLoaded() {
	window.addEventListener("beforeunload", (event) => {
		console.log("beforeunload entered");
		if(voiceBlob != null) {
			event.returnValue = "You have unsaved changes!";
		}
	});
}

//cancel any in progress text-to-speech speaking when leaving the page
window.onunload = function() {
	window.speechSynthesis.cancel();
}



//adds the click listener, for text-to-speak image
document.querySelector("#speak-image").addEventListener('click', function() {
	if(document.querySelector("#speak-text").value.trim() != '') {
		var utter = new SpeechSynthesisUtterance();
		utter.text = document.querySelector("#speak-text").value;
		utter.lang = 'en-US';

		if (speaking == false) {
			console.log(">>>start to speak");
			speaking = true;
			window.speechSynthesis.speak(utter);
			utter.onend = function(event) {
				console.log("text-to-speech is done");
				speaking = false; //note, this may be slow and thus this may be called when user clicked the image again!
			}
		}
		else {
			speaking = false;
			//stop the speaking
			console.log(">>>stops speaking");
			window.speechSynthesis.cancel();
		}		
	}
});


//changes the text under that microphone image, to show infomation like "Recording ..." etc.
function toggleMicroPhoneImage() {
	
	var a = document.getElementById("mic-image").src;
	if(document.getElementById("mic-image").src.includes("image/microphone.png")) {
		document.getElementById("mic-image").src = "image/microphone-stop.png";
		document.getElementById("mic-text").innerHTML = "Recording ...";
	}
	else {
		document.getElementById("mic-image").src = "image/microphone.png";
		document.getElementById("mic-text").innerHTML = "Click above to start recording";
	}
}

//to start/stop recording
function micImageOnClick() {
	console.log("micImageOnclicked() entered, isRecording=" + isRecording);
	if(isRecording == false) {
		startRecording();
	} 
	else {
		stopRecording();
	}
	console.log("micImageOnclicked() done, now isRecording=" + isRecording);
}

function startRecording() {
	console.log(">>>startRecording() entered");
	voiceBlob = null;
	if(document.URL.includes("index.html")) {
		document.getElementById("buttons").style.display = "none";
		wavesurfer.empty();
	}
    
    var constraints = { audio: true, video:false }

	console.log("!!!will getUserMedia()!!!");
	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log(">>>getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//assign to gumStream for later use
		gumStream = stream;
		
		//use the stream
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()
		isRecording = true;
			toggleMicroPhoneImage();

		console.log("!!!Recording started");

	}).catch(function(err) {
		console.log("startRecording failed");
	});
	
	console.log("<<<startRecording() done");
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopRecording() entered");

	//reset button just in case the recording is stopped while paused
	//pauseButton.innerHTML="Pause";
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(createDownloadLink);
	isRecording = false;
	toggleMicroPhoneImage();

	console.log("stopRecording() done");
}

//delete button to delete files
function addDelButton(parent) {
	var buttonElem = parent.appendChild(document.createElement("button"));
	buttonElem.innerHTML = "Delete";
	buttonElem.onclick = function() {
		this.parentElement.remove();
	}
}

//sets the href and download in the saveWaveform element
//for downloading the recordings to a file
function setSaveWaveformButton(blob) {
	if(blob != undefined && blob != null) {
		var url = URL.createObjectURL(blob);
		var filename = "record_" + new Date().toISOString() + ".wav";
		
		var a = document.getElementById("saveWaveform");
		a.setAttribute("href", url);
		a.setAttribute("download", filename);
	}
}

//creates the wav file downloading links
function createDownloadLink(blob) {
	voiceBlob = blob;
	//>>>@todo this is temparory code. make it better
	if(document.URL.includes("index.html") || (!document.URL.includes("recorder.html") && !document.URL.includes("about.html") && !document.URL.includes("listener.html")))
	{
		wavesurfer.loadBlob(blob);
		setSaveWaveformButton(blob);
		return;
	}
	//<<<
	
	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	
	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
	link.innerHTML = "Save to disk\t\t";
	
	//add the new audio element to li
	li.appendChild(au);
	
	//add the filename to the li
	li.appendChild(document.createTextNode(filename+".wav "))

	//add the save to disk link to li
	li.appendChild(link);
	
	//delete button element
	addDelButton(li);
	
	//add the li element to the ol
	recordingsList.appendChild(li);
}