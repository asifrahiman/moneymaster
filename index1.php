<!DOCTYPE html>
<?php
session_start();
if(isset($_POST["user"]))
$_SESSION["user"] = $_POST["user"];
?>
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
<script src="utils/dirPagination.js"></script>
</head>

<script>
var app = angular.module("moneymaster", ['angularUtils.directives.dirPagination']); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.items = [];
	$scope.types =[];
	$scope.user="<?php echo $_SESSION["user"]?>";
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
    $scope.items.push({'Dbid':post.dbid,'Date':post.date,'Type':post.type,'Amount':post.amount});
  }
   },function (error){
   
   //alert(error);
   
   });
   $http({
      method: 'GET',
      url: 'manage/type/get.php'
   }).then(function (success){
   
	var _len = success.data.length;
  var  post, i;

  for (i = 0; i < _len; i++) {
		post = success.data[i];
    $scope.types.push({'Type':post.type});
  }
   },function (error){
   
   //alert(error);
   
   });
	$scope.addItem = function () {
        $scope.errortext = "";
		$scope.adddate = $("#input_date").val();
		if($scope.addtype=="Others")
			$scope.addtype=document.getElementById("otherstype").value;
        if (!$scope.addamount||!$scope.addtype) {alert("Please fill all the details");return;} 
		$("#input_date").val('');
		
			if($scope.editindex==-1)
			{
				
				if(!$scope.adddate)
				{
					var today = new Date();
					var dd = today.getDate();
					var mm = today.getMonth()+1; //January is 0!
					var yyyy = today.getFullYear();
					if(dd<10) {
						dd = '0'+dd
					} 
					if(mm<10) {
						mm = '0'+mm
					} 
					today = yyyy + '-' + mm + '-' + dd;
					$scope.adddate=today;
				}
				var nitem={'Date':$scope.adddate,'Type':$scope.addtype,'Amount':$scope.addamount};
				$scope.items.push(nitem);
				var data1=$scope.addtype;
				var data2=$scope.adddate;
				var data3=$scope.addamount;
				var dataString = 'type='+ data1 + '&date='+ data2 + '&amount='+ data3 ;
				$.ajax({
					type: "POST",
					url: "add.php",
					data: dataString,
					cache: false,
					success: function(result){
						$scope.items[$scope.items.indexOf(nitem)].Dbid=parseInt(result);
					}
				});
			}
			else
			{
				var nitem={'Date':$scope.adddate,'Type':$scope.addtype,'Amount':$scope.addamount,'Dbid':$scope.items[$scope.editindex].Dbid};
				var newitem=true;
				if(!$scope.adddate)
				{
					$scope.adddate=$scope.items[$scope.editindex].Date;
				}
				$scope.items[$scope.editindex].Type=$scope.addtype;
				$scope.items[$scope.editindex].Date=$scope.adddate;
				$scope.items[$scope.editindex].Amount=$scope.addamount;
				var data1=$scope.addtype;
				var data2=$scope.adddate;
				var data3=$scope.addamount;
				var data4=$scope.items[$scope.editindex].Dbid;
				var dataString = 'type='+ data1 + '&date='+ data2 + '&amount='+ data3 +'&dbid='+ data4;
				$.ajax({
					type: "POST",
					url: "update.php",
					data: dataString,
					cache: false,
					success: function(result){}
				});
				
			}
			$scope.addtype=""
			$scope.adddate=""
			$scope.addamount=""
			$scope.editindex=-1;
			$scope.othersType=false;
			document.getElementById("otherstype").value="";	
			    
	}
	$scope.removeItem = function (x) {
		var index = $scope.items.indexOf(x);
		if (index != -1) {
        $scope.errortext = ""; 
		var datastring = 'dbid='+ $scope.items[index].Dbid;
		$.ajax({
		type: "POST",
		url: "remove.php",
		data: datastring,
		cache: false,
		success: function(result){}
		});
        $scope.items.splice(index, 1);
		}
    }
	$scope.editItem = function (x) {
		var index = $scope.items.indexOf(x);
		var found=false;
		for (i = 0; i < document.getElementById("TypeSelect").length; ++i){
			if (document.getElementById("TypeSelect").options[i].value == $scope.items[index].Type){
				found=true;
			}
		}
		if(found)
			$scope.addtype=$scope.items[index].Type;
		else{
			$scope.addtype="Others";
			document.getElementById("otherstype").value=$scope.items[index].Type;
			$scope.othersType=true;
		}
		$scope.adddate=$scope.items[index].Date;
		$scope.addamount=$scope.items[index].Amount;
		$scope.editindex=index;
    }
	$scope.reset = function () {
		$scope.mindate =null;
		$scope.maxdate =null;
		$scope.filtertype="";
		$("#to_date").val("").datepicker("update");
		$("#from_date").val("").datepicker("update");
	}
	
	$scope.othersType=false;
	$scope.checkVal=function(){
		if($scope.addtype == "Others"){
			$scope.othersType=true;
		}else{
			$scope.othersType=false;    
		}
	}
	var d = new Date();
    var mm = d.getMonth()+1;
	var yyyy = d.getFullYear();
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
	
});     
app.filter('rangeFilter', function() {
    return function( items, filtext1, filtext2 ) {
		
		if(filtext1&&filtext2)
		{
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.Date >= filtext1 && item.Date <= filtext2 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext1)
		{
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.Date >= filtext1 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext2)
		{
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
</script>

<script type="text/javascript">
	// When the document is ready
	$(document).ready(function () {
		$('#input_date').datepicker({
			autoclose: true,  
			format: "yyyy-mm-dd"
		});  
	});
</script>

<body ng-app="moneymaster" ng-controller="myCtrl">

<div class="header1">
	<div class = "row">
	<div class = "col-sm-1 col-md-2">
	<img src="utils/logo.jpg" class="logo" />
	</div>
	<div class = "col-sm-2 col-md-2">
	<h2 class="title">Moneymaster</h2>
	</div>
	
	<div class = "col-sm-5 col-md-4">
	
	</div>
	<div class = "col-sm-4 col-md-4">
	</div>
	 
	</div>

	<h2 align = "center">Hi <?php echo $_SESSION["user"]?></h2>
	
	<div class = "container" >	
		
		<div id = "entry" class ="row" >
			
			<div class = "col-sm-1"></div>
			
			<div  class ="col-sm-4" >
				<select ng-change="checkVal()" id = "TypeSelect" class="form-control" ng-model="addtype">
					<option value="">Type</option>
					<<option ng-repeat="x in types|orderBy:'Type'" value="{{x.Type}}">{{x.Type}}</option>
				</select>
				
				<input ng-show="othersType" type = "text" placeholder = "Others" id ="otherstype" style = "width:100%"/>
			
			</div>
			
			<div  class ="col-sm-2" >
				<input type="decimal" id = "amount" placeholder="Amount" ng-model="addamount"> 
			</div>
	
			<div  class ="col-sm-2" >
				<input type="text" id="input_date" placeholder="Select date" />
			</div>
			
			<div  class ="col-sm-2" >
				<button ng-click="addItem()" class="btn btn-block btn-success"> Add </button> 
			</div>
			
			<div class = "col-sm-1"></div>
		</div>

</br>

		<div id = "filter" class = "row">
			<div class = "col-sm-3"></div>
			<div class = "col-sm-1">
				<button class="btn btn-info" onclick="window.location='report.html';"> Report </button>
			</div>
	
			<div class = "col-sm-1" ><div align = "right"><label>Filter By:</label></div></div>
	
			<div  class ="col-sm-2" >			
				<select id = "Type" ng-model="filtertype" class="form-control">
					<option value="">Type</option>
					<option ng-repeat="x in items | rangeFilter:mindate:maxdate| unique:'Type' |orderBy:'Type'" value="{{x.Type}}">{{x.Type}}</option>
				</select>
			</div>

			<div  class ="col-sm-2" >
				<input type="text" id="from_date"  placeholder="Select from date" ng-model="mindate">
			</div>
			
			<div  class ="col-sm-2" >
				<input type="text" id="to_date"  placeholder="Select to date" ng-model="maxdate">
			</div>
			
			<div  class ="col-sm-1" align = "right">
				<button class="btn btn-block btn-success" ng-click="reset()"> Clear </button>
			</div>  
		</div>
		<div class= "row">
			
			<div align = "right">
			<h4 >Total Expense:{{ filtered|total}}</h4>
			</div>
		</div>

	</div>

<div class="row">

<div  align= "center">
		<dir-pagination-controls
		   max-size="8"
		   direction-links="true"
		   boundary-links="true" >
		</dir-pagination-controls>
</div>
	
</div>
<table style="background-color:#ffff">
	<tr style="background-color:#595757;color:#ffff"><td>Type</td><td>Amount</td><td>Date</td><td>Delete</td></tr>
    <tr dir-paginate="x in filtered =(items | orderBy:'-Date'| rangeFilter:mindate:maxdate| filter:{ Type: filtertype })|itemsPerPage:10" ng-class-even="'trcolour'" ><td> {{x.Type}} </td><td>  {{x.Amount}} </td><td> {{x.Date}}</td><td><span ng-click="editItem(x)">edit</span> | <span ng-click="removeItem(x)">clear</span></td></tr>
</table>
</div>
</body>

</html>