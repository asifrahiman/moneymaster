<?php
require 'config.php';
session_start();
$user=$_SESSION["user"];
$method = $_SERVER['REQUEST_METHOD'];
if ($method == "PUT" || $method == "DELETE") {
	parse_str(file_get_contents('php://input'), $params);
	$GLOBALS["_{$method}"] = $params;
	// Add these request vars into _REQUEST, mimicing default behavior, PUT/DELETE will override existing COOKIE/GET vars
	$_REQUEST = $params + $_REQUEST;
}
switch ($method) {
	case 'GET':
		if(isset($_GET["start_date"])){
			$start_date = $_GET["start_date"];
		}else{
			$start_date = date('Y-m-d', strtotime("-60 days"));
		}
		$sel = mysqli_query($con,"SELECT * FROM `expenses` WHERE `user`='$user' and date >'$start_date'");
		$data = array();
		while ($row = mysqli_fetch_array($sel)) {
			$data[] = array("dbid"=>$row['id'],"user"=>$row['user'],"type"=>$row['type'],"date"=>$row['date'],"amount"=>$row['amount'],"isCredit"=>$row['isCredit']);
		}
		echo json_encode($data);
		break;
	case 'POST':
		$type=$_POST['type'];
		$date=$_POST['date'];
		$amount=$_POST['amount'];
		$isCredit=$_POST['isCredit'];
		if(!mysqli_query($con,"INSERT INTO `expenses` (`user`, `type`, `amount`,`date`,`isCredit`) VALUES  ('$user', '$type','$amount', '$date', '$isCredit' )")){
			echo("Error description: " . mysqli_error($con));
			header("HTTP/1.0 500 Internal Server Error");
			die;
		}
		$dbid=mysqli_insert_id($con);
		echo $dbid;
		break;
	case 'PUT':
		$type=$_PUT['type'];
		$date=$_PUT['date'];
		$amount=$_PUT['amount'];
		$dbid=$_PUT['dbid'];
		$isCredit= (int)$_PUT['isCredit'];
		if(!mysqli_query($con,"UPDATE `expenses` SET  `type`='$type',`amount`='$amount',`date`='$date',`isCredit`='$isCredit' WHERE `user`='$user' AND `id`=$dbid")){
			echo("Error description: " . mysqli_error($con));
			header("HTTP/1.0 500 Internal Server Error");
			die;
		}
		echo "success";
		break;
	case 'DELETE':
		$dbid=$_DELETE['dbid'];
		if(!mysqli_query($con,"DELETE FROM `expenses` WHERE `id` = $dbid and `user` = '$user'")){
			echo("Error description: " . mysqli_error($con));
			header("HTTP/1.0 500 Internal Server Error");
			die;
		}
		echo "success";  
		break;
	default:
		header("HTTP/1.0 500 Internal Server Error");
		die;
		break;
}
mysqli_close($con);
?>
