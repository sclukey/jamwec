function foldoutAction() {
	if ($(this).hasClass('noclick')) {
		$(this).removeClass('noclick');
	}
	var h = $(this).next('.foldout').is(':visible');
	if (active_album) {
		active_album.removeClass('ui-state-active');
		active_album.next('.foldout').animate({height: 'hide'});
	}
	if (h) {
		$(this).removeClass('ui-state-active');
		$(this).next('.foldout').animate({height: 'hide'});
	} else {
		$(this).addClass('ui-state-active');
		$(this).next('.foldout').animate({height: 'show'});
		active_album = $(this);
	}
	return false;
}

var draggableOptions = {
	revert: true,
	scroll: false,
	zIndex: 1000,
	helper: "clone",
	distance: 20,
	start: function(event, ui) {
		ui.helper.width($(this).width());
		$(this).addClass('noclick');
	}
}

function keys(obj) {
	var keys = [];

	for(var key in obj)
		if(obj.hasOwnProperty(key) && key != "undefined")
			keys.push(key);

	return keys;
}

$.widget("custom.catcomplete", $.ui.autocomplete, {
	_renderItem: function( ul, item ) {
		var type = item.category.substr(0, item.category.length-1).toLowerCase();
		var id = item.id;
		
		
		if (type == 'album') {
			$(albumHTML(id)).appendTo('#library_search')
			.draggable(draggableOptions).click(foldoutAction);
		} else if (type == 'artist') {
			$(artistHTML(id)).appendTo('#library_search')
			.draggable(draggableOptions).click(foldoutAction);
		} else {
			$('<div class="ui-corner-all ui-widget-content artist ui-draggable" data-id="' + type + '-' + id + '"></div>')
			.html('<h3>' + item.label + '</h3><h4>' + songs[id].Album + '</h4><h4>' + songs[id].Artist + '</h4>')
			.appendTo('#library_search')
			.draggable(draggableOptions);
		}
		
		
		return $("<li>")
			.attr("data-value", item.value)
			.append($( "<a>" ).text( item.label ))
			.appendTo(ul);
	},
	_renderMenu: function( ul, items ) {
		var that = this;
		var currentCategory = "";
		$.each( items, function( index, item ) {
			if ( item.category != currentCategory ) {
				$('<br class="clearboth"><div class="foldout"><h4>' + item.category + '</h4></div>')
				.appendTo('#library_search');
				currentCategory = item.category;
			}
			that._renderItemData( ul, item );
		});
	}
});

$(function() {
	
	$("#dialog").dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			"Refresh": function() {
				location.reload();
			},
			"Ignore": function() {
				$(this).dialog("close");
			}
		}
	});
	
	$( "#radio" ).buttonset();
	$('label[for="radio_search"]').hide();

	view_by = $("input:radio[name=radio]:checked").val();

	$("input[name=radio]:radio").change(function() {
		view_by = $(this).val();
		showLibrary();
	});

	$("#playing").droppable({
		activeClass: "ui-state-active",
		hoverClass: "ui-state-highlight",
		drop: function( event, ui ) {
			// Get the type of drop
			var type = '';
			var who = '';
			if (!ui.draggable.attr("data-id")) return true;
			var m = ui.draggable.attr("data-id").match(/^(.*?)-(.*)$/);
			if (m !== null && m.length > 2) {
				type = m[1];
				who = m[2];
			} else {
				return;
			}

			var add_albums = [];
			var add_songs = [];

			if (type == 'artist') {
				// Add this artist's albums to the list of albums to add
				if (artists[who]) {
					var k = keys(artists[who].albums);
					for (var i=0;i<k.length;i++) {
						add_albums.push(artists[who].albums[k[i]]);
					}
				}
			} else if (type == 'album') {
				// Add this to the list of albums to add
				add_albums.push(who);
			} else {
				// Add this to the list of songs to add
				add_songs.push(songs[who].file);
			}

			// Add the albums to the songs list
			for (var i=0;i<add_albums.length;i++) {
				if (albums[add_albums[i]]) {
					var k = keys(albums[add_albums[i]].songs);
					for (var j=0;j<k.length;j++) {
						add_songs.push(albums[add_albums[i]].songs[k[j]].file);
					}
				}
			}

			// Build the command to send to MPD
			var command = '';
			for (var i=0;i<add_songs.length;i++) {
				command += 'add "' + add_songs[i] + "\"\n";
			}
			command += "allplaylistinfo";

			$.ajax({
				url: 'query.php',
				data: {c: command},
				dataType: 'json',
				type: 'POST'
			}).done(function(data) {
				playlist = data;
				regroupPlaylist();
			});
		}
	});

	$("#controls_vol_slider_inner").slider({
		range: "min",
		value: 0,
		min: 0,
		max: 100,
		change: function( event, ui ) {
			if (event.originalEvent) {
				$.ajax({
					url: 'query.php',
					data: { c: 'setvol ' + ui.value },
					dataType: 'json',
					type: 'POST'
				}).done(function(data) {
					$("#controls_vol_slider_inner").slider('value', ui.value);
				});
			}
		}
	});

	$("#clear").click(function () {
		$.ajax({
			url: 'query.php',
			data: { c: "clear\nallplaylistinfo" },
			dataType: 'json',
			type: 'POST'
		}).done(function(data) {
			playlist = data;
			regroupPlaylist();
			updateStatus(true);
		});
	});

	$("#playslide").slider({
		range: "min",
		value: 0,
		min: 0,
		max: 10000,
		change: function( event, ui ) {
			if (event.originalEvent) {
				$.ajax({
					url: 'query.php',
					data: { c: 'seekid ' + currentSongId + ' ' + Math.round(songTotalTime * ui.value / 10000) },
					dataType: 'json',
					type: 'POST'
				}).done(function(data) {
					updateStatus(true);
					$("#playslide").slider('value', ui.value);
				});
			}
		},
		slide: function( event, ui ) {
			$('#playheadTime').text(secondsToTime(Math.round(songTotalTime * ui.value / 10000)));
		}
	});

	$("#controls li.ui-state-default").hover(controlMouseIn, controlMouseOut);

	$("#controls #controls_prev").click(function () {
		if (songTime < 10) {
			$.ajax({
				url: 'query.php',
				data: { c: 'previous' },
				dataType: 'json',
				type: 'POST'
			}).done(function(data) {
				updateStatus(true);
				$("#playslide").slider('value', 0);
			});
		} else {
			$.ajax({
				url: 'query.php',
				data: { c: 'seekid ' + currentSongId + ' 0' },
				dataType: 'json',
				type: 'POST'
			}).done(function(data) {
				updateStatus(true);
				$("#playslide").slider('value', 0);
			});
		}
	});

	$("#controls #controls_play_pause").click(function() {
		if (playState == "play") {
			$.ajax({
				url: 'query.php',
				data: { c: 'pause' },
				dataType: 'json',
				type: 'POST'
			}).done(function(data) {
				updateStatus(true);
			});
		} else {
			$.ajax({
				url: 'query.php',
				data: { c: 'play' },
				dataType: 'json',
				type: 'POST'
			}).done(function(data) {
				updateStatus(true);
			});
		}
	});

	$("#controls #controls_stop").click(function() {
		$.ajax({
			url: 'query.php',
			data: { c: 'stop' },
			dataType: 'json',
			type: 'POST',
			async: false
		}).done(function(data) {
			songTime = -1;
			updateStatus(true);
		});
	});

	$("#controls #controls_next").click(function() {
		var command = "next";
		if (playState == "pause")
			command += "\npause";
		$.ajax({
			url: 'query.php',
			data: { c: command },
			dataType: 'json',
			type: 'POST'
		}).done(function(data) {
			updateStatus(true);
		});
	});

	$.ajax({
		url: 'query.php',
		data: { c: "allplaylistinfo" },
		dataType: "json",
		type: 'POST'
	}).done(function(data) {
		playlist = data;
		regroupPlaylist();
	});

	timer = $.timer(updateStatus, increment, true);

	$.ajax({
		url: 'query.php',
		data: { c: "stats" },
		dataType: "json",
		type: 'POST',
		async: false
	}).done(function(data) {
		$.getJSON('db/' + data.db_update + '.json', function(data) {
			console.log('Got the JSON');
			songs = data.songs;
			albums = data.albums;
			artists = data.artists;
			
			searchlist = [];
			var k = keys(artists);
			for(var i=0; i<k.length; i++) {
				searchlist.push({label: artists[k[i]].name, category:'Artists', id: k[i]});
			}
			k = keys(albums);
			for(var i=0; i<k.length; i++) {
				searchlist.push({label: albums[k[i]].name, category:'Albums', id: k[i]});
			}
			for(var i=0; i<songs.length; i++) {
				searchlist.push({label: songs[i].Title, category:'Songs', id: i});
			}
			
			$('#search').catcomplete({
				delay: 0,
				response: function(event, ui) {
					$('#library_search').empty();
				},
				open: function(event, ui) {
					$('#search').catcomplete("close");
					if ($("input:radio[name=radio]:checked").val() != 'search') {
						$('label[for="radio_search"]').show();
						$("#radio_search").prop("checked", true);
						$("#radio").buttonset('refresh');
						showSearch();
					}
				},
				source: searchlist
			});
			showLibrary();
		}).fail(function(data) {
			console.log('Creating the DB');
			$.ajax({
				url: 'query.php',
				data: { c: "makejsondb" },
				dataType: "json",
				type: 'POST',
			}).done(function(data) {
				console.log('Got the database from the server');
				songs = data.songs;
				albums = data.albums;
				artists = data.artists;
				$("#search").catcomplete({source:songs});
				showLibrary();
			}).fail(function(data) {
				$('#dialog').text(data.responseJSON.message);
				$('#dialog').dialog('option', 'title', data.responseJSON.title);
				$('#dialog').dialog('open');
			});
		});
	});
	
	$("#search").val('');
});

var active_album = undefined;
var songs;
var albums;
var artists;
var searchlist;
var view_by = 'albums';

function showLibrary() {
	if (view_by == 'albums') {
		return showAlbums();
	} else if (view_by == 'artists') {
		return showArtists();
	} else if (view_by == 'search') {
		return showSearch();
	}
}

function showSearch() {
	view_by = 'search';
	
	if ($('#library_artists').is(':visible'))
		$('#library_artists').hide();
	if ($('#library_albums').is(':visible'))
		$('#library_albums').hide();

	$('#library_search').show();
}

function showArtists() {
	view_by = 'artists';

	if ($('#library_artists').is(':empty')) {

		var k = keys(artists).sort();
		var start;
		for (start=0; start<k.length; start++)
			if (!/[^a-zA-Z]/.test(k[start].charAt(0)))
				break;

		var new_html = '';
		for (var i=start; i<k.length; i++) { // k.length
			new_html += artistHTML(k[i]);
		}
		for (var i=0;i<start;i++) {
			new_html += artistHTML(k[i]);
		}
		$('#library_artists').html(new_html);

		$('.artist').click(foldoutAction);

		$('#library_artists .album,#library_artists .artist').draggable(draggableOptions);

		$('#library_artists .song').draggable(draggableOptions);

		loadImages('.artist');
	}

	//$('#library_artists').animate({opacity: 'show'});

	if ($('#library_albums').is(':visible'))
		$('#library_albums').hide();
	if ($('#library_search').is(':visible')) {
		$('#library_search').hide();
		$('label[for="radio_search"]').hide();
		$("#search").val('');
	}

	$('#library_artists').show();

}

function artistHTML(id) {
	var r = '<div class="ui-corner-all ui-widget-content artist" data-id="artist-' + id + '">\
		<img src="images/unknown.png" data-src="art.php?width=100&type=artist&album=' + encodeURIComponent(artists[id].albums[0]) + '&artist=' + encodeURIComponent(id) + '">\
		<h3>' + artists[id].name + '</h3>\
		<h4>' + artists[id].albums.length + ' ' + (artists[id].albums.length == 1 ? 'Album' : 'Albums') + '</h4>';


	r += '</div><div class="foldout" style="display: none;">';

	// Add stuff in the foldout here
	var s = keys(artists[id].albums).sort();
	for (var j=0;j<s.length;j++) {
		r += '<div class="album-holder">' + albumHTML(artists[id].albums[s[j]], false) + '</div>';
	}

	r += '</div>';

	return r;
}

function albumHTML(id, hide) {
	if (hide === undefined) hide = true;
	var r = '<div class="ui-corner-all ui-widget-content album" data-id="album-' + id + '">\
		<img src="images/unknown.png" width="100" data-src="art.php?width=100&album=' + encodeURIComponent(id) + '&artist=' + encodeURIComponent(albums[id].artist) + '">\
		<h3>' + albums[id].name + '</h3>\
		<h4>' + albums[id].artist + '</h4>';


	r += '</div><div class="foldout"' + (hide ? ' style="display: none;"' : '') + '><ul>';

	var s = albums[id].songs.sort(function(a,b){return parseInt(a.Track)-parseInt(b.Track)});
	for (var j=0;j<s.length;j++) {
		r += '<li>' + ((s[j].Track == -1) ? '' : parseInt(s[j].Track) + '. ') +
			'<a class="song" data-id="song-' + s[j].idx + '" href="javascript:;">' + s[j].Title + '</a></li>';
	}

	r += '</ul></div>';

	return r;
}

function showAlbums() {
	view_by = 'albums';

	if ($('#library_albums').is(':empty')) {

		console.profile('loadDatabase');
		// Create the album array
		var k = keys(albums).sort();

		// Find the start of the letters
		var start;
		for (start=0;start<k.length;start++)
			if(!/[^a-zA-Z]/.test(k[start].charAt(0)))
				break;

		var new_html = '';
		for (var i=start;i<k.length;i++) { // k.length
			new_html += albumHTML(k[i]);
		}

		// Do the others
		for (var i=0;i<start;i++) {
			new_html += albumHTML(k[i]);
		}

		$("#library_albums").html(new_html);

		$('#library_albums .album').click(foldoutAction);

		$('#library_albums .album').draggable(draggableOptions);

		$('#library_albums .song').draggable(draggableOptions);


		console.profileEnd();
		loadImages('.album');
	}

	if ($('#library_artists').is(':visible'))
		$('#library_artists').hide();
	if ($('#library_search').is(':visible')) {
		$('#library_search').hide();
		$('label[for="radio_search"]').hide();
		$("#search").val('');
	}

	$('#library_albums').show();
}

var images;
var num_threads = 10;

function loadImages(where) {
	if (!images) {
		console.log('creating the image set');
		console.log(images);
		images = $(where + ' img');
	} else {
		console.log('adding to the image set');
		console.log(images);
		images.add(where + ' img');
	}
	for (var i=0;i<num_threads;i++) {
		// Create the element and load it
		loadImage(0);
	}
}

function loadImage(i) {
	if (!images || images.length == 0) {
		images = undefined;
		return;
	}
	
	var this_image = images.eq(0);
	images = images.slice(1);
	
	var new_image = $('<img src="' + this_image.attr('data-src') + '">');
	console.log('loading a new image');
	new_image.on('load', function() {
		// Do the next one
		console.log('replacing an image');
		this_image.replaceWith(new_image);
		loadImage(0);
	});
}

function controlMouseIn() {
	$(this).addClass('ui-state-hover');
}
function controlMouseOut() {
	$(this).removeClass('ui-state-hover');
}

var timer;
var increment = 1000;

var songTime = 0;
var songTotalTime = 0;
var playState = "stop";

var timerTime = 0;
var currentSongId;

function secondsToTime(all_seconds) {
	var hours = Math.floor(all_seconds / 3600);
	var minutes = Math.floor((all_seconds % 3600) / 60);
	var seconds = Math.floor(all_seconds % 60);

	var time_string = "";
	if (hours > 0 )
		time_string += hours + ':';
	if (minutes < 10)
		time_string += '0' + minutes + ':';
	else if (minutes > 10)
		time_string += minutes + ':';
	if (seconds < 10)
		time_string += '0';
	time_string += seconds;

	return time_string;
}

function updateStatus(force) {
	if (force === undefined) force = false;

	//console.log('updating status');

	if (playState == "play")
		songTime += increment / 1000;

	if (timerTime % 5 == 0 || songTime >= songTotalTime || songTotalTime == 0 || force) {
		// Get the new times from the server and update
		$.ajax({
			url: 'query.php',
			data: { c: "status" },
			dataType: "json",
			type: 'POST'
		}).done(function(data) {
			if (data.time !== undefined) {
				var times = data.time.trim().split(":");
				songTime = parseInt(times[0]);
				songTotalTime = parseInt(times[1]);
			}
			playState = data.state.trim();
			if (playState == "play") {
				$("#controls_play_pause span").removeClass('ui-icon-play');
				$("#controls_play_pause span").addClass('ui-icon-pause');
			} else {
				$("#controls_play_pause span").removeClass('ui-icon-pause');
				$("#controls_play_pause span").addClass('ui-icon-play');
			}
			if (data.volume != -1) {
				$("#controls_vol_slider_inner").slider('value', data.volume);
				if (!$("#controls_vol_slider_inner").parent().is(':visible')) {
					$("#controls_vol_slider_inner").parent().show();
				}
			} else if ($("#controls_vol_slider_inner").parent().is(':visible')) {
				$("#controls_vol_slider_inner").parent().hide();
			}
		});
		$.ajax({
			url: 'query.php',
			data: { c: "currentsong" },
			dataType: "json",
			type: 'POST'
		}).done(function(data) {
			$('#status #current_song').text(data.Title);
			$('#status #current_artist').text(data.Artist);
			currentSongId = data.Id;
			$("#playlist li").removeClass("ui-state-highlight");
			$("#playlist .group").removeClass("ui-state-highlight");
			$("#playlist li[track-id='" + currentSongId + "']").addClass("ui-state-highlight");
			$("#playlist li[track-id='" + currentSongId + "']").parents(".group").find('.head').addClass("ui-state-highlight");
		});
	}

	$("#playslide").slider('value', songTime / songTotalTime * 10000);
	$('#playheadTime').text(secondsToTime(songTime));
	$('#playheadTotal').text(secondsToTime(songTotalTime));

	timerTime += increment / 1000;
}

jQuery.fn.reverse = [].reverse;

var playlist;
var playlist_version = -1;

var visibilities = {};
var dragging_stop = false;

function regroupPlaylist() {
	var currentAlbum = "";
	var first = true;

	var i;
	var sortable_string = "";
	var new_html = '</ul></div></div>';
	for (i=playlist.length-1; i>=0; i--) {
		if (playlist[i].Album != currentAlbum && !first) {
			new_html = '</ul></div></div><div class="group"><div class="head">\
				<h3>' + currentAlbum + '</h3>\
				<h4>' + playlist[i+1].Artist + '</h4>\
				<br style="clear: both;"></div><div>\
				<ul class="subplaylist" id="subplaylist' + i + '">' + new_html;
			sortable_string += "#subplaylist" + i + ", ";
		}
		var trackNum = parseInt(playlist[i].Track);
		if (trackNum < 10) trackNum = "0" + trackNum;
		new_html = '<li name="' + i + '" track-id="' + playlist[i].Id + '">' + trackNum
			+ '. <a href="javascript:playTrack(\'' + i + '\');">' + playlist[i].Title + '</a></li>' + new_html;
		currentAlbum = playlist[i].Album;
		first = false;
	}
	if (playlist.length > 0)
		new_html = '<div class="group">\
			<div class="head">\
			<h3>' + currentAlbum + '</h3>\
			<h4>' + playlist[i+1].Artist + '</h4>\
			<br style="clear: both;"></div><div>\
			<ul class="subplaylist" id="subplaylist' + i + '">' + new_html;
	sortable_string += "#subplaylist" + i;

	$("#playlist").html(new_html);

	$('#playlist .group .head').click(function() {
		if (dragging_stop) {
			dragging_stop = false;
		} else {
			$(this).next().toggle();
			visibilities[$(this).text()] = $(this).next().is(':visible');
			if ($(this).next().is(':visible'))
				$(this).addClass('ui-state-active');
			else
				$(this).removeClass('ui-state-active');
			return false;
		}
	});
	$('#playlist .group .head').each(function() {
		if (visibilities[$(this).text()] === undefined || visibilities[$(this).text()] == false)
			$(this).next().hide();
		else
			$(this).addClass('ui-state-active');
	});
	$('#playlist .group .head').next().addClass('ui-widget-default ui-corner-bottom');
	$('#playlist .group .head').addClass('ui-widget-content ui-corner-all');

	$('#playlist').sortable({
		axis: "y",
		handle: ".head",
		distance: 15,
		stop: function( event, ui ) {
			// IE doesn't register the blur when sorting
			// so trigger focusout handlers to remove .ui-state-focus
			ui.item.children( ".head" ).triggerHandler( "focusout" );
			dragging_stop = true;
			updatePlaylist();
		}
	}).disableSelection();

	$(sortable_string).sortable({
		placeholder: "ui-state-highlight",
		connectWith: ".subplaylist",
		stop: function(event, ui) { updatePlaylist(); }
	}).disableSelection();

	console.log('Creating the context menu');
	$.contextMenu({
		selector: "#playlist .group .head",
		items: {
			"remove": {name: "Remove", icon: "delete", callback: function(key, opt) {
				var command = '';
				opt.$trigger.next().find('li').each(function() {
					command += 'deleteid ' + $(this).attr('track-id') + "\n";
				});
				command += 'allplaylistinfo';

				$.ajax({
					url: 'query.php',
					data: {c: command},
					dataType: 'json',
					type: 'POST'
				}).done(function(data) {
					playlist = data;
					regroupPlaylist();
				});
			}},
		}
	});

	$.contextMenu({
		selector: "#playlist ul.subplaylist li",
		items: {
			"remove": {name: "Remove", icon: "delete", callback: function(key, opt) {
				var command = 'deleteid ' + opt.$trigger.attr('track-id') + "\n";
				command += 'allplaylistinfo';

				$.ajax({
					url: 'query.php',
					data: {c: command},
					dataType: 'json',
					type: 'POST'
				}).done(function(data) {
					playlist = data;
					regroupPlaylist();
				});
			}},
		}
	});

}

function playTrack(id) {
	$.ajax({
		url: 'query.php',
		data: { c: "play " + id },
		dataType: "json",
		type: 'POST'
	});
	songTime = 0;
	updateStatus(true);
}

function updatePlaylist() {
	var new_playlist = [];
	$("#playlist li").each(function(index) {
		new_playlist.push(playlist[$(this).attr("name")]);
	});

	playlist = new_playlist;

	var command = "clear\n";
	var newPos = 0;
	for (var i=0;i<playlist.length;i++) {
		command += 'addid "' + playlist[i].file + '" ' + i + "\n";
		if (playlist[i].Id == currentSongId)
			newPos = i;
	}
	if (playState != "stop") {
		command += 'seek ' + newPos + ' ' + songTime + "\n";
		if (playState == "pause")
			command += "pause\n";
	}

	command += "allplaylistinfo";

	$.ajax({
		url: 'query.php',
		data: { c: command},
		dataType: 'json',
		type: 'POST'
	}).done(function(data) {
		playlist = data;
		regroupPlaylist();
	});

}
