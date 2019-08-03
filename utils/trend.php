<?php
require 'config.php';
session_start();
error_reporting(0);
$user=$_SESSION["user"];
$method = $_SERVER['REQUEST_METHOD'];
$data->animationEnabled = true;
$title->text = "Expense Trend";
$data->title = $title;
$axisX->valueFormatString = "MMM,YY";
$data->axisX = $axisX;
$axisY->title = "Amount in RS";
$axisY->includeZero = false;
$data->axisY = $axisY;
$legend->cursor = "pointer";
$legend->fontSize = 16;
$legend->itemclick = toggleDataSeries;
$data->legend = $legend;
$toolTip->shared = true;
$data->toolTip = $toolTip;
$data->data = array();
$sel = mysqli_query($con,"SELECT * FROM `type`");
$i=1;
while ($row = mysqli_fetch_array($sel)) {
	${'type'.$i}->name = $row['type'];
	${'type'.$i}->type = "line";
	${'type'.$i}->showInLegend = true;
	${'type'.$i}->dataPoints = array();
	$j=12;
	while ($j>=0) {
		$time = date('Y-m',strtotime("-".$j." month"));
		${'data'.$i.$j}->label=$time;
		$result = mysqli_query($con,"SELECT SUM(amount) as expense from expenses where type='".$row['type']."' and user='".$user."' and date like '".$time."%'");
		$expense = mysqli_fetch_assoc($result);
		${'data'.$i.$j}->y=(double)($expense['expense']);
		array_push(${'type'.$i}->dataPoints, ${'data'.$i.$j});
		$j--;
	}
	array_push($data->data, ${'type'.$i});
	$i++;
}
switch ($method) {
	case 'GET':
		header('Content-Type: application/json');
		echo json_encode($data);
		break;
	default:
		header("HTTP/1.0 500 Internal Server Error");
		die;
		break;
}
mysqli_close($con);
?>