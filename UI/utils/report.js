var app = angular.module("moneymaster", []); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.items = [];
	$scope.user=window.localStorage.getItem('user');
	$scope.editindex=-1;
	$scope.addamount=""
	$scope.adddate=""
	$scope.addtype=""
	$http({
		method: 'GET',
		url: 'http://localhost:5001/moneymaster/expenses?user='+$scope.user
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			post = success.data[i];
			$scope.items.push({'Dbid':post.dbid,'Date':post.date,'Type':post.type,'Amount':post.amount,'IsCredit':post.isCredit,'User':post.user});
		}
	},function (error,status){
		alert(status);
	});
	var d = new Date();
	var minimum = new Date(d.getTime() - (59 * 24 * 60 * 60 * 1000));
	var mm = d.getMonth()+1;
	var yyyy = d.getFullYear();
	if(mm<10) {
		mm = '0'+mm;
	} 
	var d = yyyy+'-'+mm+'-'+'01';
	var day =minimum.getDate();
	var month=minimum.getMonth()+1;
	if(month<10) {
		month = '0'+month;
	} 
	if(day<10) {
		day = '0'+day;
	} 
	var year=minimum.getFullYear();
	var minimumdate= year+'-'+month+'-'+day;
	$scope.mindate = d;
	$scope.reset = function () {
		$scope.mindate =null;
		$scope.maxdate =null;
		$("#to_date").val("").datepicker("update");
		$("#from_date").datepicker('setDate', d);
	}
	$('#from_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).datepicker('setDate', $scope.mindate).on('changeDate', function (ev) {$scope.changeFromDate();});
	$('#to_date').datepicker({
		autoclose: true,  
		format: "yyyy-mm-dd",
	}).on('changeDate', function (ev) {$scope.maxdate = $("#to_date").val();$scope.$apply();});
	$scope.downloadreport = function () {
		var data1=$scope.mindate;
		var data2=$scope.maxdate;
		var dataString = 'mindate='+ data1 + '&maxdate='+ data2;
		window.location = 'download.html?'+dataString;
	}
	$scope.changeFromDate = function () {
		$scope.mindate = $("#from_date").val();
		if($scope.mindate < minimumdate){
			
		$scope.items = [];
			$http({
				method: 'GET',
				url: 'http://localhost:5001/moneymaster/expenses?user='+$scope.user+'&startDate='+$scope.mindate
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			post = success.data[i];
			$scope.items.push({'Dbid':post.dbid,'Date':post.date,'Type':post.type,'Amount':post.amount,'IsCredit':post.isCredit,'User':post.user});
		}
	},function (error,status){
		alert(status);
	});
		}
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