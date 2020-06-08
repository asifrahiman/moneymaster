var app = angular.module("moneymaster", ['angularUtils.directives.dirPagination']); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.items = [];
	$scope.types =[];
	$scope.editindex=-1;
	$scope.addamount="";
	$scope.adddate="";
	$scope.addtype="";
	$scope.addiscredit=false;
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	if(dd<10) {
		dd = '0'+dd;
	} 
	if(mm<10) {
		mm = '0'+mm;
	} 
	today = yyyy + '-' + mm + '-' + dd;
	$scope.adddate=today;
	$scope.init = function () {
	$scope.items = [];
	$scope.types =[];
	$scope.user=window.localStorage.getItem('user');
	$http({
		method: 'GET',
		url: 'http://localhost:5001/moneymaster/expenses?user='+$scope.user
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			post = success.data[i];
			$scope.items.push({'id':post.id,'date':post.date,'type':post.type,'amount':post.amount,'isCredit':post.isCredit,'user':post.user});
		}
	},function (error,status){
		alert(status);
	});
	$http({
		method: 'GET',
		url: 'http://localhost:5001/moneymaster/type'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			post = success.data[i];
			$scope.types.push({'type':post.type,'id':post.id});
	}
	},function (error){
		alert(error.data);
	});
	}
	$scope.addItem = function () {
		if($scope.addtype=="Others")
		$scope.addtype=document.getElementById("otherstype").value;
		var data1=$scope.addtype;
		var data2=$scope.adddate;
		var data3=$scope.addamount;
		var data5=$scope.addiscredit==true&&1||0;
		
        if (!$scope.addamount||!$scope.addtype||!$scope.adddate){alert("Please fill all the details");return;} 
		if($scope.editindex==-1){
			var nitem={"date": data2,"type": data1,"amount": data3,"isCredit": data5,"user": $scope.user};
			$http({
				method: 'POST',
				url: 'http://localhost:5001/moneymaster/expenses',
				data: nitem,
				headers: {'Content-type': 'application/json'}
			}).then(function (success){
				nitem.id=success.data.id;
				$scope.items.push(nitem);
			},function (error){
				alert(error.data);
			});
		}
		else
		{
			var index=$scope.editindex;
			var data4=$scope.items[index].id;
			var nitem={"date": data2,"type": data1,"amount": data3,"isCredit": data5,"user": $scope.user,"id": data4};
			$http({
				method: 'PUT',
				url: 'http://localhost:5001/moneymaster/expenses',
				data: nitem,
				headers: {'Content-type': 'application/json'}
			}).then(function (success){
				$scope.items[index]=nitem;
			},function (error){
				alert(error.data);
			});
		}
		$scope.addtype=""
		$scope.addamount=""
		$scope.editindex=-1;
		$scope.otherstype=false;
		$scope.addiscredit=false;
		$scope.adddate=today;
		$("#input_date").datepicker('setDate', today);
		document.getElementById("otherstype").value="";
	}
	$scope.removeItem = function (x) {
		var index = $scope.items.indexOf(x);
		if (index != -1 && confirm("Deleting " + $scope.items[index].type + " On " + $scope.items[index].date + " For " + $scope.items[index].amount + "\nAre you sure?")) {
			var dataString = '/'+ $scope.items[index].id;
			$http({
				method: 'DELETE',
				url: 'http://localhost:5001/moneymaster/expenses'+ dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				$scope.items.splice(index, 1);
			},function (error,status){
				alert(status);
			});
		}
	}
	$scope.editItem = function (x) {
		var index = $scope.items.indexOf(x);
		var found=false;
		for (i = 0; i < document.getElementById("typeSelect").length; ++i){
			if (document.getElementById("typeSelect").options[i].value == $scope.items[index].type){
				found=true;
			}
		}
		if(found)
			$scope.addtype=$scope.items[index].type;
		else{
			$scope.addtype="Others";
			document.getElementById("otherstype").value=$scope.items[index].type;
			$scope.otherstype=true;
		}
		$scope.adddate=$scope.items[index].date;
		$scope.addamount=$scope.items[index].amount;
		$scope.editindex=index;
		$scope.addiscredit=$scope.items[index].isCredit==1&&true||false;
		$("#input_date").datepicker('setDate', $scope.adddate);
    }
	$scope.creditfiltervalue = function () {
		$scope.creditfilter=$scope.filtercredit==true&&1||0;
	}
	
	$scope.otherstype=false;
	$scope.checkVal=function(){
		if($scope.addtype == "Others"){
			$scope.otherstype=true;
		}else{
			$scope.otherstype=false;    
		}
	}
	var d = new Date();
    var mm = d.getMonth()+1;
	var yyyy = d.getFullYear();
	if(mm<10) {
		mm = '0'+mm
	} 
	var d = yyyy+'-'+mm+'-'+'01';
	$scope.mindate = d;
	$('#input_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd"
	}).datepicker('setDate', $scope.adddate).on('changeDate', function (ev) {$scope.adddate = $("#input_date").val();});	
	$('#from_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).datepicker('setDate', $scope.mindate).on('changeDate', function (ev) {$scope.mindate = $("#from_date").val();});
	$('#to_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).on('changeDate', function (ev) {$scope.maxdate = $("#to_date").val();});
	$scope.reset = function () {
		$scope.mindate = d;
		$scope.maxdate =null;
		$scope.creditfilter ='';
		$scope.filtercredit =false;
		$scope.filtertype="";
		$("#to_date").val("").datepicker("update");
		$("#from_date").datepicker('setDate', d);
	}
	
});     
app.filter('rangeFilter', function() {
    return function( items, filtext1, filtext2 ) {
		
		if(filtext1&&filtext2)
		{
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.date >= filtext1 && item.date <= filtext2 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext1)
		{
			var filtered = [];
			angular.forEach(items, function(item) {
				if( item.date >= filtext1 ) {
					filtered.push(item);
				}
			});
			return filtered;
		}
		else if(filtext2)
		{
			var filtered = [];
			angular.forEach(items, function(item) {
				if(item.date <= filtext2 ) {
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
		if(items[i]['type']=="Credit")
			total -= parseFloat(items[i]['amount']);
		else
			total += parseFloat(items[i]['amount']);
	return total.toFixed(2);
	}
});
app.filter('credittotal', function () {
	return function (items) {
	var i =  items.length;
	var  credittotal= 0;
	while (i--)
		if(items[i]['isCredit']==1)
		{
			credittotal += parseFloat(items[i]['amount']);
		}
	return credittotal.toFixed(2);
	}
});
app.filter('expense', function () {
	return function (items) {
	var i =  items.length;
	var expense = 0;
	while (i--)
		if(items[i]['isCredit']==0)
		{
			if(items[i]['type']=="Credit")
				expense -= parseFloat(items[i]['amount']);
			else
				expense += parseFloat(items[i]['amount']);
		}
	return expense.toFixed(2);
	}
});