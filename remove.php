<?php
session_start();

require 'config.php';
$user=$_SESSION["user"];
$dbid=$_POST['dbid'];
  
  if (!mysqli_query($con,"DELETE FROM `expenses` WHERE `id` = $dbid and `user` = '$user' "))
 {
	 echo("Error description: " . mysqli_error($con));
         header("HTTP/1.0 500 Internal Server Error");
         die;
 }
 else
 {
	 echo("success");
 }
 mysqli_close($con);
?>
