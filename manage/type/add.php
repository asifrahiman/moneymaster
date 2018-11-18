<?php
require '../../config.php';
 $type=$_POST['type'];
 mysqli_query($con,"INSERT INTO type (type)VALUES ('$type')");
 echo "success";
 mysqli_close($con);
?>
