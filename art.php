<?php

$debug = false;

error_reporting(E_ALL);
ini_set('display_errors', 1);

$_args = $_GET;

if (!isset($_args['artist'])) die ('No artist name set');

$type = isset($_args['type']) ? $_args['type'] : 'default';
$album = isset($_args['album']) ? preg_replace('/[[:punct:]]/', '', strtolower(trim($_args['album']))) : '';
$artist = isset($_args['artist']) ? preg_replace('/[[:punct:]]/', '', strtolower(trim($_args['artist']))) : '';
$title = $artist . ' - ' . $album;

$dir = 'albumart/' . md5(preg_replace('/ /', '', $album . $artist));
$artist_dir = 'albumart/' . md5(preg_replace('/ /', '', $artist));
if (!is_dir($dir) && !$debug) mkdir($dir);
if (!is_dir($artist_dir) && !$debug) mkdir($artist_dir);

if ($debug) echo 'Directory: ' . $dir . '<br>';
if ($debug) echo 'Artist Directory: ' . $artist_dir . '<br>';

$artist_url = '';

if ($type == 'artist') {
	$images = glob($artist_dir . '/*.jpeg');
} else {
	$images = glob($dir . '/*.jpeg');
}

if (count($images) == 0) {
	if ($debug) echo "Not cached<br>";
	// Download the art from Discogs
	$check_again = true;
	
	// See if we have checked in the past
	$timestamp = glob($dir . '/*.time');
	if (count($timestamp) > 0) {
		if ($debug) 'Found a timestamp: ' . $timestamp[0] . '<br>';
		$time = basename($timestamp[0], '.time');
		if (time() - $time < 2592000) {
			// Already checked, don't do it again
			if ($debug) echo "Already checked, don't do it again<br>";	
			$check_again = false;
		} else {
			unlink($timestamp[0]);
		}
	}
	
	if ($check_again) {
		
		// Find the release
		$url = 'http://api.discogs.com/database/search?type=master&release_title=' . urlencode($album)
		       . '&artist=' . urlencode($artist);

		$releases = discogs_query($url);
		if ($debug) echo 'Master release search url: ' . $url . "<br>";
		$releases->results = array_values(array_filter($releases->results, 'similar_test'));
		if ($debug) pretty_dump($releases->results);
	
		if (!isset($releases->results) || count($releases->results) == 0) {
			if ($debug) echo '<span style="color: #F00">No masters found, searching for normal releases</span><br>';
			$url = 'http://api.discogs.com/database/search?type=release&release_title=' . urlencode($album)
			       . '&artist=' . urlencode($artist);
			if ($debug) echo 'Release search url: ' . $url . '<br>';

			$releases = discogs_query($url);
			$releases->results = array_values(array_filter($releases->results, 'similar_test'));
			if ($debug) pretty_dump($releases->results);
		}

		if (isset($releases->results) && count($releases->results) >= 1) {
			$album_url = $releases->results[0]->resource_url;
			if ($debug) echo '<img src="' . $releases->results[0]->thumb . '"><br>';
			if ($debug) echo 'Release resource_url: ' . $album_url . "<br>";

			$rel = discogs_query($album_url);
			if ($debug) pretty_dump($rel);

			if (isset($rel->images)) {
				$found = false;
				for ($i=0; $i<count($rel->images); $i++) {
					if ($rel->images[$i]->type == 'primary') {
						$found = true;
						discogs_download_image($rel->images[$i]->uri, $dir . '/' . $rel->images[$i]->width . '.jpeg');
						if (isset($rel->images[$i]->uri150))
							discogs_download_image($rel->images[$i]->uri150, $dir . '/150.jpeg');
						$artist_url = $rel->artists[0]->resource_url;
					}
				}
				if (!$found) {
					discogs_download_image($rel->images[0]->uri, $dir . '/' . $rel->images[0]->width . '.jpeg');
					if (isset($rel->images[0]->uri150))
						discogs_download_image($rel->images[0]->uri150, $dir . '/150.jpeg');
					$artist_url = $rel->artists[0]->resource_url;
				}
			} else {
				// No images for release
				if ($debug) echo '<span style="color: #F00">No images found for this release</span><br>';
			}
		} else {
			// Could not find artwork
			if ($debug) echo '<span style="color: #F00">No releases found</span><br>';
		}
		
		// Get the artist info
		if ($artist_url != '') {
			if ($debug) echo '<p>Artist information:</p>';
			$rel = discogs_query($artist_url);
			if ($debug) pretty_dump($rel);
			
			if (isset($rel->images)) {
				$found = false;
				for ($i=0; $i<count($rel->images); $i++) {
					if ($rel->images[$i]->type == 'primary') {
						$found = true;
						discogs_download_image($rel->images[$i]->uri, $artist_dir . '/' . $rel->images[$i]->height . '.jpeg');
						if (isset($rel->images[$i]->uri150))
							discogs_download_image($rel->images[$i]->uri150, $artist_dir . '/' . round($rel->images[$i]->height / $rel->images[$i]->width * 150) . '.jpeg');
					}
				}
				if (!$found) {
					discogs_download_image($rel->images[0]->uri, $artist_dir . '/' . $rel->images[0]->height . '.jpeg');
					if (isset($rel->images[0]->uri150))
						discogs_download_image($rel->images[0]->uri150, $artist_dir . '/' . round($rel->images[0]->height / $rel->images[0]->width * 150) . '.jpeg');
				}
			}
		}
		
		if (!$debug) file_put_contents($dir . '/' . time() . '.time', $album . PHP_EOL . $artist . PHP_EOL);
	}
	
	if ($type == 'artist') {
		$images = glob($artist_dir . '/*.jpeg');
	} else {
		$images = glob($dir . '/*.jpeg');
	}
}

if (count($images) > 0) {
	if ($debug) echo "Cached<br>";
	if ($debug) pretty_dump($images);
	if ($debug) echo "<br>";
	if (isset($_args['width'])) {
		foreach ($images as $image) {
			$dim = basename($image, '.jpeg');
			$this_diff = $dim - $_args['width'];
			if ($this_diff == 0) {
				$match = $image;
				break;
			}
			elseif ($this_diff > 0 && (!isset($best_bigger_filename) || $this_diff < $best_bigger_diff)) {
				$best_bigger_diff = $this_diff;
				$best_bigger_filename = $image;
			}
			elseif ($this_diff < 0 && (!isset($best_smaller_filename) || $this_diff > $best_smaller_diff)) {
				$best_smaller_diff = $this_diff;
				$best_smaller_filename = $image;
			}
		}
		if (isset($match))
			$output = $match;
		elseif (isset($best_bigger_filename))
			$output = $best_bigger_filename;
		elseif (isset($best_smaller_filename))
			$output = $best_smaller_filename;
	}
} else {
	$output = 'images/unknown.png';
	if ($type == 'artist')
		$output = 'images/unknown_artist.png';
}

$mime = mime_content_type($output);
if ($mime == 'application/x-empty') {
	$output = 'images/unknown.png';
	$mime = mime_content_type($output);
}

if ($debug) echo 'Output image: ' . $output . '<br>';

if ($debug) $fp = false;
else $fp = fopen($output, 'rb');

if ($fp === false && !$debug) {
	if ($debug) echo 'Cannot read image';
	exit;
}

if (!$debug) header('Content-Type: ' . mime_content_type($output));
if (!$debug) header('Content-Length: ' . filesize($output));

if (!$debug) fpassthru($fp);

function similar_test($result) {
	global $title;
	
	similar_text($title, preg_replace('/[[:punct:]]/', '', strtolower(trim($result->title))), $percent);
	return $percent > 80;
}

function discogs_query($url) {
	$ch = curl_init($url);

	curl_setopt($ch, CURLOPT_ENCODING, '');
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_USERAGENT, 'Jamwec/0.1 +http://github.com/sclukey/jamwec');

	$response = curl_exec($ch);
	curl_close($ch);

	return json_decode($response);
}
function discogs_download_image($url, $dest) {
	global $debug;
	
	if ($debug) echo '<p>Downloading: ' . $url . ' <br>to: ' . $dest . '</p>';
	
	$ch = curl_init($url);
	
	if (!$debug) {
		$fp = fopen($dest, 'w');
		if ($fp === false) return;
		curl_setopt($ch, CURLOPT_FILE, $fp);
	}

	curl_setopt($ch, CURLOPT_HEADER, $debug);
	curl_setopt($ch, CURLOPT_NOBODY, $debug);
	curl_setopt($ch, CURLOPT_VERBOSE, $debug);
	curl_setopt($ch, CURLOPT_USERAGENT, 'Jamwec/0.1 +http://github.com/sclukey/jamwec');

	curl_exec($ch);
	curl_close($ch);
	
	if (!$debug) {
		fclose($fp);
	}
}

function pretty_dump($variable, $height='17em') {
	echo "<pre style=\"border: 1px solid #000; height: {$height}; overflow: auto; margin: 0.5em; padding: 5px\">";
	var_dump($variable);
	echo "</pre>\n";
}

?>
