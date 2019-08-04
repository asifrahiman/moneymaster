var app = angular.module("userlist", []); 
app.controller("myCtrl", function($scope, $filter,$http) {
    $scope.users = [];
	$http({
      method: 'GET',
      url: 'utils/user.php'
	}).then(function (success){
		var _len = success.data.length;
		var  post, i;
		for (i = 0; i < _len; i++) {
			//debugger
			post = success.data[i];
			$scope.users.push({'User':post.user});
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
			$scope.users.push(nuser);
			var data1=$scope.adduser;
			var dataString = 'user='+ data1 + '&action=POST';
			$scope.adduser=""
			$http({
				method: 'POST',
				url: 'utils/user.php',
				data: dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				$scope.users.push(nuser);
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
			var dataString = 'user='+ $scope.users[index].User + '&action=DELETE';
			$http({
				method: 'POST',
				url: 'utils/user.php',
				data: dataString,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			}).then(function (success){
				$scope.users.splice(index, 1);
			},function (error){
				alert(error.data);
			});
		}
    }
});