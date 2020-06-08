var app = angular.module("userlist", []); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.users = [];
	$http({
      method: 'GET',
      url: 'http://localhost:5001/moneymaster/user'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			//debugger
			post = success.data[i];
			$scope.users.push({'User':post.user,'Id':post.id});
		}
	},function (error){
		alert(error.data);
	});  
    
    $scope.addItem = function () {
        $scope.errortext = "";
		if (!$scope.adduser) {alert("Please fill all the details");return;} 
		var nuser={'User':$scope.adduser};
		var newuser=true;
		angular.forEach($scope.users, function(item) {
			if( item.User.indexOf(nuser.User)==0){
				newuser=false;
			}
		});
		if(newuser){
			var data1=$scope.adduser;
			var dataString = '?user='+ data1;
			$scope.adduser=""
			$http({
				method: 'POST',
				url: 'http://localhost:5001/moneymaster/user'+dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				var post = success.data;
				$scope.users.push({'User':post.user,'Id':post.id});
				$scope.addtype="";
			},function (error){
				alert(error.data);
			});
		}
		else{
			alert('User already present');
		}
	}
    $scope.removeItem = function (x) {
		var index = $scope.users.indexOf(x);
		if (index != -1) {
			$scope.errortext = ""; 
			var dataString = '/'+ $scope.users[index].Id ;
			$http({
				method: 'DELETE',
				url: 'http://localhost:5001/moneymaster/user'+dataString
			}).then(function (data, status, headers, config){
				$scope.users.splice(index, 1);
			},function (data, status, headers, config){
				alert(data, status, headers, config);
			});
		}
    }
});