var summary = new Object();

// reading file in browser
function onFileLoad(elementId, event) {
    document.getElementById(elementId).value = event.target.result;
}

function onChooseFile(event, onLoadFileHandler) {
    if (typeof window.FileReader !== 'function')
        throw ("The file API isn't supported on this browser.");
    let input = event.target;
    if (!input)
        throw ("The browser does not properly implement the event object");
    if (!input.files)
        throw ("This browser does not support the `files` property of the file input.");
    if (!input.files[0])
        return undefined;
    let file = input.files[0];
    let fr = new FileReader();
    fr.onload = onLoadFileHandler;
    fr.readAsText(file);
}


function processAdif() {
	// $("#status").text("Parsing ADIF and checking chasers...");
	$("#results_list").empty();
	summary.total = summary.p2p = summary.s2s = summary.invalid = summary.newChasers = summary.pastChasers = 0;
	
	var adifContents = $("#adif_contents").val();
	var parsed = adifParser.AdifParser.parseAdi(adifContents); // tag names get converted to lowercase
	$.each(parsed.records, function (i, record) {
		var missingData = validateRequiredData(record);
		var pastChases = checkChaser(record);
		addToOutput(record, missingData, pastChases);
	});
	
	// $("#status").text("Done checking.");
	
	showSummary();
}

function addToOutput(record, missingData, pastChases) {
	var call = record['call'];
	var mode = record['mode'];
	var qrzLink = getQrzLink(call);
	var qth = "";
	if (record['qth']) {
		qth = " [" + record['qth'] + "]";
	}
	var historyType = getHistoryType();
	var p2p = "";
	if ((historyType == 'pota' || historyType == 'both') && record['sig_info']) {
		p2p = " [P2P]";
		summary.p2p++;
	}
	if ((historyType == 'sota' || historyType == 'both') && record['sota_ref']) {
		p2p = " [S2S]";
		summary.s2s++;
	}
	var li = $("<li>");
	var line = qrzLink + qth + p2p;
	li.append(line);
	if (missingData && missingData.length > 0) {
		li.append(" MISSING DATA: " + missingData);
		li.css('color', 'red');
		summary.invalid++;
	}
	else if (historyType == 'both') {
		
		// N pota all, N sota
		if (pastChases.allPotaMatches == 0 && pastChases.allSotaMatches == 0) {
			li.append(" not found in POTA or SOTA chaser history!");
			li.css('color', 'orange');
			// TODO
			summary.newChasers++;
		}
		// N pota all, Y sota
		else if (pastChases.allPotaMatches == 0 && pastChases.allSotaMatches > 0) {
			li.append(" has " + pastChases.allSotaMatches + " past SOTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
		// Y pota mode, N sota
		else if (pastChases.potaModeMatches > 0 && pastChases.allSotaMatches == 0) {
			li.append(" has " + pastChases.potaModeMatches + " past " + mode + " POTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
		// Y pota mode, Y sota
		else if (pastChases.potaModeMatches > 0 && pastChases.allSotaMatches > 0) {
			li.append(" has " + pastChases.potaModeMatches + " past " + mode + " POTA chases and " + pastChases.allSotaMatches + " SOTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
		// N pota mode, Y pota all, Y sota
		else if (pastChases.potaModeMatches == 0 && pastChases.allPotaMatches > 0 && pastChases.allSotaMatches > 0) {
			li.append(" has 0 " + mode + " POTA chases but " + pastChases.allPotaMatches + " total POTA chases, and " + pastChases.allSotaMatches + " SOTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
		// N pota mode, Y pota all, N sota
		else {
			li.append(" has 0 " + mode + " POTA chases but " + pastChases.allPotaMatches + " total POTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
	}
	else if (historyType == 'pota') {
		if (pastChases.potaModeMatches == 0) {
			if (pastChases.allPotaMatches > 0) {
				li.append(" has 0 " + mode + " POTA chases but " + pastChases.allPotaMatches + " total POTA chases");
				li.css('color', 'orange');
				summary.pastChasers++;
			} else {
				li.append(" not found in POTA chaser history!");
				li.css('color', 'orange');
				// TODO
				summary.newChasers++;
			}
		} else {
			li.append(" has " + pastChases.potaModeMatches + " past " + mode + " POTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		}
	} else {
		if (pastChases.allSotaMatches > 0) {
			li.append(" has " + pastChases.allSotaMatches + " past SOTA chases");
			li.css('color', 'green');
			summary.pastChasers++;
		} else {
			li.append(" not found in SOTA chaser history!");
			li.css('color', 'orange');
			// TODO
			summary.newChasers++;
		}
	}
	
	$("#results_list").append(li);
	summary.total++;
}

function checkChaser(record) {
	var call = record['call'];
	var chaserHistory = {potaModeMatches: 0, allPotaMatches: 0, allSotaMatches: 0};
	if (call) {
		call = call.toUpperCase();
		// if call has /P we'll search that too
		var callWithoutP = null;
		if (call.endsWith("/P")) {
			callWithoutP = call.substring(0, call.length - 2);
		}
		
		var potaData = null;
		if (call in callsignDataPota) {
			potaData = callsignDataPota[call];
		} else if (callWithoutP && callWithoutP in callsignDataPota) {
			potaData = callsignDataPota[callWithoutP];
		}
			
		if (potaData) {
			var mode = record['mode'];
			mode = mode.toUpperCase();
			if (mode == 'CW') {
				chaserHistory.potaModeMatches = potaData[0];
			} else if (mode == 'SSB') {
				chaserHistory.potaModeMatches = potaData[1];
			} else {
				// defaulting to digital mode
				chaserHistory.potaModeMatches = potaData[2];
			}
			
			chaserHistory.allPotaMatches = potaData[0] + potaData[1] + potaData[2];
		}
		if (call in callsignDataSota) {
			chaserHistory.allSotaMatches = callsignDataSota[call];
		} else if (callWithoutP && callWithoutP in callsignDataSota) {
			chaserHistory.allSotaMatches = callsignDataSota[callWithoutP];
		}
	}
	return chaserHistory;
}

function getQrzLink(call) {
	return "<a href=\"https://www.qrz.com/db/?query=" + call + "\" target=\"_blank\">" + call + "</a>";
}

// mandatory fields:
// Date, Time, Band, Mode, other call, my call STATION_CALLSIGN, my park MY_SIG_INFO
function validateRequiredData(record) {
	const mandatoryFieldsPota = ["qso_date", "time_on", "band", "mode", "call", "station_callsign", "my_sig_info"];
	const mandatoryFieldsSota = ["qso_date", "time_on", "band", "mode", "call", "station_callsign", "my_sota_ref"];
	var mandatoryFields = (getHistoryType() == 'sota' ? mandatoryFieldsSota : mandatoryFieldsPota); // check POTA format if pota+sota selected
	var missingData = [];
	for (i in mandatoryFields) {
		if (!(mandatoryFields[i] in record)) {
			missingData.push(mandatoryFields[i]);
		}
	}
	return missingData;
}

function showSummary() {
	$("header ul").empty();
	addToSummaryList(summary.total + " total records", 'black');
	addToSummaryList("Invalid ADIF entries: " + summary.invalid, (summary.invalid > 0 ? 'red' : 'black'));
	addToSummaryList("New (or incorrect) chasers: " + summary.newChasers, (summary.newChasers > 0 ? 'orange' : 'black'));
	addToSummaryList("Known chasers: " + summary.pastChasers, 'green');
	if (getHistoryType() == 'pota') {
		addToSummaryList("P2P: " + summary.p2p, 'black');
	} else if (getHistoryType() == 'sota') {
		addToSummaryList("S2S: " + summary.s2s, 'black');
	} else {
		addToSummaryList("P2P/S2S: " + summary.p2p + "/" + summary.s2s, 'black');
	}
}

function addToSummaryList(text, color) {
	$("header ul").append(
		$("<li>")
		.append(text)
		.css('color', color));
}

function getHistoryType() {
	return $("input[name=pota_or_sota]:checked").val();
}

$( document ).ready(function() {
	$("#lastUpdatedSpan").text("Chaser data last updated: " + lastUpdated);
	$("header").append($("<ul>"));
	$("footer").hide();
    
	$('input[type="file"]').click(function() {
		$(this).val("");
	});
	
	$("input[name=pota_or_sota]").change(function() {
		processAdif();
	});
});


