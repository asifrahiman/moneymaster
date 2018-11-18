<?php
session_start();

require 'config.php';
$user=$_SESSION["user"];
$start_date = date('Y-m-d', strtotime("-60 days"));
$sel = mysqli_query($con,"SELECT * FROM `expenses` WHERE `user`='$user' and date >'$start_date'");
$data = array();

while ($row = mysqli_fetch_array($sel)) {
 $data[] = array("dbid"=>$row['id'],"user"=>$row['user'],"type"=>$row['type'],"date"=>$row['date'],"amount"=>$row['amount']);
}
echo json_encode($data);
mysqli_close($con);
?>
