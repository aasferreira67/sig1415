<?php

$dbconn = pg_connect("host=localhost  port=5432 dbname=routing user=postgres password=geoserver")
or die('Could not connect: ' . pg_last_error());


$query = $_REQUEST['query'];

$result = pg_query($dbconn, "SELECT nome,endereco,tipo,subsistema,lat,lon FROM escolas WHERE nome LIKE '%{$query}%'");

	
echo json_encode(array_values(pg_fetch_all($result)));

	
?>
