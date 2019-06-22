<?php
require 'config.php';
  session_start();
  $user=$_SESSION["user"]; 
  $type=$_POST['type'];
  $date=$_POST['date'];
  $amount=$_POST['amount'];
  $dbid=$_POST['dbid'];
  $isCredit= (int)$_POST['isCredit'];

  if (!mysqli_query($con,"UPDATE `expenses` SET  `type`='$type',`amount`='$amount',`date`='$date',`isCredit`='$isCredit' WHERE `user`='$user' AND `id`=$dbid"))
 {
	 echo("Error description: " . mysqli_error($con));

         header("HTTP/1.0 500 Internal Server Error");
         die;
 }
echo "success";
?>