<?php
require '../../config.php';

$sel = mysqli_query($con,"SELECT * FROM `type`");
$data = array();

while ($row = mysqli_fetch_array($sel)) {
 $data[] = array("type"=>$row['type']);
}
echo json_encode($data);
mysqli_close($con);
?>
