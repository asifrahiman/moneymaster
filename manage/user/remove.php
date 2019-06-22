<?php
require '../../config.php';

  $user=$_POST['user'];
  
  
  mysqli_query($con,"DELETE FROM `users` WHERE `user` = '$user' ");
 echo "success";
 mysqli_close($con);
?>
