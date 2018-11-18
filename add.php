<?php
require 'config.php';
session_start();
  $user=$_SESSION['user'];
  $type=$_POST['type'];
  $date=$_POST['date'];
  $amount=$_POST['amount'];
  

  
 if (!mysqli_query($con,"INSERT INTO `expenses` (`user`, `type`, `amount`,`date`) VALUES  ('$user', '$type','$amount', '$date' )"))
 {
	 echo("Error description: " . mysqli_error($con));
 }
 $dbid=mysqli_insert_id($con);

 echo $dbid;
 mysqli_close($con);
?>
