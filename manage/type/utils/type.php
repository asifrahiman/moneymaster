<?php
require '../../../utils/config.php';
$method = $_SERVER['REQUEST_METHOD'];
if ($method == "PUT" || $method == "DELETE") {
	parse_str(file_get_contents('php://input'), $params);
	$GLOBALS["_{$method}"] = $params;
	// Add these request vars into _REQUEST, mimicing default behavior, PUT/DELETE will override existing COOKIE/GET vars
	$_REQUEST = $params + $_REQUEST;
}
switch ($method) {
	case 'GET':
		$sel = mysqli_query($con,"SELECT * FROM `type`");
		$data = array();
		while ($row = mysqli_fetch_array($sel)) {
		 $data[] = array("type"=>$row['type']);
		}
		echo json_encode($data); 
		break;
	case 'POST':
		$type=$_POST['type'];
		if(!mysqli_query($con,"INSERT INTO type (type)VALUES ('$type')")){
			echo("Error description: " . mysqli_error($con));
			header("HTTP/1.0 500 Internal Server Error");
			die;
		}
		echo "success"; 
		break;
	case 'DELETE':
		$type=$_DELETE['type'];
		if(!mysqli_query($con,"DELETE FROM `type` WHERE `type` = '$type'")){
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
