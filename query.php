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
		$r = $mpd->query('stats');
		$aa = parseResult($r['data']);
		$r = $mpd->query('listallinfo');
		$a = parseSongResult($r['data']);
		file_put_contents('/home/sclukey/web-home/my_music/db/' . $aa['db_update'] . '.json', json_encode($a));
	} else {
		$r = $mpd->query($command);
		$a = parseResult($r['data']);
	}
}

echo json_encode($a);

$mpd->disconnect();
?>

