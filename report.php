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
</head>
<script>
var app = angular.module("moneymaster", []); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.items = [];
	$scope.editindex=-1;
	$scope.addamount=""
	$scope.adddate=""
	$scope.addtype=""
	$http({
		method: 'GET',
		url: 'get.php'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			post = success.data[i];
			$scope.items.push({'Dbid':post.dbid,'Date':post.date,'Type':post.type,'Amount':post.amount,'IsCredit':post.isCredit});
		}$scope.items1 = $scope.items;
	},function (error){
		alert(error);
	});
	$scope.reset = function () {
		$scope.mindate =null;
		$scope.maxdate =null;
		$("#to_date").val("").datepicker("update");
		$("#from_date").val("").datepicker("update");
	}
	var d = new Date();
	var mm = d.getMonth()+1;
	var yyyy = d.getFullYear();
	if(mm<10) {
		mm = '0'+mm;
	} 
	var d = yyyy+'-'+mm+'-'+'01';
	$scope.mindate = d;
	$('#from_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).on('changeDate', function (ev) {$scope.mindate = $("#from_date").val();$scope.$apply();});
	$('#to_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).on('changeDate', function (ev) {$scope.maxdate = $("#to_date").val();$scope.$apply();});
	$scope.downloadreport = function () 
	{
		var data1=$scope.mindate;
		var data2=$scope.maxdate;
		var dataString = 'mindate='+ data1 + '&maxdate='+ data2;
		window.location = 'download.php?'+dataString;
	}
});     
app.filter('rangeFilter', function() {
	return function( items, filtext1, filtext2 ) {
		if(filtext1&&filtext2){
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.Date >= filtext1 && item.Date <= filtext2 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext1){
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.Date >= filtext1 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext2){
			var filtered = [];
			angular.forEach(items, function(item) {
				if(item.Date <= filtext2 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else
		return items;
    };
});
app.filter('unique', function () {
	return function (items, filterOn) {
		if (filterOn === false) {
			return items;
		}
		if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
			var hashCheck = {}, newItems = [];
			var extractValueToCompare = function (item) {
				if (angular.isObject(item) && angular.isString(filterOn)) {
					return item[filterOn];
				} else {
					return item;
				}
			};
			angular.forEach(items, function (item) {
				var valueToCheck, isDuplicate = false;
				for (var i = 0; i < newItems.length; i++) {
					if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
						isDuplicate = true;
						break;
					}
				}
				if (!isDuplicate) {
					newItems.push(item);
				}
			});
			items = newItems;
		}
		return items;
	};
});
app.filter('total', function () {
	return function (items) {
	var i =  items.length;
	var total = 0;
	while (i--)
		if(items[i]['Type']=="Credit")
			total -= parseFloat(items[i]['Amount']);
		else
			total += parseFloat(items[i]['Amount']);
	return total.toFixed(2);
	}
});
app.filter('sumByKey', function() {
	return function(data, key) {
		if (typeof(data) === 'undefined' || typeof(key) === 'undefined') {
			return 0;
		}
		var sum = 0;
		for (var i = data.length - 1; i >= 0; i--) {
			if(data[i]['Type']==key)
			sum += parseFloat(data[i]['Amount']);
		}
		return sum.toFixed(2);
	};
});
app.filter('credittotal', function () {
	return function (items) {
	var i =  items.length;
	var  credittotal= 0;
	while (i--)
		if(items[i]['IsCredit']==1)
		{
			credittotal += parseFloat(items[i]['Amount']);
		}
	return credittotal.toFixed(2);
	}
});
</script>

<body ng-app="moneymaster" ng-controller="myCtrl">
<div class="header1">
	<?php include("utils/header.php");?>
	</br>
	<div class = "container" >
		<div id = "filter" class = "row">
			<div class = "col-sm-2" ></div>
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