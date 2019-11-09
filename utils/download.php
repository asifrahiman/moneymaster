<?php
require 'config.php';
$user=$_COOKIE["user"];
$mindate=$_GET['mindate'];
$maxdate=$_GET['maxdate'];
$sql="SELECT `type` AS Type ,SUM(amount) AS Amount FROM `expenses` ";
$sql2="SELECT `type` AS Type ,amount AS Amount, date AS Date FROM `expenses` ";
$params="WHERE `user` = '$user' ";
function mysqli_field_name($result, $field_offset){
	$properties = mysqli_fetch_field_direct($result, $field_offset);
	return is_object($properties) ? $properties->name : null;
}
if($mindate!="undefined"&& $mindate!="NULL"&& $mindate!=""){
	$params.="and `date` >= '$mindate'";
}
if($maxdate!="undefined"&& $maxdate!="NULL"&& $maxdate!=""){
	$params.="and `date` <= '$maxdate'";
}
$params1="GROUP BY `type`";
$result = mysqli_query($con,$sql.$params.$params1);
$result2 = mysqli_query($con,$sql2.$params);
date_default_timezone_set("Asia/Kolkata");
$filename="moneymaster_".date("d/m/Y");
//header info for browser
header("Content-type: application/octet-stream");
header("Content-Disposition: attachment; filename=$filename.txt");  
header("Pragma: no-cache"); 
header("Expires: 0");
/*******Start of Formatting for Excel*******/   
//define separator (defines columns in excel & tabs in word)
//start of printing column names as names of MySQL fields
for ($i = 0; $i < mysqli_num_fields($result); $i++) {
	echo str_pad(mysqli_field_name($result2,$i), 20);
}
print("\n");    
//end of printing column names  
//start while loop to get data
while($row = mysqli_fetch_row($result)){
	$schema_insert = str_pad("$row[0]", 20).str_pad("$row[1]", 20);
	print($schema_insert);
	print "\n";
}
print "\n\nDetailed Report:\n";
for ($i = 0; $i < mysqli_num_fields($result2); $i++) {
	echo str_pad(mysqli_field_name($result2,$i), 20);
}
print "\n";
while($row = mysqli_fetch_row($result2)){
	$schema_insert = str_pad("$row[0]", 20).str_pad("$row[1]", 20).str_pad("$row[2]", 20);
	print($schema_insert);
	print "\n";
}	
?>