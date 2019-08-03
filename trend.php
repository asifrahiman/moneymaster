<!DOCTYPE HTML>
<html>
	<head>
		<meta charset="UTF-8">
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name="description" content="Bandwidth Utilisation">
		<meta name="author" content="Asif Abdul Rahiman">
		<title>Moneymaster</title>
		<link rel="shortcut icon" href="utils/favicon.ico" type="image/x-icon">
		<link rel="icon" href="utils/favicon.ico" type="image/x-icon">
		<link rel="stylesheet" type="text/css" href="utils/mystyle.css">
		<link href="utils/bootstrap.min.css" rel="stylesheet">
		<script src="utils/jquery.js"></script>  
		<script src="utils/canvasjs.js"></script>  
		<script src="utils/bootstrap.min.js"></script>
		<script src="utils/trend.js"></script>
	</head>
	<body ng-app="moneymaster" ng-controller="myCtrl">
		<div class="header1">
			<?php include("utils/header.php");?>
			</br>
			<div class = "container" >
				<div id="chartContainer" style="height: 370px; width: 100%;"></div>
			</div>
			</br>
		</div>
	</body>
</html>