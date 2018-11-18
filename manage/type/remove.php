<?php
require '../../config.php';

  $type=$_POST['type'];
  mysqli_query($con,"DELETE FROM `type` WHERE `type` = '$type'");
 echo "success";
 mysqli_close($con);
?>
