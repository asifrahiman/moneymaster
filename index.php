<!DOCTYPE html>
<?php
session_start();
if(isset($_POST["user"]))
{
	$_SESSION["user"] = $_POST["user"];
	setcookie('user', $_POST["user"], time() + (86400 * 10), "/");
}
elseif(isset($_COOKIE['user']))
{
	$_SESSION["user"] =$_COOKIE['user'];
    setcookie('user', $_SESSION["user"], time() + (86400 * 10), "/");    
}
elseif(!isset($_SESSION['user']))
{
	header("Location: login.php");
	die();
}
elseif(isset($_SESSION['user']))
{
	setcookie('user', $_SESSION["user"], time() + (86400 * 10), "/");    
}
?>
<html>
<head>
<meta charset="UTF-8"/>
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="description" content="Bandwidth Utilisation"/>
<meta name="author" content="Asif Abdul Rahiman"/>
<title>Moneymaster</title>
<link rel="shortcut icon" href="utils/favicon.ico" type="image/x-icon"/>
<link rel="icon" href="utils/favicon.ico" type="image/x-icon"/>
<link rel="stylesheet" type="text/css" href="utils/mystyle.css"/>
<link href="utils/bootstrap.min.css" rel="stylesheet"/>  
<link href="utils/bootstrap-datepicker.css" rel="stylesheet"/>  
<script src="utils/jquery.js" ></script> 
<script src="utils/bootstrap.min.js"></script> 
<script src="utils/bootstrap-datepicker.js"></script>
<script src="utils/angular.min.js"></script>
<script src="utils/dirPagination.js"></script>
<script src="utils/angularapp.js"></script>
</head>
<body ng-app="moneymaster" ng-controller="myCtrl">
<div class="header1">
	<?php include("utils/header.php");?>
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
			<div  class ="col-sm-3" >
				<input type="decimal" id = "amount" placeholder="Amount" ng-model="addamount"> 
				<label class="switch">
				  <input type="checkbox" ng-model="addiscredit">
				  <span class="slider round"></span>
				</label>
			</div>
			<div  class ="col-sm-2" >
				<input type="text" id="input_date" placeholder="Select date" ng-model="adddate"/>
			</div>
			<div  class ="col-sm-1" >
				<button ng-click="addItem()" class="btn btn-block btn-success"> Add </button> 
			</div>
			<div class = "col-sm-1"></div>
		</div>
		</br>
		<div id = "filter" class = "row">
			<div class = "col-sm-2"></div>
			<div class = "col-sm-1">
				<button class="btn btn-info" onclick="window.location='report.php';"> Report </button>
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
			<div  class ="col-sm-3" >
				<input type="text" id="to_date"  placeholder="Select to date" ng-model="maxdate">
				<label class="switch">
				  <input type="checkbox" ng-change="creditfiltervalue()" ng-model="filtercredit">
				  <span class="slider round"></span>
				</label>
			</div>			
			<div  class ="col-sm-1" align = "right">
				<button class="btn btn-block btn-success" ng-click="reset()"> Clear </button>
			</div>  
		</div>
		<div class= "row">
			<div  class ="col-sm-7"></div>
			<div  class ="col-sm-3 pull-right" >
				<h4 >Credit Card:{{ filtered|credittotal}}</h4>
			</div>
			<div  class ="col-sm-2 pull-right" >
				<h4 >Expense:{{ filtered|expense}}</h4>
			</div>
		</div>
		<div class= "row">
		<div  class ="col-sm-9"></div>
			<div  class ="col-sm-3 pull-right" >
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
		<p ng-init="Credit='(Credit)'"/>
	</div>
	<table style="background-color:#ffff">
		<tr style="background-color:#595757;color:#ffff"><td>Type</td><td>Amount</td><td>Date</td><td>Delete</td></tr>
		<tr dir-paginate="x in filtered =(items | orderBy:'-Date'| rangeFilter:mindate:maxdate| filter:{ Type: filtertype}| filter:{ IsCredit: creditfilter })|itemsPerPage:10" ng-class-even="'trcolour'" ng-class="{'redborder': x.IsCredit ==1}"><td style="max-width:30%"> {{x.Type}}</td><td>  {{x.Amount}} </td><td> {{x.Date}}</td><td><span ng-click="editItem(x)">edit</span> | <span ng-click="removeItem(x)">clear</span></td></tr>
	</table>
</div>
</body>
</html>