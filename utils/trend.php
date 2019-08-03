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
$type->name = "Myrtle Beach";
$type->type = "spline";
$type->showInLegend = true;
$dataPoints->x="2017-6-24";
$dataPoints->y=31;
$type->dataPoints = array($dataPoints);
$data->data = array($type);

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