<?php
require 'config.php';
  session_start();
  $user=$_SESSION["user"]; 
  $type=$_POST['type'];
  $date=$_POST['date'];
  $amount=$_POST['amount'];
  $dbid=$_POST['dbid'];
  
  
  if (!mysqli_query($con,"UPDATE `expenses` SET  `type`='$type',`amount`='$amount',`date`='$date' WHERE `user`='$user' AND `id`=$dbid"))
 {
	 echo("Error description: " . mysqli_error($con));
 }
echo "success";
?>