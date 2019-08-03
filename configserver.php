<?php
$server="sql202.epizy.com";
$username="epiz_22968933";
$password="IxYoljSLo";
$db="epiz_22968933_moneymaster";
$con=mysqli_connect($server,$username,$password,$db);
// Check connection
if (mysqli_connect_errno()){
	echo "Failed to connect to MySQL: " . mysqli_connect_error();
    header("HTTP/1.0 500 Internal Server Error");
    die;
}
?>