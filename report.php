<!DOCTYPE html>
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
		<link href="utils/bootstrap-datepicker.css" rel="stylesheet">  
		<script src="utils/jquery.js"></script>  
		<script src="utils/bootstrap.min.js"></script>  
		<script src="utils/bootstrap-datepicker.js"></script> 
		<script src="utils/angular.min.js"></script>
		<script src="utils/report.js"></script>
	</head>
	<body ng-app="moneymaster" ng-controller="myCtrl">
		<div class="header1">
			<?php include("utils/header.php");?>
			</br>
			<div class = "container" >
				<div id = "filter" class = "row">
					<div class = "col-sm-1" ></div>
					<div class = "col-sm-1" >
						<button class="btn btn-block btn-success" onclick="window.location='trend.php';">Trend</button>
					</div>
					<div class = "col-sm-2" ><div align = "right"><label>Filter By:</label></div></div>
					<div  class ="col-sm-2" >
						<input type="text" id="from_date"  placeholder="Select from date" ng-model="mindate">
					</div>
					<div  class ="col-sm-2" >
						<input type="text" id="to_date"  placeholder="Select to date" ng-model="maxdate">
					</div>
					<div  class ="col-sm-1" align = "right">
						<button class="btn btn-block btn-success" ng-click="reset()"> Clear </button>
					</div>	
					<div class = "col-sm-2"  align = "left" ><button class="btn btn-block btn-success" style = "width: 100%" ng-click="downloadreport()"> Download </button></div>
					<div  class ="col-sm-1" >
						<button onclick="window.location='/';" class="btn btn-block btn-primary"> Back </button> 
					</div>		
				</div>
			</div>
			</br>
			<table style="background-color:#ffff">
				<tr style="background-color:#595757;color:#ffff"><td>Type</td><td>Amount</td></tr>
				<tr ng-repeat="item in items | rangeFilter:mindate:maxdate| unique:'Type'| orderBy:'Type'" ng-class-even="'trcolour'" ><td> {{item.Type}} </td><td> {{items| rangeFilter:mindate:maxdate |sumByKey:item.Type}} </td></tr>
				<tr><td>Total</td><td> {{items| rangeFilter:mindate:maxdate |total}} </td></tr>
				<tr><td>Credit Card</td><td> {{items| rangeFilter:mindate:maxdate |credittotal}} </td></tr>
			</table>
		</div>
	</body>
</html>