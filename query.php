<?php

if (!isset($_POST['c'])) die();

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once('mpd.php');

function parseResult($data) {
	$answer = array();
	foreach(preg_split("/((\r?\n)|(\r\n?))/", $data) as $line) {
		if (trim($line) == '') continue;
		if (trim($line) == 'OK') break;
		$tData = explode(':', $line, 2);
		$answer[trim($tData[0])] = trim($tData[1]);
	}
	return $answer;
}

function parseSongResult($data) {
	$answers = array();
	$this_answer = array();
	foreach(preg_split("/((\r?\n)|(\r\n?))/", $data) as $line) {
		if (trim($line) == '') continue;
		if (trim($line) == 'OK') break;
		$tData = explode(':', $line, 2);
		if (!strcmp(trim($tData[0]), 'directory')) continue;
		if (!strcmp(trim($tData[0]), 'file')) {
			if (!empty($this_answer)) array_push($answers, $this_answer);
			$this_answer = array();
		}
		$this_answer[trim($tData[0])] = trim($tData[1]);
	}
	return $answers;
}

$mpd = new MPD();
$mpd->connect('localhost', 6600);


foreach(preg_split("/((\r?\n)|(\r\n?))/", $_POST['c']) as $command){
	if (!strcmp(trim($command), 'allplaylistinfo')) {
		$r = $mpd->query('status');
		$aa = parseResult($r['data']);
		$l = $aa['playlistlength'];
		$a = array();
		for ($i=0;$i<$l;$i++) {
			$t = $mpd->query('playlistinfo ' . $i);
			$a[$i] = parseResult($t['data']);
		}
	} else if (!strcmp(trim($command), 'makejsondb')) {
		if (!file_exists('db') || !is_dir('db')) {
			if (!@mkdir('db')) {
				error('Error', 'Database folder (\'db/\') does not exist and cannot be created.');
			}
		}
		$r = $mpd->query('stats');
		$aa = parseResult($r['data']);
		$r = $mpd->query('listallinfo');
		$songs = parseSongResult($r['data']);

		// Create the albums and artists objects
		$albums = array();
		$artists = array();

		for ($i=0; $i<count($songs);$i++) {
			if (!isset($songs[$i]['AlbumArtist']) && !isset($songs[$i]['Artist'])) continue;
			$n_artist = isset($songs[$i]['AlbumArtist']) ? $songs[$i]['AlbumArtist'] : $songs[$i]['Artist'];
			$t_artist = strtolower($n_artist);
			if (!isset($artists[$t_artist])) {
				$artists[$t_artist] = array(
					'name' => $n_artist,
					'albums' => array()
				);
			}
			$l_album = 'unknown - ' . $t_artist;
			if (isset($songs[$i]['Album'])) {
				$l_album = strtolower($songs[$i]['Album']);
			}
			if (!in_array($l_album, $artists[$t_artist]['albums'])) {
				array_push($artists[$t_artist]['albums'], $l_album);
			}
			if (!isset($albums[$l_album])) {
				$albums[$l_album] = array(
					'name' => isset($songs[$i]['Album']) ? $songs[$i]['Album'] : 'Unknown',
					'artist' => $n_artist,
					'songs' => array()
				);
			}
			if (isset($songs[$i]) && isset($songs[$i]['Title']) && isset($songs[$i]['file'])) {
				array_push($albums[$l_album]['songs'], array(
					'Title' => $songs[$i]['Title'],
					'Track' => isset($songs[$i]['Track']) ? $songs[$i]['Track'] : -1,
					'file' => $songs[$i]['file'],
					'idx' => $i
				));
			}
		}

		$a = array(
			'songs' => $songs,
			'artists' => $artists,
			'albums' => $albums
		);

		if (@file_put_contents('db/' . $aa['db_update'] . '.json', json_encode($a)) === false) {
			error('Error', 'Database folder does is not writable. Check folder permissions.');
		}
	} else {
		$r = $mpd->query($command);
		$a = parseResult($r['data']);
	}
}

header('Content-Type: application/json');
echo json_encode($a);

$mpd->disconnect();

function error($title, $message) {
	header('HTTP/1.1 500 Jamwec PHP Error');
	header('Content-Type: application/json');
	die(json_encode(array('title' => $title, 'message' => $message)));
}

?>

