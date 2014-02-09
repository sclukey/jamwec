<!DOCTYPE html>
<html>
<head>
	<title>MPD Music Player</title>

	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, user-scalable=no">

	<script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
	<script src="https://code.jquery.com/ui/1.10.4/jquery-ui.min.js"></script>
	<script src="https://jquery-timer.googlecode.com/svn/trunk/jquery.timer.js"></script>
	<script src="plugins/jquery.contextMenu.js"></script>
	<script src="plugins/jquery.ui.position.js"></script>

	<link rel="stylesheet" type="text/css" href="plugins/jquery.contextMenu.css">
	<link rel="stylesheet" type="text/css" href="https://code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css">

	<link rel="stylesheet" type="text/css" href="styles.css">
	<script src="script.js"></script>
</head>
<body>
	<div id="dialog" title=""></div>
	<div id="main">
		<div id="library-holder">
			<div id="library_filter" class="ui-widget">
				<input id="search" autocomplete="off">
			</div>
			<div id="library_options">
				<div id="radio">
					<input type="radio" id="radio_artists" name="radio" value="artists" checked="checked"><label for="radio_artists">Artists</label>
					<input type="radio" id="radio_albums" name="radio" value="albums"><label for="radio_albums">Albums</label>
					<input type="radio" id="radio_search" name="radio" value="search"><label for="radio_search">Search</label>
					<!--<input type="radio" id="radio_songs" name="radio" value="songs"><label for="radio_songs">Songs</label>-->
				</div>
			</div>
			<br class="clearboth">
			<div id="library_artists" class="ui-widget libraries" style="display: none;"></div>
			<div id="library_albums" class="ui-widget libraries" style="display: none;"></div>
			<div id="library_search" class="ui-widget libraries" style="display: none;"></div>
		</div>
		<div id="playing">
			<div id="status">
				<h2 id="current_song"></h2>
				<h4 id="current_artist"></h4>
				<div>
					<div id="playslide"></div>
					<div id="playheadTime"></div>
					<div id="playheadTotal"></div>
				</div>
				<br style="clear: both;">
				<ul id="controls">
					<li class="ui-state-default ui-corner-all" id="controls_prev"><span class="ui-icon ui-icon-seek-first"></span></li>
					<li class="ui-state-default ui-corner-all" id="controls_play_pause"><span class="ui-icon ui-icon-play"></span></li>
					<li class="ui-state-default ui-corner-all" id="controls_stop"><span class="ui-icon ui-icon-stop"></span></li>
					<li class="ui-state-default ui-corner-all" id="controls_next"><span class="ui-icon ui-icon-seek-end"></span></li>
					<li id="controls_vol_slider"><div id="controls_vol_slider_inner"></div></li>
				</ul>
			</div>
			<div id="playlist-container">
				<h4>Playlist</h4>
				<a id="clear" href="javascript:;">(clear)</a>
				<div id="playlist">
				</div>
			</div>
		</div>
	</div>
</body>
</html>
