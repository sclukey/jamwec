<?php

error_reporting(-1);

class MPD
{
	private $fp;
	private $version;
	
	function connect($host, $port)
	{
		$errstr = 'Connected to MPD';
		$this->fp = fsockopen( $host, $port, $errno, $errstr, 10 );
		
		if(! is_resource( $this->fp ))
		{
			die("{$errstr} ({$errno})<br>");
		}

		// Get version
		while(!feof($this->fp)) {
			$line = fgets($this->fp);
			if (preg_match('/^OK\s*(.*)$/', trim($line), $matches)) {
				$this->version = $matches[1];
				break;
			}
		}
	}
	
	function disconnect()
	{
		fclose($this->fp);
		//ob_end_flush();
	}

	function query($command)
	{
		$response = array('data'=>'');
		fwrite($this->fp, trim($command)."\n");

		while(!feof($this->fp))
		{
			$line = fgets($this->fp);
			if (preg_match('/^OK\s*(.*)$/', trim($line), $matches)) {
				$response['result'] = 'OK';
				break;
			} else if (preg_match('/^ACK\s+\[(\d+)\@(\d+)\]\s+\{(.*?)\}\s+(.*)$/', trim($line), $matches)) {
				$response['result'] = 'ACK';
				$response['errno'] = $matches[1];
				$response['errmsg'] = $matches[4];
				break;
			} else {
				$response['data'] .= trim($line) . "\n";
			}
		}
		return $response;
	}
}

