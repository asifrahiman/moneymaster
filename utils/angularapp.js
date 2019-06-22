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
	$http({
		method: 'GET',
		url: 'get.php'
	}).then(function (success){
	var _len = success.data.length;
	var  post, i;
	for (i = 0; i < _len; i++) {
		post = success.data[i];
		$scope.items.push({'Dbid':post.dbid,'Date':post.date,'Type':post.type,'Amount':post.amount,'IsCredit':post.isCredit});
	}
	},function (error){
		alert(error);
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
	}},function (error){
		alert(error);
	});
	$scope.addItem = function () {
		var data1=$scope.addtype;
		var data2=$scope.adddate;
		var data3=$scope.addamount;
		var data5=$scope.addiscredit==true&&1||0;
		if($scope.addtype=="Others")
			$scope.addtype=document.getElementById("otherstype").value;
        if (!$scope.addamount||!$scope.addtype||!$scope.adddate){alert("Please fill all the details");return;} 
		if($scope.editindex==-1){
			var nitem={'Date':$scope.adddate,'Type':$scope.addtype,'Amount':$scope.addamount,'IsCredit':data5};
			$scope.items.push(nitem);
			var dataString = 'type='+ data1 + '&date='+ data2 + '&amount='+ data3+ '&isCredit='+ data5 ;
			$.ajax({
				type: "POST",
				url: "add.php",
				data: dataString,
				cache: false,
				success: function(result){
					$scope.items[$scope.items.indexOf(nitem)].Dbid=parseInt(result);
				},
				error: function(request,status,errorThrown) {
					alert("error occured:"+errorThrown);
				}
			});
		}
		else
		{
			$scope.items[$scope.editindex].Type=$scope.addtype;
			$scope.items[$scope.editindex].Date=$scope.adddate;
			$scope.items[$scope.editindex].Amount=$scope.addamount;
			$scope.items[$scope.editindex].IsCredit=data5;
			var data4=$scope.items[$scope.editindex].Dbid;
			var dataString = 'type='+ data1 + '&date='+ data2 + '&amount='+ data3 +'&dbid='+ data4 + '&isCredit='+ data5;
			$.ajax({
				type: "POST",
				url: "update.php",
				data: dataString,
				cache: false,
				success: function(result){},
				error: function(request,status,errorThrown) {
					alert("error occured:"+errorThrown);
				}
			});
		}
		$scope.addtype=""
		$scope.addamount=""
		$scope.editindex=-1;
		$scope.othersType=false;
		$scope.addiscredit=false;
		$scope.adddate=today;
		$("#input_date").datepicker('setDate', today);
		document.getElementById("otherstype").value="";
	}
	$scope.removeItem = function (x) {
		var index = $scope.items.indexOf(x);
		if (index != -1) {
		var datastring = 'dbid='+ $scope.items[index].Dbid;
		$.ajax({
		type: "POST",
		url: "remove.php",
		data: datastring,
		cache: false,
		success: function(result){},
		error: function(request,status,errorThrown) {
			alert("error occured");
		}
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
		$scope.addiscredit=$scope.items[index].IsCredit==1&&true||false;
		$("#input_date").datepicker('setDate', $scope.adddate);
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
	if(mm<10) {
		mm = '0'+mm
	} 
	var d = yyyy+'-'+mm+'-'+'01';
	$scope.mindate = d;
	$('#input_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd"
	}).datepicker('setDate', $scope.adddate).on('changeDate', function (ev) {$scope.adddate = $("#input_date").val();$scope.$apply();});
	$('#from_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).datepicker('setDate', $scope.mindate).on('changeDate', function (ev) {$scope.mindate = $("#from_date").val();$scope.$apply();});
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
app.filter('expense', function () {
	return function (items) {
	var i =  items.length;
	var expense = 0;
	while (i--)
		if(items[i]['IsCredit']==0)
		{
			if(items[i]['Type']=="Credit")
				expense -= parseFloat(items[i]['Amount']);
			else
				expense += parseFloat(items[i]['Amount']);
		}
	return expense.toFixed(2);
	}
});