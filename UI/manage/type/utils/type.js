var app = angular.module("typelist", []); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.type = [];
	$http({
      method: 'GET',
      url: 'http://localhost:5001/moneymaster/type'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			//debugger
			post = success.data[i];
			$scope.type.push({'Type':post.type,'Id':post.id});
		}
	},function (error){
		alert(error.data);
	});  
    
    $scope.addItem = function () {
        $scope.errortext = "";
		if (!$scope.addtype) {alert("Please fill the details");return;} 
		var ntype={'Type':$scope.addtype};
		var newtype=true;
		angular.forEach($scope.type, function(item) {
			if( item.Type.indexOf(ntype.Type)==0){
				newtype=false;
			}
		});
		if(newtype){
			var data1=$scope.addtype;
			var dataString = '?type='+ data1 ;
			$http({
				method: 'POST',
				url: 'http://localhost:5001/moneymaster/type'+dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				var post = success.data;
				$scope.type.push({'Type':post.type,'Id':post.id});
				$scope.addtype="";
			},function (error){
				alert(error.data);
			});
		}
		else{
			alert('Type already present');
		}
	}
    $scope.removeItem = function (x) {
		var index = $scope.type.indexOf(x);
		if (index != -1) {
			$scope.errortext = ""; 
			var dataString = '/'+ $scope.type[index].Id ;
			$http({
				method: 'DELETE',
				url: 'http://localhost:5001/moneymaster/type'+dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				$scope.type.splice(index, 1);
			},function (error){
				alert(error.data);
			});
		}
    }
});