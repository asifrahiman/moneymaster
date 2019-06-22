<?php
require 'config.php';
session_start();
  $user=$_SESSION['user'];
  $type=$_POST['type'];
  $date=$_POST['date'];
  $amount=$_POST['amount'];
  $isCredit=$_POST['isCredit'];

 if (!mysqli_query($con,"INSERT INTO `expenses` (`user`, `type`, `amount`,`date`,`isCredit`) VALUES  ('$user', '$type','$amount', '$date', '$isCredit' )"))
 {
	 echo("Error description: " . mysqli_error($con));
         header("HTTP/1.0 500 Internal Server Error");
         die;
 }
 $dbid=mysqli_insert_id($con);

 echo $dbid;
 mysqli_close($con);
?>
	