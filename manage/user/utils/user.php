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
		$sel = mysqli_query($con,"SELECT * FROM `users`");
		$data = array();
		while ($row = mysqli_fetch_array($sel)) {
			$data[] = array("user"=>$row['user']);
		}
		echo json_encode($data);
		break;
	case 'POST':
		$user=$_POST["user"];
		if(!mysqli_query($con,"INSERT INTO users (user)VALUES ('$user')")){
			echo("Error description: " . mysqli_error($con));
			header("HTTP/1.0 500 Internal Server Error");
			die;
		}
		echo "success";
		break;
	case 'DELETE':
		$user=$_DELETE['user'];
		if(!mysqli_query($con,"DELETE FROM `users` WHERE `user` = '$user'")){
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
