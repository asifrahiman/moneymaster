<?php
require '../../config.php';

  $user=$_POST["user"];
 mysqli_query($con,"INSERT INTO users (user)VALUES ('$user')");
 echo "success";
 mysqli_close($con);
?>
