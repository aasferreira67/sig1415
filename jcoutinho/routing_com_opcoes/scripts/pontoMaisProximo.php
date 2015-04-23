<?php
    // Connecting, selecting database
    $dbconn = pg_connect("host=127.0.0.1  port=5432 dbname=routing2 user=geoserver password=geoserver")
    or die('Could not connect: ' . pg_last_error());
     
    // Get Parameters
    $x = (double)($_GET["x"]);
    $y = (double)($_GET["y"]);
     
    // Execute SQL to find closest vertex to map click
    $sql = 'SELECT n.id, st_x(ST_Transform(n.geom_vertex,3857)) as x, st_y(st_transform(n.geom_vertex,3857)) as y
    FROM (SELECT ST_SetSRID(ST_Point('.$x.','.$y.'),
    3857) As geom) As b LEFT JOIN rede_viaria_bv_vertex As n
    ON ST_DWithin(ST_Transform(n.geom_vertex,3857), st_transform(b.geom,3857), 1000)
    ORDER BY ST_Distance(ST_Transform(n.geom_vertex,3857), b.geom)
    LIMIT 1;';

	$result = pg_query($sql);
	$num_rows = pg_num_rows($result);

	if($num_rows > 0){
		echo json_encode(array_values(pg_fetch_all($result)));
	}
	else{
		echo null;
	}

?>
